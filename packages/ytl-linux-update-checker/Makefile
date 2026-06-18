NAME := ytl-linux-update-checker
VERSION := 0.1.0

DEPENDENCIES := --depends zenity
DEB_ROOT := deb-root

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p $(DEB_ROOT)

	mkdir -p $(DEB_ROOT)/usr/local/sbin
	cp ytl-linux-update-checker $(DEB_ROOT)/usr/local/sbin

	mkdir -p $(DEB_ROOT)/usr/local/bin
	cp ytl-linux-update-dialog $(DEB_ROOT)/usr/local/bin

	mkdir -p $(DEB_ROOT)/etc/systemd/system
	cp ytl-linux-update-check.service $(DEB_ROOT)/etc/systemd/system
	cp ytl-linux-update-check.timer $(DEB_ROOT)/etc/systemd/system

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		--description "YTL Linux automatic update checker and notifier tool" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		--deb-no-default-config-files \
		--after-install after-install.sh \
		$(DEPENDENCIES) \
		.
