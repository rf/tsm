request = require 'request'
async = require 'async'
semver = require 'semver'

branchesURL = 'http://builds.appcelerator.com.s3.amazonaws.com/mobile/branches.json'
branchURL = 'http://builds.appcelerator.com.s3.amazonaws.com/mobile/$BRANCH/index.json'

# zipURL needs branch/zipname added to it
zipURL = 'http://builds.appcelerator.com.s3.amazonaws.com/mobile/'

gitCheck = (input, revision) ->
  if (input.length > 1) and (revision.indexOf(input) != -1)
    return true
  else
    return false

# list available api versions
exports.list = (app, input, cb) ->

  # request the list of branches
  request branchesURL, (error, response, body) ->
    try
      if error then throw error
      data = (JSON.parse body).branches
      jobs = []
      builds = []

      # for each branch, grab the list of builds for that branch
      data.forEach (val, index) ->
        url = branchURL.replace '$BRANCH', val

        # create a job to request this branch 
        jobs.push (jobBack)->

          request url, (branchError, branchResposne, branchBody) ->
            try
              if error then throw error
              
              branchData = JSON.parse branchBody
              builds = builds.concat branchData
              jobBack()

            catch e
              jobBack e

      # run the jobs
      app.log.info 'retrieving build list'
      async.parallel jobs, (err) ->
        # grab the version out of each job and use semver to see if it
        # satisfies `input`

        matched = []

        builds.forEach (val, index) ->
          version = (val.filename.match /[0-9]*\.[0-9]*\.[0-9]*/)[0]
          val.version = version

          # if its not for the right os, ignore it
          if val.filename.indexOf(app.config.get 'os') == -1 then return

          dateStr = (val.filename.match /[0-9]{14}/)[0]
          date = new Date

          # date parsing code stolen right off of builds.appcelerator.net
          date.setFullYear(dateStr.substring(0,4), dateStr.substring(4,6)-1, dateStr.substring(6,8))
          date.setHours(dateStr.substring(8, 10))
          date.setMinutes(dateStr.substring(10,12))
          date.setSeconds(dateStr.substring(12,14))

          val.date = date
          val.zip = "#{zipURL}#{val.git_branch}/#{val.filename}"

          if input == 'null'
            console.log 'input is null'
            matched.push val
          else if (semver.satisfies version, input) or (gitCheck(input, val.git_revision))
            matched.push val

        matched.sort (a, b) ->
          return a.date.getTime() - b.date.getTime()

        cb null, matched

    catch e
      cb e

