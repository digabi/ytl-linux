# YTL Linux

The YTL Linux is an Ubuntu environment which installs automatically
everything you need to run a virtual Abitti server (Oracle VirtualBox and Naksu). The ultimate goals are:
 * Take the pain of updating servers and finding working combinations of software from the schools to the Matriculation Examination Board (Ylioppilastutkintolautakunta YTL in Finnish).
 * Make the Linux servers more uniform in order to help communication between the schools and the Abitti support in case of trouble.
 * In the long term make it possible to provide remote support during the exams.

This is work in progress. If you want to try the latest version please read the
[installation instructions](INSTALL.md).

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
