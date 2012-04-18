flatiron = require 'flatiron'
require 'shelljs/global'
app = flatiron.app
sdk = require './sdk'
cliff = require 'cliff'
require 'd8/locale/en-US'
d8 = require 'd8'

app.use flatiron.plugins.cli,
  usage: [
    'Welcome to my app!'
    'test'
  ]

app.commands.install = (version, cb) ->

app.commands.list = (type, input, cb) ->
  input = String input
  switch type
    when 'available', 'all'
      sdk.list app, input, (err, builds) ->
        list = [['Version', 'Revision','Build Date']]
        builds.forEach (val) ->
          git = val.git_revision.slice 0, 7

          list.push [val.version, git, val.date.format("m/d/y g:i:s a")]
        cliff.putRows 'data', list, ['red', 'blue', 'green']

app.commands.ls = app.commands.list

# main
module.exports = (homeDir) ->
  app.config.set 'homeDir', homeDir
  app.config.set 'os', 'osx'
  app.start()
