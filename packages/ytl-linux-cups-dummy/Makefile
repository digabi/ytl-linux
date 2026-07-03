NAME := ytl-linux-cups-dummy
VERSION := 0.1

DEPENDENCIES := --depends cinnamon-common --depends bash
CONFLICTS := --conflicts cups-client --conflicts cups-bsd --conflicts lpr --conflicts lprng
REPLACES := --replaces cups-client --replaces cups-bsd --replaces lpr --replaces lprng

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	# Copy scripts
	mkdir -p deb-root/usr/bin/

	cp lpq deb-root/usr/bin/
	chmod 755 deb-root/usr/bin/lpq

	cp lpstat deb-root/usr/bin/
	chmod 755 deb-root/usr/bin/lpstat

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)/

	fpm -C deb-root/ -s dir --name "$(NAME)" --architecture all -t deb --version "$(VERSION)" \
		 --description "A dummy version of lpstat and lpq to fool Cinnamon" \
		 --maintainer "abitti@ylioppilastutkinto.fi" \
		 --vendor "Matriculation Examination Board" \
		 --url "https://github.com/digabi/ytl-linux" \
		 --deb-no-default-config-files \
		 $(DEPENDENCIES) \
		 $(CONFLICTS) \
		 $(REPLACES) \
		.
