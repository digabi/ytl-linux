from __future__ import annotations

from dataclasses import dataclass

import validators


@dataclass(frozen=True)
class Config:
    canonical_host: str
    friendly_name: str
    ipv4_address: str
    bouncer_port: int
    ncsi_hosts: list[str]

    @property
    def canonical_url(self):
        port = "" if ":" in self.canonical_host else ":8010"
        return f"https://{self.canonical_host}{port}/"

    def __post_init__(self):
        validations = [
            validators.hostname(
                self.canonical_host,
                skip_ipv4_addr=True,
                skip_ipv6_addr=True,
                may_have_port=True,
                maybe_simple=True,
            ),
            validators.slug(self.friendly_name),
            validators.ipv4(
                self.ipv4_address,
                cidr=False,
                private=True,
            ),
            *(validators.hostname(host) for host in self.ncsi_hosts)
        ]
        for result in validations:
            if isinstance(result, validators.ValidationError):
                raise result
