# YTL Linux

The YTL Linux is an Ubuntu environment which installs automatically
everything you need to run a virtual Abitti server (Oracle VirtualBox and Naksu). The ultimate goals are:
 * Move the pain of updating servers and finding working combinations of software from the schools to the Matriculation Examination Board (Ylioppilastutkintolautakunta YTL in Finnish).
 * Make the Linux servers more uniform in order to help communication between the schools and the Abitti support in case of trouble.
 * In the long term make it possible to provide remote support during the exams.

This is the advised way to install a Linux-based Abitti server. For the end-user instructions see [Abitti.fi](https://www.abitti.fi/fi/ohjeet/koetilan-palvelin/).
If you have problems with SecureBoot installation see the [tech version of the installation instructions](INSTALL.md).

## USB Monster

### Using USB Monster with YTL Linux

The default behaviour of Cinnamon (thus, YTL Linux) is to automount all USB memories inserted into
the workstation. Before starting to use USB Monster this feature should be disabled by entering
following commands:

```
gsettings set org.cinnamon.desktop.media-handling automount-open false
gsettings set org.cinnamon.desktop.media-handling automount false
```

These commands are per-user so your Abitti server user (e.g. the default `school`) can have the automount
on while the USB monster user may have the automount turned off. 

### Install USB Monster without YTL Linux

The YTL Linux contains world-famous [USB Monster](https://github.com/digabi/usb-monster) which handles simulaneous writes
to massive amount of USB memories. The Matriculation Examination Board uses USB
Monster to write its fleet for biannual exams.

Here are the steps to install USB Monster to your non-YTL Linux deb-based distro:
 * Import the key: \
   `wget -qO- https://linux.abitti.fi/apt-signing-key.pub | sudo tee /etc/apt/trusted.gpg.d/ytl-linux.asc`
 * Add our repo to your sources: \
   `sudo bash -c 'echo "deb https://linux.abitti.fi/deb ytl-linux main" >/etc/apt/sources.list.d/usbmonster.list'`
 * Update your packages and install: \
   `sudo apt update && sudo apt install digabi-usb-monster`

After this your USB Monster will be updated automatically.

If you have added the signing key with legacy `apt-key` tool and get `Key is stored in legacy trusted.gpg keyring` errors
you can change the location of the key with following procedure:

```
$ sudo apt-key del "19A4 3050 953F DEC0 F0D6  2C81 1B26 415C 1E66 6A78"
Warning: apt-key is deprecated. Manage keyring files in trusted.gpg.d instead (see apt-key(8)).
OK
$ wget -qO- https://linux.abitti.fi/apt-signing-key.pub | sudo tee /etc/apt/trusted.gpg.d/ytl-linux.asc
-----BEGIN PGP PUBLIC KEY BLOCK-----

mQINBF/OM8EBEADbtIT8en8PLczP2egPDeBXIXaSsQFzGgCBGd1vjCLbe1bhZ3ii
O/FWr2QqORnbzrNim5VyzeZ8Qq4Yj0XoQNhvkw9eD2old1mThjra5BMesMNXHnEB
PG6LAfPFDE9hsUaQDIJrHRO09GKlMJDIFX/cSPkzlQw2Pnzf6UTY8E2L6CORPWih
...
ZZYZdDCRzHPA90AVFdev65Yd+2xt+JjmnbldS6z7HaIiCeT5XhhhgSd9AUoM+Hyu
NkP7g8coWb57JQj63AgO9ukfqYuR4XqQHW3ga6U4cKhPUU1ChE5H
=swfs
-----END PGP PUBLIC KEY BLOCK-----
```

Run `sudo apt update` and make sure the legacy keyring warning has disappeared.

## Naksu 2

Install and set up [git-lfs](https://git-lfs.com). Run `scripts/update-naksu2.sh` to download the latest version of the Naksu 2 deb from GitHub Releases.

## Building the image

### Building the image locally

The build script will download a Ubuntu installation ISO image and modify
it so that it will boot by default to an autoinstall mode and download
our install configuration.

The build script `build-ytl-image` can be executed with or without Docker. Both
should give you a new ISO file `ytl-install-24.iso` which can be tested with
instructions given below.

 * Building with Docker: `make docker`
 * Building on your bare OS: `./build-ytl-image`

### Testing the image and install script locally

To test the image and the install script `docs/autoinstall-config-XX/user-data`
you can do the following:

 * Start a local httpd server at port 8080: `make start-httpd`
 * Run `AUTOINSTALL_URL=http://<your-ip-address-here-but-not-localhost>:8080/autoinstall-config-24/ ./build-ytl-image` (or same with `make docker` for Docker)

**Note:** On macOS, it is possible to get KVM working for testing, but it's probably easier to use something like https://github.com/utmapp/UTM. After building the ISO, create an x86_64 emulator VM, select the built ytl-install-24.iso, and leave all other options at default.

### Building the image with GitHub automation

Pushing a tag of the form 'v24.X' to the digabi/ytl-linux GitHub
repository will trigger an action that automatically rebuilds the image
and uploads it to https://linux.abitti.fi/ytl-install-24.iso .

Use Ubuntu version numbers with local build version number. A build 
number two of Ubuntu 24.04.3 would get version number (tag) `v24.04.3-2`.

## Updating configuration

The installation configuration is in
[``docs/autoinstall-config-XX/user-data``](https://github.com/digabi/ytl-linux/blob/main/docs/autoinstall-config-XX/user-data)
(where XX stands 1st part of Ubuntu version number, e.g. 22)
and the format is documented
[here](https://ubuntu.com/server/docs/install/autoinstall-reference).
Pushing changes to the file will make
it available to installers via [GitHub
pages](https://digabi.github.io/ytl-linux/autoinstall-config/user-data)

## APT repository and deb packages

The ytl-linux-customize deb package is built automatically by a GitHub action
on pushes to the source code directory. The resulting package, along with any others
in the debs/ directory (currently none) get pushed to an apt repository at

`deb https://linux.abitti.fi/deb ytl-linux main`

and are signed with the GPG key currently available at

`https://linux.abitti.fi/apt-signing-key.pub`

The installation ISO image will pull in the ytl-linux-customize package from there.

### Testing deb packages

When adding/updating deb packages in this repository remember to test the
packages in following environments:
 * YTL Linux - the current production version of this very flavour of Ubuntu Linux
 * WSL - the currently instructed environment to run Abitti 2 servers

For the official instructions on installing production versions see
https://abitti.fi/abitti2/

## Testing instructions

In its current state the image will fetch the autoinstall configuration
(located in the docs/autoinstall-config subdirectory) over the network
from GitHub. This can be changed by modifying the build script.

### Testing with VirtualBox

`make create-vb-vm`

### Testing with KVM

`make create-kvm-vm`

## Debugging failing installations

When installation fails the installer stops and prints a Python traceback or similar
error log describing the problem. In this case you can open a new console by
pressing Alt+F2 (Alt+F3...) and study the log files. The most relevant log files
are:
 * `/var/log/cloud-init-output.log` Output of the cloud-init part of the installation
 * `/var/log/cloud-init.log` Log of the cloud-init part of the installation
 * `/var/log/curtin/install.log` Log of the Curtin part of the installation

If a package installation failed, look for the syslog identifier of the failing Subiquity task (something like `SyslogIdentifier=subiquity_log.1234`) and then grep it from `/var/log/syslog` to look for the true source of the issue:

```bash
cat /var/log/syslog | grep -i subiquity_log.1234 | less
```

This is because Subiquity outputs are not terribly helpful in these situations because they only state the exit code, not what actually broke - you need to find the output from apt in the syslog for that.
