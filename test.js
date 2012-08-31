var EventEmitter = require("events").EventEmitter;

// simple child process mocking
var oldspawn = require('child_process').spawn;
var spawned;
var spawnerror = false;
require('child_process').spawn = function (name, args) {
  spawned = {name: name, args: args};
  var emitter = new EventEmitter();
  emitter.stdout = {pipe: function () {}};
  emitter.stderr = {pipe: function () {}};

  process.nextTick(function () {
    if (spawnerror) emitter.emit('end', 127);
    else emitter.emit('exit', 0);
  });
  return emitter;
};

var assert = require("assert");
var tsm;
if (process.env.TSM_COV) tsm = require("./lib-cov/index");
else tsm = require('./index');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var nock = require('nock');
var fs = require('fs');
if (!fs.exists) fs.exists = path.exists;
var ncp = require('ncp').ncp;
var rimraf = require('rimraf');

suite('gitCheck', function () {
  var hash0 = "e721f1820f65368794aee29e2da8ebc03de804fd";
  var hash1 = "e2a219dceb3026e73be3afab4591aa3ba627d58b";

  test('matches properly', function () {
    assert(tsm.gitCheck('e721', hash0) === true);
    assert(tsm.gitCheck('e2', hash0) === false);
    assert(tsm.gitCheck('e2', hash1) === true);
  });

  test('handles invalid input', function () {
    assert(tsm.gitCheck(false, hash0) === false);
    assert(tsm.gitCheck('1', hash0) === false);
    assert(tsm.gitCheck({}, hash0) === false);
  });
});

suite('getBranches', function () {
  test('functional', function (done) {
    var scope = nock('http://builds.appcelerator.com.s3.amazonaws.com')
        .get('/mobile/branches.json')
        .replyWithFile(200, __dirname + "/fixtures/branches.json");

    tsm.getBranches(function (error, data) {
      try {
        assert(error === null);
        assert(Array.isArray(data));
        assert(data.indexOf('master') != -1, "master is in branch list");
        assert(data.indexOf('2_0_X') != -1, "2_0_X is in branch list");
        scope.done();
        done();
      } catch (e) { done(e); }
    });
  });

  test('handles 404', function (done) {
    var scope = nock('http://builds.appcelerator.com.s3.amazonaws.com')
        .get('/mobile/branches.json')
        .reply(404);

    tsm.getBranches(function (error, data) {
      try {
        assert(error instanceof Error, "got error");
        scope.done();
        done();
      } catch (e) { done(e); }
    });
  });
});

suite('parseDate', function () {
  var date0 = "20120827132447";

  test('parses properly', function () {
    var date = tsm.parseDate(date0);

    // Months are zero indexed so we're really testing if the month is August
    assert(date.getMonth() === 7, "check month");

    assert(date.getDate() === 27, "check day of month");
    assert(date.getHours() === 13, "check hour");
  });
});

