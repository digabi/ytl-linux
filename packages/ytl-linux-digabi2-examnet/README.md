# ytl-linux-digabi2-examnet

## Purpose

### ytl-linux-digabi2-examnet

This is a proof-of-concept of a procedure which creates proper network settings
for Abitti 2 exam server. The setup requires that the server has two network devices
 * A WAN device connected to the internet. At the moment this is used to get a
   SSL certificate and DNS address for the server. According to the initial plans
   it might be later used e.g. to download exam items and upload candidate data.
   At the moment a wireless device is good enough for a WAN connection.
 * A LAN device connected to the closed local area network. This is an Abitti 1
   style network without any external DHCP/DNS servers. After executing the script
   the server starts working as a DHCP/DNS server for the LAN.

### ytl-linux-digabi1-examnet

The package contains also a script `ytl-linux-digabi1-examnet` which sets a static
IPv4 address to given network device. This is intended to avoid problems when running
Abitti 1 exams using a network device which tries to get network settings using DHCP.
In some cases this causes connection problems for the device.

This script follows similar usage as described below.

## Usage

The script is executed from command line:

`$ sudo ytl-linux-digabi2-examnet`

If executed without parameters, it asks the WAN and LAN devices as well as the
server number. It is possible to run multiple servers in one LAN but they must have
different server numbers.

It is possible to supply the three parameters in command line:

`ytl-linux-digabi2-examnet wan-device lan-device server-number`

Example:

`$ sudo ytl-linux-digabi2-examnet wlo1 eth0 1`

It is also possible to run the script in GUI mode (parameter `--gui`). In this case the
parameters are asked with Zenity.

## Removing settings

Following command should restore the system to pristine state:

`$ sudo ytl-linux-digabi2-examnet --remove`

It removes the settings files created by this script. It also removes all NetworkManager
connections which have a name starting with `yo-`. This is the prefix used by the
script to create the static connection for the local network.

## Debugging

The debugging messages can be printed to a given file:

`$ DEBUG=/tmp/whatta.log sudo ytl-linux-digabi2-examnet`

The list of exit codes can be found in the script.
