# ytl-linux-purge-deb

This script was implemented to remove packages which are installed by
Ubuntu Autoinstall but are not needed in YTL Linux.

The script is executed by cron on boot. It reads `/etc/ytl-linux-purge-deb.conf`
which has following format:

```
# Lines starting with hash are ignored

# Empty lines are ignored
package-name
another-package-name:service-name
third-package-name:service-name-1,service-name-2
```

In the example case the script
1. ignores three first lines
1. purges package `package-name` if installed
1. if `another-package-name` is installed
    * stops and disables `service-name`
    * purges package `another-package-name`
1. if `third-package-name` is installed
    * stops and disables first `service-name-1` and then `service-name-2`
    * purges package `third-package-name`

At the moment only one service can be stopped for each package to remove.

