# digabi2-examnet-bouncer

This is a utility service for Digabi 2 exam networks that provides the following features:

- Fools Windows' Network Connection Status Indicator (NCSI) to think that the closed exam network has internet by mimicking Microsoft NCSI responses, thus preventing Windows network QoS system from automatically switching to another network
- Exposes an endpoint that informs other servers of the current server's friendly name
- Periodically collects friendly names from other KTPs in the same network and amends dnsmasq configuration accordingly, allowing any friendly name to be resolved from any KTP in the network

In production YTL-Linux, this service runs as a systemd service configured in [ytl-linux-digabi2-examnet.service](../ytl-linux-digabi2-examnet.service), which runs the [ytl-linux-digabi2-examnet](../ytl-linux-digabi2-examnet) script in daemon mode (with the `--daemon` flag).

## Development

```bash
# Install dependencies
deno install

# Run the bouncer service
just start

# Run tests
just test
```
