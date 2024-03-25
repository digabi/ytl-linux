NAME := ytl-linux-purge-deb
VERSION := "0.0.1"

DEPENDENCIES := --depends debianutils --depends cron --depends bash --depends bsdutils
DEB_ROOT := deb-root

deb:
	if [ -d $(DEB_ROOT) ]; then rm -fR $(DEB_ROOT)/; fi
	if [ -f $(NAME)_$(VERSION)_amd64.deb ]; then rm $(NAME)_$(VERSION)_amd64.deb; fi

	# Package documentation
	mkdir -p $(DEB_ROOT)/usr/local/share/doc/$(NAME)

	mkdir -p $(DEB_ROOT)/etc/cron.d
	cp cronjob $(DEB_ROOT)/etc/cron.d/$(NAME)
	chmod 0644 $(DEB_ROOT)/etc/cron.d/$(NAME)

	mkdir -p $(DEB_ROOT)/usr/local/sbin
	cp ytl-linux-purge-deb $(DEB_ROOT)/usr/local/sbin/ytl-linux-purge-deb
	chmod 755 $(DEB_ROOT)/usr/local/sbin/ytl-linux-purge-deb

	mkdir -p $(DEB_ROOT)/etc
	cp ytl-linux-purge-deb.conf $(DEB_ROOT)/etc/ytl-linux-purge-deb.conf
	chmod 644 $(DEB_ROOT)/etc/ytl-linux-purge-deb.conf

	fpm -C $(DEB_ROOT)/ -s dir --name $(NAME) --architecture native -t deb --version "$(VERSION)" \
		--description "Script to remove named deb packages if they are installed" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		$(DEPENDENCIES) \
		.
