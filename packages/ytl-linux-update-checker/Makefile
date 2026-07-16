NAME := ytl-linux-update-checker
VERSION := 0.1.0

DEPENDENCIES := --depends zenity --depends python3-systemd --depends python3-gi --depends python3-gi-cairo --depends gir1.2-gtk-3.0
DEB_ROOT := deb-root

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p $(DEB_ROOT)

	mkdir -p $(DEB_ROOT)/usr/local/sbin
	cp ytl-linux-update-checker $(DEB_ROOT)/usr/local/sbin
	cp ytl-linux-software-update $(DEB_ROOT)/usr/local/sbin
	chmod 755 $(DEB_ROOT)/usr/local/sbin/*

	mkdir -p $(DEB_ROOT)/usr/local/bin
	cp ytl-linux-update-dialog $(DEB_ROOT)/usr/local/bin
	chmod 755 $(DEB_ROOT)/usr/local/bin/*

	mkdir -p $(DEB_ROOT)/etc/systemd/system
	cp ytl-linux-update-check.service $(DEB_ROOT)/etc/systemd/system
	cp ytl-linux-update-check.timer $(DEB_ROOT)/etc/systemd/system
	chmod 644 $(DEB_ROOT)/etc/systemd/system/*

	mkdir -p $(DEB_ROOT)/usr/share/polkit-1/actions/
	cp ytl-linux-software-update.policy $(DEB_ROOT)/usr/share/polkit-1/actions/

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		--description "YTL Linux automatic update checker and notifier tool" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		--deb-no-default-config-files \
		--after-install after-install.sh \
		--before-remove before-remove.sh \
		--after-remove after-remove.sh \
		$(DEPENDENCIES) \
		.
