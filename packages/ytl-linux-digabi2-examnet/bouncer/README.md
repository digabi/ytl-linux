# examnet bouncer

This is a utility service for Digabi 2 exam networks that provides the following features:

- Fools Windows' Network Connection Status Indicator (NCSI) to think that the closed exam network has internet by mimicking Microsoft NCSI responses, thus preventing Windows network QoS system from automatically switching to another network
- Redirects HTTP requests with the friendly hostname to the canonical URLs
- Exposes an endpoint that informs other servers of the current server's friendly name

In production YTL-Linux, this service runs as a systemd service configured in [ytl-linux-digabi2-examnet.service](../ytl-linux-digabi2-examnet.service), which runs the [ytl-linux-digabi2-examnet](../ytl-linux-digabi2-examnet) script in daemon mode (with the `--daemon` flag).

## Setup

This component is built with Deno. You can install Deno using your version management technology of choice; the quickest one for drive-by development is to use NPM. In any case, the relevant Deno version is declared in `.deno-version` in the repository root.

```bash
# Install Deno
npm install deno@$(cat .deno-version)

# Install dependencies
deno install
```

## Development

```bash
# Run the bouncer service
just start

# Run tests
just test
```

## Publishing

This component is bundled with `ytl-linux-digabi2-examnet` deb in the parent directory.
