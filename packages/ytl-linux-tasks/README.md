# ytl-linux-tasks

A user-friendly command runner for repeatable administration tasks in YTL Linux.

## Purpose

This package serves two main purposes:

**#1:** A repeatable way to easily distribute scripts to end users for e.g. troubleshooting or resolving common issues, without needing to figure out the distribution mechanism again every time.

**#2**: A way to "retrofit" existing installations with changes that cannot be performed in a package's postinstall script. Essentially, this feature is meant to be equivalent to the user typing a command after `apt upgrade` to do something, but without the "user typing" part.

## Development

Scripts can be written in any language, either inside the `justfile`, or as external scripts in the `scripts` directory if necessary, and called from there. The `scripts` directory is available in the same relative position in production as it is during development.

The `maintenance` recipe is special: It doesn't execute any commands of its own, it only calls other recipes. It's executed as a oneshot systemd service every time the computer is started. You could essentially think of it as SQL migrations, but for Linux.

> [!WARNING]
>
> At the time of writing (23.7.2026), the `maintenance` task **does not** track what tasks have already been executed, and **will run all of them on every boot**. As such, **every maintenance task must check for itself whether it has already been executed (i.e. be idempotent)**, so that it does not try to repeat the operation on a system in an already valid state and potentially crash out on e.g. files that have already been moved.

To build the deb package, run:

```bash
just deb
```
