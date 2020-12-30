# Installing YTL Linux

YTL Linux installs:
 * Ubuntu server with Cinnamon desktop environment. Cinnamon was selected
   as it might be more familiar with Windows users than some other desktop
   environments.
 * A metapackage `ytl-linux-customize` installs a tested Oracle VirtualBox
   version and some smaller tools. It also contains
 * Users for the school and MEB. However, the MEB account is currently disabled.

## Instructions

 1. Download [the installation image](https://linux.abitti.fi/ytl-install.iso).
 1. Write the image to an USB stick.
 1. The installation is silent and it overwrites the storage. Make sure your disks do not contain any valuable data.
 1. Connect the server to a wired network. Your network needs to provide network settings from a DHCP server. If your network requires proxy settings or filters traffic you may encounter problems.
 1. Boot the server from the USB stick you created earlier.
 1. Select "Install YTL Ubuntu Server" by pressing Enter. After this there is no way back.
 1. In an early stage of the installation the server checks the USB stick for defected data. Make sure it reports only 1 corrupted file:\
 `Check finished: errors found in 1 files!`
 1. The computer reboots after a successful installation.
 1. Log in (`school` / `school`) and change the password: Menu (bottom-left) > Preferences > Account Details > Password.
 1. In case your screen resolution is bad try: Menu > Preferences > Display: Normal Graphics On Boot. Finally, reboot the server.
 1. Start Naksu to install the virtualised server: Menu > Administration > Naksu.

## What to do if the installation fails

 1. Try again. The installation downloads massive amount of data and there might be shortages. The installation is less robust what comes to the network problems.
 1. Try with a different network (e.g. by sharing a network via your mobile phone). Maybe your ISP blocks or filters data?
 1. Are you using Legacy/BIOS boot? Try enabling SecureBoot instead.
 1. Take some screenshots (again, your mobile phone is your friend here):
   * The screen where the installation finished.
   * Press Alt+F2 > enter command \
     `cat /var/log/curtin/install.log` \
     and take a screenshot.
   * Send these screenshots and your contact information to Abitti support.

## What to do if you want to suggest changes and/or additions

 * Contact Abitti support by email. You'll find the contact information from the [Abitti website](https://abitti.fi).
 * Open a [GitHub issue](https://github.com/digabi/ytl-linux/issues).
 * YTL Linux is open source. Make a pull request.
