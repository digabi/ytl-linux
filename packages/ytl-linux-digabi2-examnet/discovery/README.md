# digabi2-examnet-discovery

This system sniffs for aliases from KTPs in the exam network and updates dnsmasq configuration based on its findings.

In production YTL-Linux, this service runs using a systemd timer ([`ytl-linux-digabi2-examnet-discovery.timer`](../ytl-linux-digabi2-examnet-discovery.timer)), which runs the [`ytl-linux-digabi2-examnet-discovery`](../ytl-linux-digabi2-examnet-discovery.service) service.

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
# Run the discovery service
just start

# Run tests
just test
```

## Publishing

This component is bundled with `ytl-linux-digabi2-examnet` deb in the parent directory.
