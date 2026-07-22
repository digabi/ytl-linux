NAME := ytl-linux-recovery-tools
VERSION := 0.1.0

DEPENDENCIES := \
	--depends bash \
	--depends coreutils \
	--depends e2fsprogs \
	--depends fsarchiver \
	--depends grub-efi-amd64-bin \
	--depends python3 \
	--depends rsync \
	--depends util-linux

DEB_ROOT := deb-root


deb:
	if [ -d $(DEB_ROOT) ]; then rm -fR $(DEB_ROOT)/; fi
	if [ -f $(NAME)_$(VERSION)_amd64.deb ]; then rm $(NAME)_$(VERSION)_amd64.deb; fi

	mkdir -p $(DEB_ROOT)/usr/local/sbin
	cp bin/* $(DEB_ROOT)/usr/local/sbin/
	chmod 755 $(DEB_ROOT)/usr/local/sbin/*

	mkdir -p $(DEB_ROOT)/usr/local/lib/ytl-linux-recovery-tools
	cp lib/* $(DEB_ROOT)/usr/local/lib/ytl-linux-recovery-tools/
	chmod 644 $(DEB_ROOT)/usr/local/lib/ytl-linux-recovery-tools/*
	chmod 755 $(DEB_ROOT)/usr/local/lib/ytl-linux-recovery-tools/*.sh

	mkdir -p $(DEB_ROOT)/usr/local/share/doc/$(NAME)
	cp README.md $(DEB_ROOT)/usr/local/share/doc/$(NAME)/

	fpm -C $(DEB_ROOT)/ -s dir --name $(NAME) --architecture native -t deb --version "$(VERSION)" \
		--description "Tools to build and restore YTL Linux recovery snapshots" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		$(DEPENDENCIES) \
		.


