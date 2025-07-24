NAME := ytl-linux-digabi2-wsl
VERSION := 0.0.5

DEPENDENCIES := --depends naksu2 --depends libnotify4 --depends libnss3 --depends xdg-utils --depends libasound2 --depends docker-ce --depends docker-ce-cli --depends ethtool
CONFLICTS := --conflicts wslu
DEB_ROOT := deb-root

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p ${DEB_ROOT}/usr/local/bin/
	cp wslview ${DEB_ROOT}/usr/local/bin/

	mkdir -p ${DEB_ROOT}/usr/share/applications/
	cp wslview.desktop ${DEB_ROOT}/usr/share/applications/

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)/

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
