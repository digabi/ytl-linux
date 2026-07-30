# ytl-linux-system-reset

This package provides a quick GUI-driven way for the user to reset the state and configuration of YTL-Linux without fully reinstalling the system.

What this does:

- Deletes the Naksu 2 workdir (`~/.local/share/digabi/naksu2`) incl. everything the Abitti 2 server would use, its logs, etc.
- Removes examnet settings
- Removes all Docker images and volumes
