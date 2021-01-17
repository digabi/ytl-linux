VERSION := "1.0.2"

# Dependencies which are not related to any code in the
DEPENDENCIES_META := --depends virtualbox-6.1 --depends ethtool --depends exfat-fuse --depends update-manager

DEPENDENCIES_NAKSU := --depends wget --depends zenity
DEPENDENCIES_YTL-GRUB-SAFE-GRAPHICS := --depends policykit-1

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f ytl-linux-customize_$(VERSION)_amd64.deb ]; then rm ytl-linux-customize_$(VERSION)_amd64.deb; fi

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/ytl-linux-customize

	# Script shebang
	mkdir deb-scripts
	bash -c 'echo -e "#!/bin/sh\n\n" >deb-scripts/after-install.sh'
	bash -c 'echo -e "#\!/bin/sh\n\n" >deb-scripts/after-remove.sh'

	# Naksu
	mkdir -p deb-root/usr/local/bin/
	cp naksu/naksu deb-root/usr/local/bin/
	chmod 755 deb-root/usr/local/bin/naksu

	mkdir -p deb-root/usr/share/applications/
	cp naksu/naksu.desktop deb-root/usr/share/applications/

	mkdir -p deb-root/usr/local/lib/naksu/
	cp naksu/naksu.png deb-root/usr/local/lib/naksu/

	# dconf default settings
	mkdir -p deb-root/etc/dconf/profile/
	cp dconf/user deb-root/etc/dconf/profile/
	mkdir -p deb-root/etc/dconf/db/local.d/
	cp dconf/01-power-settings deb-root/etc/dconf/db/local.d/

	cat dconf/after-install.sh >>deb-scripts/after-install.sh
	cat dconf/after-remove.sh >>deb-scripts/after-remove.sh

	# ytl-grub-safe-graphics depends
	mkdir -p deb-root/usr/local/sbin/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics-on deb-root/usr/local/sbin/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics-off deb-root/usr/local/sbin/
	chmod 755 deb-root/usr/local/sbin/ytl-grub-safe-graphics-*

	mkdir -p deb-root/usr/share/applications/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics-on.desktop deb-root/usr/share/applications/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics-off.desktop deb-root/usr/share/applications/

	mkdir -p deb-root/usr/share/polkit-1/actions
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics.policy deb-root/usr/share/polkit-1/actions/

	mkdir -p deb-root/usr/local/share/pixmaps/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics.png deb-root/usr/local/share/pixmaps/

	cp ytl-grub-safe-graphics/*.md deb-root/usr/local/share/doc/ytl-linux-customize/

	fpm -C deb-root/ -s dir --name ytl-linux-customize --architecture native -t deb --version "$(VERSION)" \
		 --after-install deb-scripts/after-install.sh \
		 --after-remove deb-scripts/after-remove.sh \
		 $(DEPENDENCIES_META) \
		 $(DEPENDENCIES_NAKSU) \
		 $(DEPENDENCIES_YTL-GRUB-SAFE-GRAPHICS) \
		.