suite('parseBuildList', function () {
  var list = [
    {
      "sha1": "2a60ec1e0b693047e6fa9112fe93944c5432a3c3",
      "build_url": "http://jenkins.appcelerator.org/job/titanium_mobile_master/1277/",
      "git_revision": "c63b0d947da94e2cdfb3fb06e95106cb803c3f22",
      "filename": "mobilesdk-2.1.0.v20120827132447-win32.zip",
      "git_branch": "master",
      "build_type": "mobile",
      "size": 26961576
    },
    {
      "sha1": "7be939ed222691536b8b32ad0782e4729a9d447c",
      "build_url": "http://jenkins.appcelerator.org/job/titanium_mobile_master/1278/",
      "git_revision": "79e9c73d5070fc4306d37bc1cf8cbabb2ad67ae8",
      "filename": "mobilesdk-2.2.0.v20120827143312-osx.zip",
      "git_branch": "master",
      "build_type": "mobile",
      "size": 80186079
    },
    {
      "sha1": "a0c6a6cbf334752cf9e2f23be37ee11e63af0a1b",
      "build_url": "http://jenkins.appcelerator.org/job/titanium_mobile_master/1278/",
      "git_revision": "79e9c73d5070fc4306d37bc1cf8cbabb2ad67ae8",
      "filename": "mobilesdk-2.2.0.v20120827143312-linux.zip",
      "git_branch": "master",
      "build_type": "mobile",
      "size": 26960385
    },
    {
      "sha1": "92ffcd16454b38d8eca203a4b36352ec140504ec",
      "build_url": "http://jenkins.appcelerator.org/job/titanium_mobile_master/1278/",
      "git_revision": "79e9c73d5070fc4306d37bc1cf8cbabb2ad67ae8",
      "filename": "mobilesdk-2.2.0.v20120827143312-win32.zip",
      "git_branch": "master",
      "build_type": "mobile",
      "size": 26961706
    }
  ];

  test('parses out correct os', function () {
    var ret = tsm.parseBuildList(null, 'osx', list);
    ret.forEach(function (build) {
      assert(build.filename.indexOf('win32') === -1, 'no win32 buids');
      assert(build.filename.indexOf('linux') === -1, 'no linux buids');
    });
  });

  test('matches git hashes properly', function () {
    var ret = tsm.parseBuildList('79e9', 'linux', list);
    assert(ret.length === 1, "only one result");
    assert(
      ret[0].sha1 === "a0c6a6cbf334752cf9e2f23be37ee11e63af0a1b",
      "correct build matched"
    );
  });

  test('matches versions properly', function () {
    var ret = tsm.parseBuildList('2.1', 'win32', list);
    assert(ret.length === 1, "only one result");
    assert(
      ret[0].sha1 === "2a60ec1e0b693047e6fa9112fe93944c5432a3c3",
      "correct build matched"
    );
  });

  test('handles malformed filename', function () {
    var malformed = [
      {
        "sha1": "a0c6a6cbf334752cf9e2f23be37ee11e63af0a1b",
        "build_url": "http://jenkins.appcelerator.org/job/titanium_mobile_master/1278/",
        "git_revision": "79e9c73d5070fc4306d37bc1cf8cbabb2ad67ae8",
        "filename": "mobilessdf92jfjlllssssssssssfoooooo312-linux.zip",
        "git_branch": "master",
        "build_type": "mobile",
        "size": 26960385
      }
    ];

    // just want to make sure it doesn't throw
    var ret = tsm.parseBuildList(undefined, 'linux', malformed);
  });
});

suite('getBuilds', function () {
  test('functional: retrieval of branch master', function (done) {
    var scope = nock('http://builds.appcelerator.com.s3.amazonaws.com')
        .get('/mobile/master/index.json')
        .replyWithFile(200, __dirname + '/fixtures/master-index.json');

    tsm.getBuilds('master', function (error, data) {
      try { 
        assert(error === null, "no error");
        assert(Array.isArray(data), "return is an array");
        assert(data.length > 4, "more than 4 items");
        data.forEach(function (item) {
          assert(item.sha1);
          assert(item.filename);
          assert(typeof item.size === "number");
        });
        done();

      } catch (e) { done(e); }
    });
  });

  test('handles 404', function (done) {
    var scope = nock('http://builds.appcelerator.com.s3.amazonaws.com')
        .get('/mobile/master/index.json')
        .reply(404);

    tsm.getBuilds('master', function (error, data) {
      try {
        assert(error instanceof Error, "expected error");
        scope.done();
        done();
      } catch (e) { done(e); }
    });
  });

  test('handles malformed json', function (done) {
    var scope = nock('http://builds.appcelerator.com.s3.amazonaws.com')
        .get('/mobile/master/index.json')
        .reply(200, "}}}[[[[");

    tsm.getBuilds('master', function (error, data) {
      try {
        assert(error instanceof SyntaxError, "expected error");
        scope.done();
        done();
      } catch (e) { done(e); }
    });
  });
});

