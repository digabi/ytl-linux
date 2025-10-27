from __future__ import annotations

from collections.abc import Generator
from contextlib import contextmanager
import socket

from zeroconf import IPVersion, NonUniqueNameException, ServiceInfo, Zeroconf

from .config import Config


class AnnouncerGaveUp(Exception): ...


class Announcer:
    def __init__(self, config: Config):
        self.config: Config = config

    def generate_info(self, suffix: str = ""):
        config = self.config
        friendly_name = f"{self.config.friendly_name}{suffix}"
        return ServiceInfo(
            "_http._tcp.local.",
            f"{friendly_name}._http._tcp.local.",
            addresses=[socket.inet_aton(config.ipv4_address)],
            port=config.bouncer_port,
            server=f"{friendly_name}.local.",
        )

    @contextmanager
    def start(self, attempts: int = 9) -> Generator[ServiceInfo]:
        zeroconf = Zeroconf(ip_version=IPVersion.V4Only)

        def suffixes():
            yield ""
            for i in range(attempts):
                yield f"-{i + 1}"

        for suffix in suffixes():
            try:
                info = self.generate_info(suffix)
                zeroconf.register_service(info)
            except NonUniqueNameException:
                continue
            break
        else:
            raise AnnouncerGaveUp(f"{self.config.friendly_name!r} is taken")
        try:
            yield info
        finally:
            zeroconf.close()
