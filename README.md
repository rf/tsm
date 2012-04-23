# tsm: Titanium SDK Manager

`tsm` is a small utility which helps you to manage your installed sdk versions.
Often, it is useful to download the latest versions of the SDK off of
Appcelerator's build page.  However, this can be tedious; especially for users
who do not use the Titanium/Apptana studio nonsense.

The utility requires node; see [this page](https://github.com/joyent/node/wiki/Installation)
for instructions on how to install node.  You can then install it with npm:

```CLI
sudo npm install -g tsm
```

Depending on how you installed node, you may or may not need to use sudo. If
you're using a virtual environment manager such as `nvm` you do not need sudo.

You will now have the `tsm` command available to you.  `tsm` uses `node-semver`
to make it easier to select versions.  To list all available builds in the
2.1 release, try

```CLI
tsm ls 2.1
```

To list all available builds:

```CLI
tsm ls all
```

To list installed builds:

```CLI
tsm ls installed
```

You can even specify ranges:

```CLI
tsm ls '> 2.0 < 2.1'
```

You can also install an sdk version:

```CLI
tsm install 2.1
```

This will install the latest build available from the matched versions.

Note that 2.0 is parsed as a float, so if you want to install 2.0, specify it
like this

```CLI
tsm install 2.0.x
```

or else you'll get 2.1 instead.

If you're on osx and you have a `/Library/Application Support/Titanium`
directory (the place where Titanium Studio puts its sdks) then the installed
sdks will be dropped there.  

If you don't have this folder or you're on linux, the sdks will be installed
in `~/.titanium/`.

# License

MIT.
