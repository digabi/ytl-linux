NAME := ytl-linux-digabi2-examnet
VERSION := 0.0.7

DEPENDENCIES := \
	--depends apt \
	--depends dnsmasq \
	--depends network-manager \
	--depends zenity
DEB_ROOT := deb-root

deb:
	if [ -d $(DEB_ROOT) ]; then rm -fR $(DEB_ROOT)/; fi
	if [ -f $(NAME)_$(VERSION)_amd64.deb ]; then rm $(NAME)_$(VERSION)_amd64.deb; fi

	# Script file
	mkdir -p $(DEB_ROOT)/usr/local/sbin/
	cp ytl-linux-digabi2-examnet $(DEB_ROOT)/usr/local/sbin/

	# Config templates
	mkdir -p ${DEB_ROOT}/etc/ytl-linux-digabi2-examnet/templates/
	cp templates/* ${DEB_ROOT}/etc/ytl-linux-digabi2-examnet/templates

	# Examnet configs
	mkdir -p $(DEB_ROOT)/etc/ytl-linux-digabi2-examnet/conf/
	cp conf/* $(DEB_ROOT)/etc/ytl-linux-digabi2-examnet/conf/

	# Bouncer
	(cd digabi2-examnet-bouncer \
		&& \
		docker build \
			-f Dockerfile.build \
			--platform linux/amd64 \
			-t registry.invalid/digabi2-examnet-bouncer-build \
			. \
		&& \
		docker run \
			--rm \
			--mount type=bind,src=$(shell pwd)/$(DEB_ROOT)/usr/local/sbin/,dst=/out \
			registry.invalid/digabi2-examnet-bouncer-build \
				install -o $(shell id -u) /dist/digabi2-examnet-bouncer /out \
		)

	chmod 755 $(DEB_ROOT)/usr/local/sbin/*

	# systemd unit file
	mkdir -p $(DEB_ROOT)/etc/systemd/system/
	cp ytl-linux-digabi2-examnet.service $(DEB_ROOT)/etc/systemd/system/

	chmod 644 $(DEB_ROOT)/etc/systemd/system/*

	# Package documentation
	mkdir -p $(DEB_ROOT)/usr/local/share/doc/$(NAME)
	cp *.md $(DEB_ROOT)/usr/local/share/doc/$(NAME)/

	fpm -C $(DEB_ROOT)/ -s dir --name $(NAME) --architecture amd64 -t deb --version "$(VERSION)" \
		 --description "Digabi2 exam network setup tool (PoC)" \
		 --maintainer "abitti@ylioppilastutkinto.fi" \
		 --vendor "Matriculation Examination Board" \
		 --url "https://github.com/digabi/ytl-linux" \
		 $(DEPENDENCIES) \
		 --after-install after-install.sh \
		 --before-remove before-remove.sh \
		.
