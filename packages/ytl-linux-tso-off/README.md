# ytl-linux-tso-off

This package places a script to `/etc/network/if-up.d` which turns TCP
Segmentation Offload (TSO) setting off for all ethernet devices.

The `TCP off` setting appears to help Intel I217, I219(-LM) devices to deal with
high VirtualBox VM network throughput taking place when running Abitti 1
server.

The package is created with [fpm](https://github.com/jordansissel/fpm).

To create the deb run

`make deb`
