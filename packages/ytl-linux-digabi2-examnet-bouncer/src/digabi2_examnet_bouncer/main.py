import argparse
from dataclasses import asdict
import pathlib

from werkzeug.serving import make_server

from .announcer import Announcer
from .bouncer import Bouncer
from .config import Config


def run(config: Config, hostname_file: pathlib.Path | None):
    with Announcer(config).start() as info:
        assert info.server is not None
        print("Config:")
        for k, v in asdict(config).items():  # pyright: ignore[reportAny]
            print(f" - {k}:", v)  # pyright: ignore[reportAny]
        print("Service up:", info.server)
        if hostname_file:
            _ = hostname_file.write_text(info.server)
            print("Hostname written to file:", hostname_file)
        bouncer = Bouncer(config, info.server)
        srv = make_server(config.ipv4_address, config.bouncer_port, bouncer, threaded=True)
        srv.serve_forever()


def main():
    ap = argparse.ArgumentParser(description="network services for the digabi2 exam system")
    ap.add_argument("--hostname-file", type=pathlib.Path)  # pyright: ignore[reportUnusedCallResult]
    ap.add_argument("--bouncer-port", type=int, default=80)  # pyright: ignore[reportUnusedCallResult]
    ap.add_argument("--canonical-url", type=str, required=True)  # pyright: ignore[reportUnusedCallResult]
    ap.add_argument("--ipv4-address", required=True)  # pyright: ignore[reportUnusedCallResult]
    ap.add_argument("--extra-ncsi-hosts", action="append", type=str.lower)  # pyright: ignore[reportUnusedCallResult]
    ap.add_argument("friendly_name")  # pyright: ignore[reportUnusedCallResult]
    args = ap.parse_args()
    config = Config(
        bouncer_port=args.bouncer_port,  # pyright: ignore[reportAny]
        canonical_url=args.canonical_url,  # pyright: ignore[reportAny]
        friendly_name=args.friendly_name,  # pyright: ignore[reportAny]
        ipv4_address=args.ipv4_address,  # pyright: ignore[reportAny]
        extra_ncsi_hosts=args.extra_ncsi_hosts or [],  # pyright: ignore[reportAny]
    )
    run(config, args.hostname_file)  # pyright: ignore[reportAny]


if __name__ == "__main__":
    main()
