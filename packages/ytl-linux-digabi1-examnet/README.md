# ytl-linux-digabi1-examnet

## Purpose

The package contains a script `ytl-linux-digabi1-examnet` which sets a static
IPv4 address to given network device. This is intended to avoid problems when running
Abitti 1 exams using a network device which tries to get network settings using DHCP.
In some cases this causes connection problems for the device.

## Usage

The script is executed from command line:

`$ sudo ytl-linux-digabi1-examnet`

If executed without parameters, it asks the WAN and LAN devices as well as the
server number. It is possible to run multiple servers in one LAN but they must have
different server numbers.

The server number affects the local IP address in a following way:
* Server 1 -> `192.168.1.1`
* Server 2 -> `192.168.2.1`
* Server N -> `192.168.N.1`

The netmask is 255.255.0.0 (/16).

It is possible to supply the two parameters in command line:

`ytl-linux-digabi1-examnet lan-device server-number`

Example:

`$ sudo ytl-linux-digabi1-examnet eth0 1`

It is also possible to run the script in GUI mode (parameter `--gui`). In this case the
parameters are asked with Zenity.

## Removing settings

Following command should restore the system to pristine state:

`$ sudo ytl-linux-digabi1-examnet --remove`

It removes the settings files created by this script. It also removes all NetworkManager
connections which have a name starting with `yo-`. This is the prefix used by the
script to create the static connection for the local network.

## Debugging

The debugging messages can be printed to a given file:

`$ DEBUG=/tmp/whatta.log sudo ytl-linux-digabi1-examnet`

The list of exit codes can be found in the script.
