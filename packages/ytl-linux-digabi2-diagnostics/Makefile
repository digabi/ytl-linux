NAME := ytl-linux-digabi2-diagnostics
VERSION := 1.0.0

DEB_ROOT := deb-root

deb:
	if [ -d $(DEB_ROOT) ]; then rm -fR $(DEB_ROOT)/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	# Package documentation (placeholder directory)
	mkdir -p $(DEB_ROOT)/usr/local/share/doc/$(NAME)

	# Install diagnostics scripts
	mkdir -p $(DEB_ROOT)/usr/share/ytl-linux-diagnostics
	cp network-log-to-html.sh $(DEB_ROOT)/usr/share/ytl-linux-diagnostics/
	cp test-connections.sh $(DEB_ROOT)/usr/share/ytl-linux-diagnostics/
	cp run-network-diagnostics.sh $(DEB_ROOT)/usr/share/ytl-linux-diagnostics/
	chmod 755 $(DEB_ROOT)/usr/share/ytl-linux-diagnostics/*.sh

	# Wrapper script in /usr/local/bin
	mkdir -p $(DEB_ROOT)/usr/local/bin
	cp ytl-network-diagnostics.sh $(DEB_ROOT)/usr/local/bin/ytl-network-diagnostics
	chmod 755 $(DEB_ROOT)/usr/local/bin/ytl-network-diagnostics

	fpm -C $(DEB_ROOT)/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		--description "Internet diagnostics for Abitti2" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		.

