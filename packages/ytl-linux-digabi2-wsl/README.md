# ytl-linux-digabi2-wsl

This metapackage installs everything required to run the Abitti 2 server application (Docker, Naksu 2) in Windows Subsystem for Linux (WSL).

**IMPORTANT:** This package only works in WSL, as it contains workarounds and compromises related to running in WSL. For native YTL-Linux, you must install [ytl-linux-digabi2](../ytl-linux-digabi2) instead.

The main difference from the YTL-Linux-native version is that the default web browser is set to `wslview` (as provided by [wslu](https://github.com/wslutilities/wslu)) to ensure links clicked inside Naksu 2 open in the system's default web browser, since the Microsoft-provided default mechanism for this has proven itself unreliable.

Also, the current user is added to the `docker` group after the package is installed. This is because we cannot neither ensure Docker is installed by default, nor control the groups the WSL user account is created with - unlike for YTL-Linux, where we control the entire process through Ubuntu autoinstall.

To build the deb package, run:

```bash
just deb
```
