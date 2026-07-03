# cups-dummy

This package provides dummy `lpq` and `lpstat` binaries so that the Cinnamon DE's [`printers@cinnamon` applet](https://github.com/linuxmint/cinnamon/tree/6.0.4/files/usr/share/cinnamon/applets/printers%40cinnamon.org) is happy with us and doesn't crash, leading to "Sorry, Ubuntu 24.04 has experienced an internal error."

## What our lpstat needs to do

- Return exit code 1 with lpstat -a (can contain text or not)
- Not include a ': ' string with lpstat -d (can say "no system default destination" or not)
- Return '' with lpstat -l
- Return '' with lpstat -o

## What our lpq needs to do
- Return 'no entries' with lpq -a