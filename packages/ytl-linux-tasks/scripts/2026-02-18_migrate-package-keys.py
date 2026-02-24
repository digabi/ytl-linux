#!/usr/bin/env python3

import pathlib

sources = "docker", "virtualbox-oracle", "ytl-linux"


def merge(source: str, key: str):
    def inner():
        yield from source.splitlines(keepends=False)
        yield "Signed-By:"
        for line in key.splitlines(keepends=False):
            line = line.strip() or "."
            yield f" {line}"
        yield ""

    return "\n".join(inner())


if __name__ == "__main__":
    etc_apt = pathlib.Path("/etc/apt")
    sources_list_d = etc_apt / "sources.list.d"
    trusted_gpg_d = etc_apt / "trusted.gpg.d"
    for src in sources:
        src_file = sources_list_d / f"{src}.sources"
        src_orig = sources_list_d / f"{src}.sources.orig"
        key_file = trusted_gpg_d / f"{src}.list.asc"
        key_orig = trusted_gpg_d / f"{src}.list.asc.orig"
        migrated = src_orig.is_file() and key_orig.is_file()
        neednt_migrate = not key_file.is_file() and not key_orig.is_file()
        if migrated or neednt_migrate:
            print(f"{src}: no need to migrate")
            continue
        source = src_file.read_text()
        key = key_file.read_text()
        src_file.rename(src_orig)
        print(f"moved {src_file} -> {src_orig}")
        key_file.rename(key_orig)
        print(f"moved {key_file} -> {key_orig}")
        src_file.write_text(merge(source, key))
        print(f"updated {src_file} with key")
