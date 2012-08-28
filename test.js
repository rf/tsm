var assert = require("assert");
var tsm = require("./index");
var path = require('path');

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
    tsm.getBranches(function (error, data) {
      assert(error === null);
      assert(Array.isArray(data));
      assert(data.indexOf('master') != -1, "master is in branch list");
      assert(data.indexOf('2_0_X') != -1, "2_0_X is in branch list");
      done();
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

suite('getBuildList', function () {

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
});

suite('getBuilds', function () {
  test('functional: retrieval of branch master', function (done) {
    this.timeout(10000);
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
});

suite('getAllBuilds', function () {
  test('functional', function (done) {
    this.timeout(10000);
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

  test('parses correctly', function () {
    var res = tsm.parseVersionFile(file);
    assert(res.version === '2.1.0');
    assert(res.timestamp === '05/02/12 14:18');
    assert(res.githash === 'cde5b27');
  });
});

suite('examineDir', function () {
  test('handles an invalid dir correctly', function (done) {
    var dir = path.join(__dirname, 'fixtures', '1', '.DS_Store');
    tsm.examineDir(dir, function (error, data) {
      if (error instanceof Error) done();
      else done(new Error("expected error"));
    });
  });

  test('handles a valid dir correctly', function (done) {
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
    tsm.findInstalled(dir, undefined, function (error, builds) {
      try {
        assert(builds.length === 1, "only 1 result");

        assert(builds[0].version === '2.1.0');
        assert(builds[0].githash === 'cde5b27');
        done();
      } catch (e) { done(e); }
    });
  });
});
