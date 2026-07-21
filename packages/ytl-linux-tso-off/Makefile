export NAME := ytl-linux-tso-off
export DESCRIPTION := "Turn TSO off for all Ethernet devices"
export VERSION := 0.1

DEPENDENCIES := --depends ethtool --depends bash --depends bsdutils

deb:
	# The carrot (for traditional Debian-style /etc/network)
	mkdir -p deb-root/etc/network/if-up.d
	cp ytl-linux-tso-off-network deb-root/etc/network/if-up.d/
	chmod 755 deb-root/etc/network/if-up.d/ytl-linux-tso-off-network

	# The carrot (for NetworkManager)
	mkdir -p deb-root/etc/NetworkManager/dispatcher.d
	cp ytl-linux-tso-off-nm deb-root/etc/NetworkManager/dispatcher.d/
	chmod 755 deb-root/etc/NetworkManager/dispatcher.d/ytl-linux-tso-off-nm

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/ytl-linux-tso-off
	cp *.md deb-root/usr/local/share/doc/ytl-linux-tso-off/

	ytl-fpm \
		$(DEPENDENCIES)