suite('getAllBuilds', function () {
  test('functional', function (done) {
    var scope = nock('http://builds.appcelerator.com.s3.amazonaws.com')
        .get('/mobile/branches.json')
        .replyWithFile(200, __dirname + "/fixtures/branches.json");

    var branches = ["master", "1_4_X", "1_5_X", "1_6_X", "1_7_X", "1_8_X", "2_0_X", "2_1_X"];
    branches.forEach(function (b) {
      scope
        .get('/mobile/'+b+'/index.json')
        .replyWithFile(200, __dirname + '/fixtures/' + b + '-index.json');
    });

    tsm.getAllBuilds('2.1.x', 'linux', function (error, builds) {
      try {
        if (error) throw error;
        assert(Array.isArray(builds), "return is an array");
        assert(builds.length > 4, "more than 4 items");

        for (var i = 0; i < builds.length; i++) {
          var b = builds[i];
          assert(b.sha1, "build has a sha1");
          assert(b.date.getDay, "build has a date object");
          assert(b.zip, "build has a zip url");
        }

        scope.done();
        done();
      } catch (e) { done(e); }
    });
  });
});

suite('parseVersionFile', function () {
  var file = "version=2.1.0\n"+
    "module_apiversion=2\n"+
    "timestamp=05/02/12 14:18\n" +
    "githash=cde5b27";

  var malformedFile = "======asdf== ==\n\n\nsfoij3===!!!!!!!";

  test('parses', function () {
    var res = tsm.parseVersionFile(file);
    assert(res.version === '2.1.0');
    assert(res.timestamp === '05/02/12 14:18');
    assert(res.githash === 'cde5b27');
  });

  test("doesn't die with invalid input", function () {
    var res = tsm.parseVersionFile(malformedFile);
  });
});

suite('examineDir', function () {
  test('handles a dir w/o version.txt', function (done) {
    var dir = path.join(__dirname, 'fixtures', '1', '.DS_Store');
    tsm.examineDir(dir, function (error, data) {
      if (error instanceof Error) done();
      else done(new Error("expected error"));
    });
  });

  test('handles dir with malformed version.txt', function (done) {
    var dir = path.join(__dirname, 'fixtures', '1', 'malformed');
    tsm.examineDir(dir, function (error, data) {
      if (error instanceof SyntaxError) done();
      else done(new Error("expected error"));
    });
  });

  test('handles a valid dir', function (done) {
    var dir = path.join(__dirname, 'fixtures', '1', '2.1.0');
    tsm.examineDir(dir, function (error, data) {
      try {
        if (error) throw error;
        assert(data.version === '2.1.0');
        assert(data.timestamp === '05/02/12 14:18');
        assert(data.githash === 'cde5b27');
        done();
      } catch (e) { done(e); }
    });
  });
});

suite('findInstalled', function () {
  test('functional', function (done) {
    var dir = path.join(__dirname, 'fixtures', '1');
    var e = tsm.findInstalled(dir, undefined, function (error, builds) {
      try {
        assert(builds.length === 2, "2 results");

        assert(builds[1].version === '2.1.0');
        assert(builds[1].githash === 'cde5b27');
        assert(builds[1].date.getDay, "has a valid date object");
        done();
      } catch (e) { done(e); }
    });
    assert(e instanceof EventEmitter);
  });
});

