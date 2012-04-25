###  
usage: [
    'tsm: Titanium SDK Manager'
    ''
    'ls (all,installed) (version)\tlist available sdks matching version'
    'install (version)\t\tinstall latest sdk matching version'
    'run (version)\t\t\trun titanium.py script for version'
    'builder (version) (os)\t\trun builder.py for os. ex: builder 2 iphone'
    ''
    'For run and builder, extra arguments are passed straight to the python script.'
    'Versions are parsed with semver, so you can specify ranges.  If multiple'
    'versions match, the most recent build is selected.'
  ]
###

require 'colors'

usage =
["   __    ".yellow.bold
"  / /__________ ___ ".yellow.bold
" / __/ ___/ __ `__ \\".yellow.bold
"/ /_(__  ) / / / / /".yellow.bold
"\\__/____/_/ /_/ /_/ ".yellow.bold
""
"Titanium SDK Manager".blue.bold
"http://github.com/russfrank/tsm"
""
"Usage:".underline
""
"    tsm <command> <args*>".red.bold
""
"Commands:".underline
""
"    tsm ls <all|installed> <version>".bold
""
"    List installed SDK versions. <version> is optional; if ommitted, all"
"    builds will be listed."
""
"    tsm install <version>".bold
""
"    Installs latest SDK matching <version>."
""
"    tsm run <version> <args*>".bold
""
"    Run the #{'titanium.py'.bold} script bundled with the specified SDK"
"    version.  args* will be passed to the #{'titanium.py'.bold} script."
""
"    tsm builder <version> <os>".bold
""
"    Run the #{'builder.py'.bold} for the os specified bundled with the"
"    specified SDK version.  <os> should be one of [iphone, android]."
""
"Versions are parsed with node-semver, so ranges can be specified.  If multiple"
"versions match, the latest build (sorted by date) will be used."
""
"Git hashes can also be used to specify a version."
""
"If you encounter a bug, please report an issue on the github page.  Thanks for"
"using #{'tsm'.bold}."
]

module.exports = usage
