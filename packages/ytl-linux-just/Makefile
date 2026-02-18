NAME := ytl-linux-just
VERSION := 0.1

DEPENDENCIES := --depends just

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p deb-root
	install -D -m 644 justfile deb-root/usr/local/share/ytl-linux-just/justfile
	install -D -m 755 ytljust deb-root/usr/local/bin/ytljust
	cp -r scripts deb-root/usr/local/share/ytl-linux-just/scripts

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		--description "Command runner specialized for YTL Linux administration tasks" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		--deb-no-default-config-files \
		$(DEPENDENCIES) \
		.
