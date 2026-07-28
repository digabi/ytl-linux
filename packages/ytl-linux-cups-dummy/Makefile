export NAME := ytl-linux-cups-dummy
export DESCRIPTION := "A dummy version of lpstat and lpq to fool Cinnamon"
export VERSION := 0.1

DEPENDENCIES := --depends cinnamon-common --depends bash
CONFLICTS := --conflicts cups-client --conflicts cups-bsd --conflicts lpr --conflicts lprng
REPLACES := --replaces cups-client --replaces cups-bsd --replaces lpr --replaces lprng

deb:
	# Copy scripts
	mkdir -p deb-root/usr/bin/

	cp lpq deb-root/usr/bin/
	chmod 755 deb-root/usr/bin/lpq

	cp lpstat deb-root/usr/bin/
	chmod 755 deb-root/usr/bin/lpstat

	ytl-fpm \
		$(DEPENDENCIES) \
		$(CONFLICTS) \
		$(REPLACES)