suite('mergeBuilds', function () {
  var installed = [
    { githash: '0a43607',
      version: '2.1.1',
      date: new Date("Tue, 17 Jul 2012 02:46:00 GMT") },
    { githash: 'c63b0d9',
      version: '2.1.0',
      date: new Date("Fri, 27 Jul 2012 18:01:00 GMT") },
    { githash: '61078b0',
      version: '2.2.0',
      date: new Date("Fri, 10 Aug 2012 23:41:00 GMT") }
  ];

  var available = [
    {
      "sha1": "2a60ec1e0b693047e6fa9112fe93944c5432a3c3",
      "build_url": "http://jenkins.appcelerator.org/job/titanium_mobile_master/1277/",
      "git_revision": "c63b0d947da94e2cdfb3fb06e95106cb803c3f22",
      "githash": "c63b0d9",
      "filename": "mobilesdk-2.1.0.v20120827132447-osx.zip",
      "git_branch": "master",
      "build_type": "mobile",
      "date": new Date(),
      "size": 26961576
    },
    {
      "sha1": "7be939ed222691536b8b32ad0782e4729a9d447c",
      "build_url": "http://jenkins.appcelerator.org/job/titanium_mobile_master/1278/",
      "git_revision": "79e9c73d5070fc4306d37bc1cf8cbabb2ad67ae8",
      "githash": "79e9c73",
      "filename": "mobilesdk-2.2.0.v20120827143312-osx.zip",
      "git_branch": "master",
      "build_type": "mobile",
      "date": new Date(),
      "size": 80186079
    },
    {
      "sha1": "a0c6a6cbf334752cf9e2f23be37ee11e63af0a1b",
      "build_url": "http://jenkins.appcelerator.org/job/titanium_mobile_master/1278/",
      "git_revision": "39bc239d5070fc4306d37bc1cf8cbabb2ad67ae8",
      "githash": "39bc239",
      "filename": "mobilesdk-2.2.0.v20120827143312-osx.zip",
      "git_branch": "master",
      "build_type": "mobile",
      "date": new Date(),
      "size": 26960385
    }
  ];

  test('merges correctly', function () {
    var merged = tsm.mergeBuilds(available, installed);
    assert(merged.length === 5);

    // pull out the one that should've been merged
    var mergedEntry = merged.filter(function (item) { 
      return item.githash === 'c63b0d9'; 
    });

    assert(mergedEntry.length === 1);
    assert(mergedEntry[0].installed === true, "merged entry marked as installed");

    var availableEntry = merged.filter(function (item) {
      return item.githash === '79e9c73';
    });

    assert(availableEntry.length === 1);
    assert(availableEntry[0].installed === false);

    // pull out the one that should've been merged
    var installedEntry = merged.filter(function (item) { 
      return item.githash === '61078b0'; 
    });

    assert(installedEntry.length === 1);
    assert(installedEntry[0].installed === true);
  });
});

suite('list', function () {
  
  test('handles missing / malformed os parameter', function () {
    try {
      tsm.list({available: true, os: 7}, function (error, data) {});
    } catch (e) {
      assert(e instanceof TypeError);
    }

    try {
      tsm.list({available: true}, function (error, data) {});
    } catch (e) {
      assert(e instanceof TypeError);
    }
  });

  test('functional: installed', function (done) {
    tsm.list({
      installed: true, 
      os: 'osx', 
      dir: __dirname + "/fixtures/1"
    }, function (error, data) {
      try {
        assert(error === null);
        assert(data.length === 2);
        assert(data[1].githash === 'cde5b27');
        assert(data[1].installed === true);
        assert(data[0].installed === true);
        done();
      } catch (e) { done(e); }
    });
  });

  test('functional: installed and available, input: 2', function (done) {
    var scope = nock('http://builds.appcelerator.com.s3.amazonaws.com')
        .get('/mobile/branches.json')
        .replyWithFile(200, __dirname + "/fixtures/branches.json");

    var branches = ["master", "1_4_X", "1_5_X", "1_6_X", "1_7_X", "1_8_X", "2_0_X", "2_1_X"];
    branches.forEach(function (b) {
      scope
        .get('/mobile/'+b+'/index.json')
        .replyWithFile(200, __dirname + '/fixtures/' + b + '-index.json');
    });

    tsm.list({
      installed: true,
      available: true,
      os: 'osx',
      dir: __dirname + "/fixtures/1",
      input: '2'
    }, function (error, data) {
      try {
        assert(error === null, "no error");

        var installed = data.filter(function (item) { 
          return item.installed; 
        });
        assert(installed.length > 0, "at least one marked as installed");

        data.forEach(function (item) {
          assert(item.installed !== undefined);
          assert(item.githash);
          assert(typeof item.date.getDay === 'function');
        });
        scope.done();
        done();
      } catch (e) { done(e); }
    });
  });

  test('handles missing / malformed dir argument', function () {
    try {
      tsm.list({os: 'osx', installed: true}, function (error, data) {});
    } catch (e) {
      assert(e instanceof TypeError);
    }

    try {
      tsm.list({os: 'osx', installed: true, dir: 7}, function (error, data) {});
    } catch (e) {
      assert(e instanceof TypeError);
    }
  });

});

