from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass(frozen=True)
class Config:
    canonical_url: str
    friendly_name: str
    ipv4_address: str
    bouncer_port: int
    extra_ncsi_hosts: list[str]

    def __post_init__(self):
        scheme, netloc, path, params, query, fragment = urlparse(self.canonical_url)
        checks = {
            "URL must be an HTTPS URL":         scheme == "https",
            "URL must be absolute":             netloc != "",
            "URL must not have a path":         path in ("/", ""),
            "URL must not have extra params":   params == "",
            "URL must not have a query string": query == "",
            "URL must not have a fragment":     fragment == "",
        }
        for check in checks:
            if checks[check]:
                continue
            raise ValueError(check)
