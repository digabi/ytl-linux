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
   `sudo bash -c 'wget -O - https://linux.abitti.fi/apt-signing-key.pub | apt-key add -'`
 * Add our repo to your sources: \
   `sudo bash -c 'echo "deb https://linux.abitti.fi/deb ytl-linux main" >/etc/apt/sources.list.d/usbmonster.list'`
 * Update your packages and install: \
   `sudo apt update && sudo apt install digabi-usb-monster`

After this your USB Monster will be updated automatically.

## Building the image

The build script will download a Ubuntu installation ISO image and modify
it so that it will boot by default to an autoinstall mode and download
our install configuration.

Just run

    ./build-ytl-image

which should result in a new ISO file "ytl-install.iso".

## GitHub automation

Pushing a tag to the digabi/ytl-linux GitHub repository will trigger
an action that automatically rebuilds the image and uploads it to
https://linux.abitti.fi/ytl-install.iso .

## Updating configuration

The installation configuration is in
[``docs/autoinstall-config/user-data``](https://github.com/digabi/ytl-linux/blob/main/docs/autoinstall-config/user-data)
and the format is documented
[here](https://ubuntu.com/server/docs/install/autoinstall-reference).
Pushing changes to the file will make
it available to installers via [GitHub
pages](https://digabi.github.io/ytl-linux/autoinstall-config/user-data)

## APT repository and deb packages

The ytl-linux-customize deb package is built automatically by a GitHub action
on pushes to the source code directory. The resulting package, along with any others
in the debs/ directory (currently none) get pushed to an apt repository at

  deb https://linux.abitti.fi/deb ytl-linux main

and are signed with the GPG key currently available at

  https://linux.abitti.fi/apt-signing-key.pub

The installation ISO image will pull in the ytl-linux-customize package from there.

## Testing instructions

In its current state the image will fetch the autoinstall configuration
(located in the docs/autoinstall-config subdirectory) over the network
from GitHub. This can be changed by modifying the build script.

The image can be tested in KVM with something like this:

- make a filesystem for a "virtual hard disk"

        qemu-img create -f qcow2 test.img 8G

- run a virtual KVM machine

        kvm -hda test.img -cdrom ytl-install.iso -m 2048

## Debugging failing installations

When installation fails the installer stops and prints a Python traceback or similar
error log describing the problem. In this case you can open a new console by
pressing Alt+F2 (Alt+F3...) and study the log files. The most relevant log files
are:
 * `/var/log/cloud-init-output.log` Output of the cloud-init part of the installation
 * `/var/log/cloud-init.log` Log of the cloud-init part of the installation
 * `/var/log/curtin/install.log` Log of the Curtin part of the installation
