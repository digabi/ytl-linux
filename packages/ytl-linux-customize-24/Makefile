export NAME := ytl-linux-customize-24
export DESCRIPTION := "YTL Linux specific customisations for Ubuntu 24.04"
export VERSION := 2.0.2

DEPENDENCIES := \
	--depends ethtool \
	--depends exfat-fuse \
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
	--depends ytl-linux-grub-safe-graphics \
	--depends ytl-linux-system-reset

RECOMMENDS := --deb-recommends digabi-usb-monster

deb:
	# Qogir icons
	mkdir -p deb-root/usr/share/icons
	tar --get --xz --overwrite --file=Qogir.tar.xz --directory=deb-root/usr/share/icons

	# YTL Linux background
	mkdir -p deb-root/usr/share/backgrounds/meb
	cp ytl-linux-background.svg deb-root/usr/share/backgrounds/meb/
	sed -i 's/@VERSION/Ubuntu 24.04/' deb-root/usr/share/backgrounds/meb/ytl-linux-background.svg

	# YTL Linux "Start" menu icon
	mkdir -p deb-root/usr/share/icons/hicolor/symbolic/apps/
	install -D -m 644 ytl-linux-start-menu-icon.svg deb-root/usr/share/icons/hicolor/symbolic/apps/fi.ylioppilastutkinto.ytl-linux-start-menu.svg

	# Backups icon
	install -D -m 644 ytl-linux-answers-backups-icon.svg deb-root/usr/share/icons/hicolor/symbolic/apps/fi.ylioppilastutkinto.answers-backups.svg

	# Desktop shortcuts
	mkdir -p deb-root/home/school/Desktop

	# Check that all desktop shortcuts are executable
	for shortcut in desktop/*.desktop; do \
		if [ ! -x $$shortcut ]; then \
			echo "Error: $$shortcut is not executable, this will cause a warning to the user when they attempt to double-click it"; \
			echo "Fix the issue with: chmod +x $$shortcut"; \
			exit 1; \
		fi; \
	done

	cp desktop/*.desktop deb-root/home/school/Desktop/

	# dconf settings
	mkdir -p deb-root/etc/dconf/
	cp -r dconf/* deb-root/etc/dconf/

	ytl-fpm \
		--after-install after-install.sh \
		--after-remove after-remove.sh \
		$(DEPENDENCIES) \
		$(RECOMMENDS)
