# YTL Linux

The YTL Linux is an Ubuntu environment which automatically installs everything needed to run an Abitti 2 server (Docker, Naksu 2, auxiliary software components). The ultimate goals are:

- Move the pain of updating servers and finding working combinations of software from the schools to the Matriculation Examination Board (Ylioppilastutkintolautakunta YTL in Finnish).
- Make Linux servers run in schools more uniform in order to help communication between the schools and Abitti support in case of trouble.
- Provide remote support during the exams.

This is the advised way to install a Linux-based Abitti server. For end-user instructions, see instructions on [Abitti.fi](https://abitti.fi).

## Repository structure

This repository contains two main things:

- Infrastructure to build and distribute the YTL Linux install image, as well as the Ubuntu autoinstall config used by the image
- YTL-created deb packages performing various functions within YTL Linux, distributed via the APT repository at linux.abitti.fi

Sources for the deb packages are in the [`packages`](./packages) directory. The [`debs`](./debs) directory contains vendored deb packages hosted and built elsewhere but distributed with YTL Linux (e.g. Naksu 2, MEB Remote Control / AnyDesk, usb-monster).

The Ubuntu autoinstall config is in the [`docs`](./docs) directory and is published to GitHub Pages (https://digabi.github.io/ytl-linux) every time YTL Linux updates are released.

Software for building the YTL Linux install ISO is in the [`builder`](./builder) folder.

## Releasing

### Publishing YTL deb packages

The packages and the package repository are built in the [Update Debian repository](https://github.com/digabi/ytl-linux/actions/workflows/reprepro.yml) workflow automatically on push to `main`. Vendored packages in the [`debs`](./debs) directory will also be included in the APT repository as-is.

To update the APT repository and thus publish changes to end users, go to [Actions](https://github.com/digabi/ytl-linux/actions/workflows/reprepro.yml), click "Run workflow" and tick the "Publish built .deb packages" option.

### Publishing the publicly distributed ytl-install-24.iso

Pushing a tag of the form 'v24.X' to the will trigger the [upload-image-24.yml workflow](https://github.com/digabi/ytl-linux/actions/workflows/upload-image-24.yml), which automatically builds the `ytl-install-24.iso` image and uploads it to https://linux.abitti.fi/ytl-install-24.iso, from where users are instructed to download it.

Use Ubuntu version numbers with local build version number. Build number 2 of Ubuntu 24.04.3 would get version number (tag) `v24.04.3-2`.

### Updating additional software components

```bash
# Naksu 2
just update naksu2

# AnyDesk (MEB)
just update anydesk

# Vendored just for ytl-linux-tasks
# Note: This requires manually bumping the version number of ytl-linux-tasks before publishing
just update vendored-just
```

Running any of these will not yet push the changes to end users; to do so, you need to publish the APT repository as detailed in [Publishing YTL deb packages](#publishing-ytl-deb-packages).

## Development

Most of the deb packages are only used in YTL Linux. However, there is one singular exception: [ytl-linux-digabi2-wsl](./packages/ytl-linux-digabi2-wsl/), which provides support for running the Abitti 2 server in Windows Subsystem for Linux (WSL). That package and any packages depended upon by it must also be tested in WSL before release. For others, testing with a YTL Linux installation is sufficient.

### Building ytl-install.iso locally

During building, the default Ubuntu install ISO is modified to boot directly into an autoinstall mode, pointed at our autoinstall configuration.

```bash
just build
```

The resultant `ytl-install.iso` can be burned onto a USB drive for hardware installation, or mounted into VMs in a CD-ROM slot to run the full install process as if it was a real computer.

### Testing autoinstall config changes locally

To test changes to your autoinstall config locally without having to publish them to GitHub Pages, build an `ytl-install.iso` that points to your local autoinstall configuration:

```bash
just serve

# The command will print what build command you need to use to create an installer pointed at the local autoinstall config, like this:
AUTOINSTALL_URL=http://<your-local-ip-address>:8080/autoinstall-config-24/ just build
```

## Testing YTL Linux

YTL Linux is only built for x86 environments. It is strongly advised to use a machine with a native x86 CPU for testing, as x86 emulation on macOS is painfully sluggish (VM installation takes 1hr+ even on the most modern Macs, system commands may have multi-minute execution times, etc).

### On a native x86 system using VirtualBox

This option requires VirtualBox to be installed (`sudo apt install virtualbox`). **Note:** VirtualBox is not supported on macOS, as it cannot do x86 emulation on ARM.

```bash
just create-vb-vm
```

VM parameters can be customized; see top of [justfile](./justfile) for all available options. E.g.:

```bash
VM_CPUS=8 VM_MEMORY_SIZE=8192 just create-vb-vm
```

The repo folder is automatically mounted into the VirtualBox VM as a shared folder. To allow access to changes you make in your host OS for testing, run the following commands:

```bash
sudo apt install virtualbox-guest-utils
sudo usermod -aG vboxsf $USER
sudo reboot now
```

Debs can then be created with `make deb` on the host OS and installed in the VM with `sudo apt install --reinstall ./ytl-linux-(...).deb`.

### On an ARM system with x86 emulation using UTM

After building the ISO, create an x86_64 emulator VM in UTM, select the built ytl-install-24.iso, and leave all other options at default.

## Debugging failing installations

When installation fails the installer stops and prints a Python traceback or similar error log describing the problem. In this case you can open a new console by pressing Alt+F2 (Alt+F3...) and study the log files. The most relevant log files are:

- `/var/log/cloud-init-output.log`: Output of the cloud-init part of the installation
- `/var/log/cloud-init.log`: Log of the cloud-init part of the installation
- `/var/log/curtin/install.log`: Log of the Curtin part of the installation

If a package installation failed, look for the syslog identifier of the failing Subiquity task (something like `SyslogIdentifier=subiquity_log.1234`) and then grep it from `/var/log/syslog` to look for the true source of the issue:

```bash
cat /var/log/syslog | grep -i subiquity_log.1234 | less
```

This is because Subiquity outputs are not terribly helpful in these situations because they only state the exit code, not what actually broke - you need to find the output from apt in the syslog for that.
