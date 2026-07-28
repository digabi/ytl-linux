# ytl-linux-sysmon

This package installs some system monitoring tools ([Netdata](https://github.com/netdata/netdata) and [bandwhich](https://github.com/imsnif/bandwhich)) to assist with detecting and troubleshooting system performance issues.

Bandwhich is not available via APT and is only available as a snap, so it's installed from Snap in the postinstall step for the package.

To build the deb package, run:

```bash
just deb
```
