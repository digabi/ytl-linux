# ytl-linux-tso-off

When installed, this package places a script in `/etc/network/if-up.d` (for traditional Debian /etc/network) and `/etc/NetworkManager/dispatcher.d` (for modern NetworkManager) which turns off TCP Segmentation Offload (TSO) for all Ethernet devices.

Disabling TSO appears to help certain network hardware (e.g. Intel I217, I219(-LM)) to deal with high network throughput taking place when running Abitti servers.

To build the deb package, run:

```bash
just deb
```
