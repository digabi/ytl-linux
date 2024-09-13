VERSION := "0.0"

DEPENDENCIES := --depends ethtool --depends bash --depends bsdutils

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f ytl-linux-tso-off_$(VERSION)_all.deb ]; then rm ytl-linux-tso-off_$(VERSION)_all.deb; fi

	# The carrot
	mkdir -p deb-root/etc/network/if-up.d
	cp ytl-linux-tso-off deb-root/etc/network/if-up.d
	chmod 755 deb-root/etc/network/if-up.d/ytl-linux-tso-off

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
