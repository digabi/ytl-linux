# ytl-linux-update-checker

Tool that periodically runs `apt update`, checks if updates are available to YTL Linux packages, prompts the user to install updates if available, and gives the user a one-click method to do so without needing to use the command line. The prompt also speaks the user's language (in not only terminology, but also Finnish and Swedish).

This tool works differently to the regular Ubuntu update prompt in that it only triggers when one of our packages updates, in order to prevent prompt saturation and thus make the prompt a meaningful call to action with end users.

To build the deb package, run:

```bash
just deb
```
## Usage

The `ytl-linux-update-checker` script is driven by a systemd timer every hour, which checks if updates to ytl-provided packages are available. If they are available and the `school` user has a graphical session logged in, it invokes `ytl-linux-update-dialog`, which prompts the user for update.

If the user declines, a `snoozed_until` file pointing 24 hours into the future is written to `/var/lib/ytl-linux-update-check`, which is a directory owned by `school:school`.

If the user accepts the update in the dialog, `pkexec` is called upon to execute `ytl-linux-software-update` with root permissions to update the system.

## Manually overriding the snooze

If the user has snoozed the updates in the dialog, for the next 24 hours `ytl-linux-update-dialog` will not start even if updates are available. This is remedied by deleting the snooze file:

`rm /var/lib/ytl-linux-update-check/snoozed_until`

If the update process is wanted to start now, a simple systemctl command suffices, providing the updates are not snoozed:

`systemctl start ytl-linux-update-check.service`
