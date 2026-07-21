# ytl-linux-cpu-governor

This package depends on `cpufrequtils`, and sets CPU governor "performance" to all CPUs/cores for [CPU performance scaling](https://www.kernel.org/doc/html/latest/admin-guide/pm/cpufreq.html). This is to prevent machines running YTL Linux to end up in CPU power saving mode, causing issues with conducting the exam due to the computer arbitrarily restricting its performance below capacity.

To build the deb package, run:

```bash
just deb
```
