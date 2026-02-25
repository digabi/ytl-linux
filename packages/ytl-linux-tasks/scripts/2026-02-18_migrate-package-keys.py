#!/usr/bin/env python3

import pathlib

SOURCE_NAMES = "docker", "virtualbox-oracle", "ytl-linux"


def merge(source: str, key: str):
    def inner():
        yield from source.splitlines(keepends=False)
        yield "Signed-By:"
        for line in key.splitlines(keepends=False):
            line = line.strip() or "."
            yield f" {line}"
        yield ""

    return "\n".join(inner())


class Source:
    ETC_APT = pathlib.Path("/etc/apt")
    SOURCES_LIST_D = ETC_APT / "sources.list.d"
    TRUSTED_GPG_D = ETC_APT / "trusted.gpg.d"

    def __init__(self, name: str):
        self.name = name
        self.sources_target = self.SOURCES_LIST_D / f"{name}.sources"
        self.sources_backup = self.SOURCES_LIST_D / f"{name}.sources.orig"
        self.key_target = self.TRUSTED_GPG_D / f"{name}.list.asc"
        self.key_backup = self.TRUSTED_GPG_D / f"{name}.list.asc.orig"

    def is_present(self):
        return self.sources_target.is_file() and self.key_target.is_file()

    def is_migrated(self):
        return self.sources_backup.is_file() and self.key_backup.is_file()

    def migrate(self):
        if self.is_migrated():
            print(f"{self.name}: already migrated")
            return

        sources_content = self.sources_target.read_text()
        key_content = self.key_target.read_text()

        self.sources_target.rename(self.sources_backup)
        print(f"Renamed '{self.sources_target}' -> '{self.sources_backup}'")

        self.key_target.rename(self.key_backup)
        print(f"Renamed '{self.key_target}' -> '{self.key_backup}'")

        self.sources_target.write_text(merge(sources_content, key_content))
        print(f"Updated '{self.sources_target}' with public key")


if __name__ == "__main__":
    sources = [Source(name) for name in SOURCE_NAMES]

    for src in sources:
        if not src.is_migrated() and not src.is_present():
            raise SystemExit(
                f"Missing package source {src.name!r}, refusing to continue"
            )

    for src in sources:
        src.migrate()
