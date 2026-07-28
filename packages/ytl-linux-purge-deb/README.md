# ytl-linux-purge-deb

This package is kind of an anti-metapackage. Its purpose is to remove certain packages which are installed by default, but are not needed and/or cause problems in YTL Linux (e.g. CUPS, which slows down boot times unnecessarily, since YTL Linux servers do not need to print).

The packages that should be removed after the install are listed as [conflicting packages](https://www.debian.org/doc/debian-policy/ch-relationships.html#conflicting-binary-packages-conflicts) and therefore they are removed while this package is installed.

This is the only package that is not installed as a dependency of `ytl-linux-customize-24` and is installed separately by Ubuntu autoinstall, as the deb purging will not work correctly if it's a dependency.

To build the deb package, run:

```bash
just deb
```
