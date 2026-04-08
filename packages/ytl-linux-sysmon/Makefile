NAME := ytl-linux-sysmon
VERSION := 0.1.0

# This package also depends on the bandwhich snap, but we have to install that in the postinstall step
DEPENDENCIES := --depends netdata

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p deb-root

	mkdir -p deb-root/usr/share/applications/
	cp -r desktop/* deb-root/usr/share/applications/

	mkdir -p deb-root/usr/share/icons/
	cp -r icons/* deb-root/usr/share/icons/

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		--description "YTL Linux system monitoring tools" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		--deb-no-default-config-files \
		--after-install after-install.sh \
		--after-remove after-remove.sh \
		$(DEPENDENCIES) \
		.
