export NAME := ytl-linux-digabi2-examnet
export DESCRIPTION := "Setup tools and background services for Abitti 2 exam networks"
export VERSION := 2.0.0

DEPENDENCIES := \
	--depends apt \
	--depends dnsmasq \
	--depends dnsutils \
	--depends ipset \
	--depends iptables \
	--depends jq \
	--depends network-manager

deb:
	# Script files
	mkdir -p deb-root/usr/local/sbin/
	cp ytl-linux-digabi2-examnet-legacy deb-root/usr/local/sbin/
	cp ytl-linux-digabi2-docker-configure.sh deb-root/usr/local/sbin/
	cp ytl-linux-digabi2-examnet deb-root/usr/local/sbin/

	mkdir -p deb-root/usr/local/libexec/ytl-linux-digabi2-examnet/lib
	cp justfile deb-root/usr/local/libexec/ytl-linux-digabi2-examnet/justfile
	cp lib/* deb-root/usr/local/libexec/ytl-linux-digabi2-examnet/lib/

	# Config templates
	mkdir -p ${DEB_ROOT}/etc/ytl-linux-digabi2-examnet/templates/
	cp templates/* ${DEB_ROOT}/etc/ytl-linux-digabi2-examnet/templates

	# Examnet configs
	mkdir -p deb-root/etc/ytl-linux-digabi2-examnet/config/
	cp conf/* deb-root/etc/ytl-linux-digabi2-examnet/config/

	# NetworkManager configuration
	mkdir -p deb-root/etc/NetworkManager/conf.d/
	cp -r NetworkManager/* deb-root/etc/NetworkManager/conf.d/

	# Defaults for individual dnsmasq services
	mkdir -p deb-root/etc/default
	cp etc/default/* deb-root/etc/default/

	# Bouncer
	(cd bouncer; deno run tests)
	(cd bouncer; deno run build)

	# Discovery
	(cd discovery && deno run tests)
	(cd discovery && deno run build)

	chmod 755 deb-root/usr/local/sbin/*

	# systemd unit files
	mkdir -p deb-root/etc/systemd/system/
	cp ytl-linux-digabi2-examnet.service deb-root/etc/systemd/system/
	cp ytl-linux-digabi2-examnet-firewall.service deb-root/etc/systemd/system/
	cp ytl-linux-digabi2-examnet-discovery.service deb-root/etc/systemd/system/
	cp ytl-linux-digabi2-examnet-discovery.timer deb-root/etc/systemd/system/
	cp ytl-linux-digabi2-wait-for-listen-ip.service deb-root/etc/systemd/system/

	chmod 644 deb-root/etc/systemd/system/*

	# docker.service drop-in to order docker after the listen-ip wait
	mkdir -p deb-root/etc/systemd/system/docker.service.d/
	cp docker.service.d/wait-for-listen-ip.conf deb-root/etc/systemd/system/docker.service.d/
	chmod 644 deb-root/etc/systemd/system/docker.service.d/*.conf

	# Polkit policy
	mkdir -p deb-root/usr/share/polkit-1/actions/
	cp ytl-linux-digabi2-examnet.policy deb-root/usr/share/polkit-1/actions/

	ytl-fpm \
		--after-install after-install.sh \
		--before-remove before-remove.sh \
		$(DEPENDENCIES)
