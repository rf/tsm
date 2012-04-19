flatiron = require 'flatiron'
require 'shelljs/global'
app = flatiron.app
sdk = require './sdk'
cliff = require 'cliff'
require 'd8/locale/en-US'
util = require 'util'
d8 = require 'd8'
path = require 'path'
fs = require 'fs'
colors = require 'colors'
_ = require 'underscore'

app.use flatiron.plugins.cli,
  usage: [
    'tsm: Titanium SDK Manager'
    ''
    'ls (all,installed) (version)\t\tlist available sdks matching version'
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
  list = [['Version', 'Revision','Build Date', '']]

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
app.commands.list = (type, input, cb) ->
  input = if not input then false else String(input)
  if not type then type = 'all'

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

    # didn't recognize command, call app.commands.list again with 'all' and
    # assume `type` is actually a version
    else
      app.commands.list 'all', type, cb

app.commands.ls = app.commands.list


# main
module.exports = (appDir) ->
  app.config.set 'appDir', appDir
  app.config.set 'os', 'osx'

  home = process.env[if process.platform == 'win32' then 'USERPROFILE' else 'HOME']

  if (process.platform.indexOf 'linux') != -1
    app.config.set 'os', 'linux'
    app.config.set 'sdkDir', (path.join home, '.titanium', 'mobilesdk')

  else if (process.platform.indexOf 'darwin') != -1
    studiosdkpath = '/Library/Application Support/Titanium/'
    if (fs.existsSync studiosdkpath)
      app.config.set 'sdkDir', studiosdkpath
    else
      dir = path.join home, '.titanium'
      mkdir '-p', (path.join home, '.titanium', 'mobilesdk', 'osx')
      app.config.set 'sdkDir', dir

  else
    app.log.error 'Your platform is not yet supported, sorry'
    return

  app.start()
