export NAME := ytl-linux-customize-24
export DESCRIPTION := "YTL Linux specific customisations for Ubuntu 24.04"
export VERSION := 2.0.0

DEPENDENCIES := \
	--depends ethtool \
	--depends exfat-fuse \
	--depends update-manager \
	--depends gnome-icon-theme \
	--depends dconf-cli \
	--depends gnome-screenshot \
	--depends anydesk-meb \
	--depends ytl-linux-cpu-governor \
	--depends ytl-linux-digabi2 \
	--depends ytl-linux-digabi2-examnet \
	--depends ytl-linux-tasks \
	--depends ytl-linux-sysmon \
	--depends ytl-linux-digabi2-diagnostics \
	--depends ytl-linux-cups-dummy \
	--depends ytl-linux-update-checker \
	--depends ytl-linux-grub-safe-graphics

RECOMMENDS := --deb-recommends digabi-usb-monster

deb:
	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)

	# Qogir icons
	mkdir -p deb-root/usr/share/icons
	tar --get --xz --overwrite --file=Qogir.tar.xz --directory=deb-root/usr/share/icons

	# YTL Linux background
	mkdir -p deb-root/usr/share/backgrounds/meb
	cp ytl-linux-background.svg deb-root/usr/share/backgrounds/meb/
	sed -i 's/@VERSION/Ubuntu 24.04/' deb-root/usr/share/backgrounds/meb/ytl-linux-background.svg

	# dconf default settings
	mkdir -p deb-root/etc/dconf/profile/
	cp dconf/user deb-root/etc/dconf/profile/
	mkdir -p deb-root/etc/dconf/db/local.d/
	cp dconf/01-power-settings deb-root/etc/dconf/db/local.d/
	cp dconf/02-desktop-theme deb-root/etc/dconf/db/local.d/

	ytl-fpm \
		--after-install after-install.sh \
		--after-remove after-remove.sh \
		$(DEPENDENCIES) \
		$(RECOMMENDS)
