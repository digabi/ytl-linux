NAME := ytl-linux-digabi2-wsl
VERSION := 0.1.0

DEPENDENCIES := \
	--depends naksu2 \
	--depends libnotify4 \
	--depends libnss3 \
	--depends xdg-utils \
	--depends libasound2 \
	--depends docker-ce \
	--depends docker-ce-cli \
	--depends ethtool

# Docker dependencies are temporarily pinned to Docker Engine v28 since Abitti 2 breaks on v29
CONFLICTS := \
	--conflicts wslu

DEB_ROOT := deb-root

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p ${DEB_ROOT}/usr/local/bin/
	cp wslview ${DEB_ROOT}/usr/local/bin/

	mkdir -p ${DEB_ROOT}/usr/share/applications/
	cp wslview.desktop ${DEB_ROOT}/usr/share/applications/

	# APT preferences to pin Docker Engine to v28
	mkdir -p deb-root/etc/apt/preferences.d
	cp apt-prefs/* deb-root/etc/apt/preferences.d/

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)/

	# Systemd service to downgrade Docker if needed
	mkdir -p deb-root/etc/systemd/system/ deb-root/usr/local/sbin/
	cp downgrade-docker.service deb-root/etc/systemd/system/
	cp downgrade-docker.sh deb-root/usr/local/sbin/

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		 --description "Digabi2 server application (WSL version)" \
		 --maintainer "abitti@ylioppilastutkinto.fi" \
		 --vendor "Matriculation Examination Board" \
		 --url "https://github.com/digabi/ytl-linux" \
		 --deb-no-default-config-files \
		 --before-install before-install.sh \
		 --after-install after-install.sh \
		 $(DEPENDENCIES) \
		 $(CONFLICTS) \
		.
