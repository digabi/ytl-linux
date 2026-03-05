NAME := ytl-linux-tasks
VERSION := 0.2.0

DEPENDENCIES := --depends just

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p deb-root
	install -D -m 644 justfile deb-root/usr/local/share/ytl-linux-tasks/justfile
	install -D -m 755 ytl-tasks deb-root/usr/local/bin/ytl-tasks
	cp -r scripts deb-root/usr/local/share/ytl-linux-tasks/scripts

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		--description "Command runner specialized for YTL Linux administration tasks" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		--deb-no-default-config-files \
		--after-install after-install.sh \
		--after-upgrade after-install.sh \
		$(DEPENDENCIES) \
		.
