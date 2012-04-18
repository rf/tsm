flatiron = require 'flatiron'
require 'shelljs/global'
app = flatiron.app
sdk = require './sdk'
cliff = require 'cliff'
require 'd8/locale/en-US'
util = require 'util'
d8 = require 'd8'
colors = require 'colors'
_ = require 'underscore'

app.use flatiron.plugins.cli,
  usage: [
    'tsm: Titanium SDK Manager'
    ''
    'ls (version)\t\tlist available sdks matching version'
    'install (version)\tinstall latest sdk matching version'
  ]

app.commands.install = (version, cb) ->
  version = String version
  sdk.install app, version, (err) ->
    if err
      app.log.error util.inspect err

# print a list of builds.  If we're printing available builds, we also take
# the 'installed' parameter which lists what's already installed; in this case,
# we can put check marks next to installed versions

printBuilds = (builds, installed) ->
  # setup an object that maps installed versions to true if we're listing
  # available builds.  This allows us to quickly and easily check if a build
  # is already installed.

  installedByHash = {}
  if installed
    _.each installed, (build) ->
      installedByHash[build.githash] = true
  list = [['Version', 'Revision','Build Date', 'Installed']]

  builds.forEach (val) ->
    # if installed isn't set we're printing already installed versions
    # so check all of them
    if not installed then check = "✓".green

    # otherwise we check to see if each version is installed already --
    # if so, put a check next to it
    else if installedByHash[val.githash] then check = "✓".green else check = ""
    list.push [val.version, val.githash, val.date.format("m/d/y G:i"), check]

  # print the rows with cliff
  cliff.putRows 'data', list, ['red', 'blue', 'yellow', 'green']

# list available or installed sdks
app.commands.list = (param0, param1, cb) ->
  if param1
    type = param0
    input = String param1
  else
    type = param0

  switch type
    when 'available', 'all'
      sdk.list app, input, (err, builds) ->
        if err then return app.log.error err
        sdk.installed app, input, (err, installed) ->
          if err then return app.log.error err
          printBuilds builds, installed

    # list installed versions
    when 'installed'
      sdk.installed app, input, (err, builds) ->
        printBuilds builds

app.commands.ls = app.commands.list


# main
module.exports = (homeDir) ->
  app.config.set 'homeDir', homeDir
  app.config.set 'sdkDir', '/Library/Application Support/Titanium/'
  app.config.set 'os', 'osx'
  app.start()
