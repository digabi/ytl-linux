NAME := ytl-linux-purge-deb
VERSION := 0.0.4

CONFLICTS := \
	--conflicts open-iscsi \
	--conflicts networkd-dispatcher \
	--conflicts cups \
	--conflicts cups-browsed \
	--conflicts cups-bsd \
	--conflicts cups-core-drivers \
	--conflicts cups-daemon \
	--conflicts cups-filters \
	--conflicts cups-filters-core-drivers \
	--conflicts cups-ipp-utils \
	--conflicts cups-pdf \
	--conflicts cups-ppdc \
	--conflicts cups-server-common

DEB_ROOT := deb-root

deb:
	if [ -d $(DEB_ROOT) ]; then rm -fR $(DEB_ROOT)/; fi
	if [ -f $(NAME)_$(VERSION)_amd64.deb ]; then rm $(NAME)_$(VERSION)_amd64.deb; fi

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)/

	fpm -C $(DEB_ROOT)/ -s dir --name $(NAME) --architecture native -t deb --version "$(VERSION)" \
		--description "Metapackage to remove obsolete deb packages installed by Ubuntu Autoinstall" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		--after-install after-install.sh \
		$(CONFLICTS) \
		.
