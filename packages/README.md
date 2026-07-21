# YTL-Linux deb packages

This repository contains all deb packages available from the YTL APT repository (https://linux.abitti.fi).

Each directory is treated as a separate package. Each directory must contain at least a `Makefile` that exports environment variables `NAME`, `DESCRIPTION` and `VERSION`, and has a `deb` target that calls `ytl-fpm`.
