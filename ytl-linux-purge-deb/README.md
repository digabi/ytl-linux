# ytl-linux-purge-deb

This script was implemented to remove packages which are installed by
Ubuntu Autoinstall but are not needed in YTL Linux.

The package is kind of an anti-metapackage. The packages that should be
removed after the install are listed as
[conflicting packages](https://www.debian.org/doc/debian-policy/ch-relationships.html#conflicting-binary-packages-conflicts)
and therefore they are removed while this package is installed.
