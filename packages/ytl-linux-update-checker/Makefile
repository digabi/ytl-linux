export NAME := ytl-linux-update-checker
export DESCRIPTION := "YTL Linux automatic update checker and notifier tool"
export VERSION := 0.4.3

DEPENDENCIES := --depends python3-systemd --depends python3-gi --depends python3-gi-cairo --depends gir1.2-gtk-3.0

deb:
	mkdir -p deb-root/usr/local/sbin
	cp ytl-linux-update-checker deb-root/usr/local/sbin
	cp ytl-linux-software-update deb-root/usr/local/sbin
	chmod 755 deb-root/usr/local/sbin/*

	mkdir -p deb-root/usr/local/bin
	cp ytl-linux-update-dialog deb-root/usr/local/bin
	chmod 755 deb-root/usr/local/bin/*

	mkdir -p deb-root/etc/systemd/system
	cp ytl-linux-update-check.service deb-root/etc/systemd/system
	cp ytl-linux-update-check.timer deb-root/etc/systemd/system
	chmod 644 deb-root/etc/systemd/system/*

	mkdir -p deb-root/usr/share/polkit-1/actions/
	cp ytl-linux-software-update.policy deb-root/usr/share/polkit-1/actions/

	ytl-fpm \
		--after-install after-install.sh \
		--before-remove before-remove.sh \
		--after-remove after-remove.sh \
		$(DEPENDENCIES)
