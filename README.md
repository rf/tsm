# tsm: Titanium SDK Manager

`tsm` is a small utility which helps you to manage your installed sdk versions.
Often, it is useful to download the latest versions of the SDK off of
Appcelerator's build page.  However, this can be tedious; especially for users
who do not use the Titanium/Apptana studio nonsense.

The utility can be installed via npm:

`npm install -g tsm`

You will now have the `tsm` command available to you.  `tsm` uses `node-semver`
to make it easier to select versions.  To list all available builds in the
2.1 release, try

`tsm ls 2.1`

To list all available builds:

`tsm ls all`

You can even specify ranges:

`tsm ls '> 2.0 < 2.1'`

You can also install an sdk version:

`tsm install 2.1`

This will install the latest build available from the matched versions.

Note that 2.0 is parsed as a float, so if you want to install 2.0, specify it
like this

`tsm install 2.0.x`

or else you'll get 2.1 instead.

This is currently OSX only; Linux support is coming as well.

# License

MIT.
