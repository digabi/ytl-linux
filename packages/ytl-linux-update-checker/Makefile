NAME := ytl-linux-update-checker
VERSION := 0.1.0

DEPENDENCIES := --depends zenity

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p deb-root

	mkdir -p deb-root/usr/local/sbin
	cp ytl-linux-update-checker deb-root/usr/local/sbin

	mkdir -p deb-root/usr/local/bin
	cp ytl-linux-update-dialog deb-root/usr/local/bin

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		--description "YTL Linux automatic update checker and notifier tool" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		--deb-no-default-config-files \
		--after-install after-install.sh \
		--after-remove after-remove.sh \
		$(DEPENDENCIES) \
		.
