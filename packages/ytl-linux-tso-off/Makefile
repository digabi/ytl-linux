VERSION := 0.1

DEPENDENCIES := --depends ethtool --depends bash --depends bsdutils

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f ytl-linux-tso-off_$(VERSION)_all.deb ]; then rm ytl-linux-tso-off_$(VERSION)_all.deb; fi

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

	fpm -C deb-root/ -s dir --name ytl-linux-tso-off --architecture all -t deb --version "$(VERSION)" \
		 --description "Turn TSO off for all ethernet devices" \
		 --maintainer "abitti@ylioppilastutkinto.fi" \
		 --vendor "Matriculation Examination Board" \
		 --url "https://github.com/digabi/ytl-linux" \
		 --deb-no-default-config-files \
		 $(DEPENDENCIES) \
		.
