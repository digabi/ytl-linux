# ytl-linux
An easy-to-install Linux to run virtual exam server (KTP)

This is work in progress.

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
