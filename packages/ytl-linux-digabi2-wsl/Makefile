export NAME := ytl-linux-digabi2-wsl
export DESCRIPTION := "Metapackage that install prerequisites for the Abitti 2 server (Docker, Naksu 2) - WSL version"
export VERSION := 0.1.0

DEPENDENCIES := \
	--depends naksu2 \
	--depends libnotify4 \
	--depends libnss3 \
	--depends xdg-utils \
	--depends libasound2 \
	--depends docker-ce \
	--depends docker-ce-cli \
	--depends ethtool

CONFLICTS := \
	--conflicts wslu

deb:
	mkdir -p deb-root/usr/local/bin/
	cp wslview deb-root/usr/local/bin/

	mkdir -p deb-root/usr/share/applications/
	cp wslview.desktop deb-root/usr/share/applications/

	# APT preferences to pin Docker Engine to v28
	mkdir -p deb-root/etc/apt/preferences.d
	cp apt-prefs/* deb-root/etc/apt/preferences.d/

	# Systemd service to downgrade Docker if needed
	mkdir -p deb-root/etc/systemd/system/ deb-root/usr/local/sbin/
	cp downgrade-docker.service deb-root/etc/systemd/system/
	cp downgrade-docker.sh deb-root/usr/local/sbin/

	ytl-fpm \
		--before-install before-install.sh \
		--after-install after-install.sh \
		$(DEPENDENCIES) \
		$(CONFLICTS) \
		.
