#!/bin/bash

# Remove deprecated configuration file
if [ -f /etc/ytl-linux-purge-deb.conf ]; then
    rm -f /etc/ytl-linux-purge-deb.conf
fi
