# ytl-linux-update-checker

Tool that periodically runs `apt update`, checks if updates are available to YTL Linux packages, prompts the user to install updates if available, and gives the user a one-click method to do so without needing to use the command line. The prompt also speaks the user's language (in not only terminology, but also Finnish and Swedish).

This tool works differently to the regular Ubuntu update prompt in that it only triggers when one of our packages updates, in order to prevent prompt saturation and thus make the prompt a meaningful call to action with end users.

To build the deb package, run:

```bash
just deb
```
