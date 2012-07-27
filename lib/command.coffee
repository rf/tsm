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
spawn = (require 'child_process').spawn
_ = require 'underscore'

app.use flatiron.plugins.cli,
  usage: require './usage'

app.commands.install = (version, cb) ->
  version = if not version then null else String version
  if not version
    app.log.error "You must specify a version like #{'tsm install 2.0.x'.bold}"
    return cb()
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

# Run the `titanium.py` script for a particular sdk version
app.commands.run = () ->
  # callback is always the last arg
  cb = [].pop.call arguments

  # first arg is version
  version = if arguments[0] then String(arguments[0]) else null

  # the rest of the args go straight to `titanium.py`
  tiargs = (process.argv.slice 4)

  if not version
    app.log.error "You must specify a version like #{'tsm run 2.0.x'.bold}"
    return cb()

  sdk.installed app, version, (err, builds) ->
    if err then return app.log.error err

    if builds.length == 0
      app.log.error """
        No valid SDK version matching input: #{version}.
      """
      app.log.info "usage: tsm run (version) (args*)"
      return

    path = path.join builds.pop().path, 'titanium.py'

    tiargs.unshift path
    child = spawn 'python', tiargs

    # pipe stdout and stderr to process.stdout
    child.stdout.pipe process.stdout
    child.stderr.pipe process.stderr

# Run the `builder.py` script for a particular SDK version
app.commands.builder = () ->
  cb = [].pop.call arguments
  version = arguments[0]
  osname = arguments[1]
  tiargs = (process.argv.slice 5)
  version = String(version)

  if osname not in ['iphone', 'android']
    app.log.error "Invalid os: #{osname}"
    app.log.info "usage: tsm builder (version) (osname) (args*)"
    return

  sdk.installed app, version, (err, builds) ->
    if err then return app.log.error err

    if builds.length == 0
      app.log.error """
        No valid SDK version matching input: #{version}.
      """
      app.log.info "usage: tsm builder (version) (osname) (args*)"
      return

    path = path.join builds.pop().path, osname, 'builder.py'

    tiargs.unshift path
    child = spawn 'python', tiargs

    # pipe stdout and stderr to process.stdout
    child.stdout.pipe process.stdout
    child.stderr.pipe process.stderr

# aliases
app.commands.ls = app.commands.list
app.commands.i = app.commands.install
app.commands.r = app.commands.run
app.commands.b = app.commands.build

# main
module.exports = (appDir) ->
  app.config.set 'appDir', appDir
  app.config.set 'os', 'osx'

  home = process.env[if process.platform == 'win32' then 'USERPROFILE' else 'HOME']

  if (process.platform.indexOf 'linux') != -1
    app.config.set 'os', 'linux'
    dir = path.join home, '.titanium', 'mobilesdk'
    mkdir '-p', (path.join home, '.titanium', 'mobilesdk', 'linux')
    app.config.set 'sdkDir', dir

  else if (process.platform.indexOf 'darwin') != -1
    studiosdkpath_user = process.env.HOME + '/Library/Application Support/Titanium/mobilesdk'
    studiosdkpath_global = '/Library/Application Support/Titanium/mobilesdk'
    if (fs.existsSync studiosdkpath_global)
      app.config.set 'sdkDir', studiosdkpath_global
    else if (fs.existsSync studiosdkpath_user)
      app.config.set 'sdkDir', studiosdkpath_user
    else
      dir = path.join home, '.titanium', 'mobilesdk'
      mkdir '-p', (path.join home, '.titanium', 'mobilesdk', 'osx')
      app.config.set 'sdkDir', dir

  else
    # will need to do actual work for Windows support ..
    app.log.error 'Your platform is not yet supported, sorry'
    return

  app.start()