suite('unzip', function () {
  test('extracts', function (done) {
    var zip = __dirname + "/fixtures/test.zip";
    var output = __dirname + "/fixtures/2/";
    var path = __dirname + "/fixtures/2/index.js";

    tsm.unzip(zip, output, function (error) {
      if (error) done(error);
      fs.exists(path, function (exists) {
        if (!exists) done(new Error("file was not extracted properly"));
        fs.unlink(path, done);
      });
    });

  });
});

suite('install', function () {
  test('functional', function (done) {
    var zip = __dirname + "/fixtures/test.zip";
    var output = __dirname + "/fixtures/2/";
    var zipurl = "/mobile/master/mobilesdk-2.2.0.v20120828153312-osx.zip";
    var path = __dirname + "/1.8.2/version.txt";

    var scope = nock('http://builds.appcelerator.com.s3.amazonaws.com')
        .get('/mobile/branches.json')
        .replyWithFile(200, __dirname + "/fixtures/branches-simple.json")

        .get('/mobile/master/index.json')
        .replyWithFile(200, __dirname + '/fixtures/master-index.json')

        .get(zipurl)
        .replyWithFile(200, __dirname + '/fixtures/sdk.zip');

    var emitter = tsm.install({
      dir: output,
      input: '2',
      os: 'osx'
    }, function (error) {
      try {
        assert(error === null);
        scope.done();

        fs.exists(path, function (exists) {
          if (!exists) done(new Error("file was not extracted properly"));
          rimraf(__dirname + "/1.8.2", done);
        });
      } catch (e) { done(e); }
    });
  });
});

suite('delete', function () {
  test('functional', function (done) {
    var src = __dirname + "/fixtures/1/";
    var sdkdir = __dirname + "/fixtures/2";
    ncp(src, sdkdir, function (err) {
      if (err) return done(err);

      tsm.remove({dir: sdkdir, input: "1.8.x"}, function (error) {
        if (error) return done(error);

        fs.exists(sdkdir + "/1.8.2", function (exists) {
          if (exists) return done(new Error("sdk wasn't deleted"));

          fs.exists(sdkdir + "/2.1.0", function (exists) {
            if (!exists) return done(new Error("wrong sdk deleted"));
            rimraf(sdkdir, function () {
              fs.mkdir(sdkdir, done);
            });
          });
        });
      });
    });
  });
});

suite('builder', function () {
  test('functional: iphone', function (done) {
    var sdkdir = __dirname + "/fixtures/1/";
    var options = {dir: sdkdir, input: '1.8', os: 'iphone', args: ['foo', 'bar']};
    tsm.builder(options, function (error) {
      try {
        assert(spawned.name === "python");
        assert(spawned.args[0] === "/Users/rfranknj/code/tsm/fixtures/1/1.8.2/iphone/builder.py");
        assert(spawned.args[1] === "foo");
        assert(spawned.args[2] === "bar");
        done();
      } catch (e) { done(e); }
    });
  });
});

suite('titanium', function () {
  test('functional', function (done) {
    var sdkdir = __dirname + "/fixtures/1/";
    var options = {dir: sdkdir, input: '1.8', args: ['foo', 'bar']};
    tsm.titanium(options, function (error) {
      try {
        assert(spawned.name === "python");
        assert(spawned.args[0] === "/Users/rfranknj/code/tsm/fixtures/1/1.8.2/titanium.py");
        assert(spawned.args[1] === "foo");
        assert(spawned.args[2] === "bar");
        done();
      } catch (e) { done(e); }
    });
  });
});

