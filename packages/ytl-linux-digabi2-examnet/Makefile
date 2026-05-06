NAME := ytl-linux-digabi2-examnet
VERSION := 1.0.0

DEPENDENCIES := \
	--depends apt \
	--depends dnsmasq \
	--depends jq \
	--depends network-manager
DEB_ROOT := deb-root

deb:
	if [ -d $(DEB_ROOT) ]; then rm -fR $(DEB_ROOT)/; fi
	if [ -f $(NAME)_$(VERSION)_amd64.deb ]; then rm $(NAME)_$(VERSION)_amd64.deb; fi

	# Script files
	mkdir -p $(DEB_ROOT)/usr/local/sbin/
	cp ytl-linux-digabi2-examnet-legacy $(DEB_ROOT)/usr/local/sbin/
	cp ytl-linux-digabi2-docker-configure.sh $(DEB_ROOT)/usr/local/sbin/
	cp ytl-linux-digabi2-examnet $(DEB_ROOT)/usr/local/sbin/
	
	mkdir -p $(DEB_ROOT)/usr/local/libexec/ytl-linux-digabi2-examnet/lib
	cp justfile $(DEB_ROOT)/usr/local/libexec/ytl-linux-digabi2-examnet/justfile
	cp lib/* $(DEB_ROOT)/usr/local/libexec/ytl-linux-digabi2-examnet/lib/

	# Config templates
	mkdir -p ${DEB_ROOT}/etc/ytl-linux-digabi2-examnet/templates/
	cp templates/* ${DEB_ROOT}/etc/ytl-linux-digabi2-examnet/templates

	# Examnet configs
	mkdir -p $(DEB_ROOT)/etc/ytl-linux-digabi2-examnet/config/
	cp conf/* $(DEB_ROOT)/etc/ytl-linux-digabi2-examnet/config/

	# NetworkManager configuration
	mkdir -p $(DEB_ROOT)/etc/NetworkManager/conf.d/
	cp -r NetworkManager/* $(DEB_ROOT)/etc/NetworkManager/conf.d/

	# Bouncer
	(cd bouncer; deno run tests)
	(cd bouncer; deno run build)

	# Discovery
	(cd discovery && deno run tests)
	(cd discovery && deno run build)

	chmod 755 $(DEB_ROOT)/usr/local/sbin/*

	# systemd unit files
	mkdir -p $(DEB_ROOT)/etc/systemd/system/
	cp ytl-linux-digabi2-examnet.service $(DEB_ROOT)/etc/systemd/system/
	cp ytl-linux-digabi2-examnet-discovery.service $(DEB_ROOT)/etc/systemd/system/
	cp ytl-linux-digabi2-examnet-discovery.timer $(DEB_ROOT)/etc/systemd/system/

	chmod 644 $(DEB_ROOT)/etc/systemd/system/*

	# Polkit policy
	mkdir -p $(DEB_ROOT)/usr/share/polkit-1/actions/
	cp ytl-linux-digabi2-examnet.policy $(DEB_ROOT)/usr/share/polkit-1/actions/

	# Package documentation
	mkdir -p $(DEB_ROOT)/usr/local/share/doc/$(NAME)
	cp *.md $(DEB_ROOT)/usr/local/share/doc/$(NAME)/

	fpm -C $(DEB_ROOT)/ -s dir --name $(NAME) --architecture amd64 -t deb --version "$(VERSION)" \
		 --description "Digabi 2 exam network setup tool" \
		 --maintainer "abitti@ylioppilastutkinto.fi" \
		 --vendor "Matriculation Examination Board" \
		 --url "https://github.com/digabi/ytl-linux" \
		 $(DEPENDENCIES) \
		 --after-install after-install.sh \
		 --before-remove before-remove.sh \
		.
