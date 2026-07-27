export NAME := ytl-linux-system-reset
export DESCRIPTION := "Provides a quick GUI-driven way to reset the system to a clean state"
export VERSION := 0.1.0

DEPENDENCIES := --depends zenity

deb:
	mkdir -p deb-root/usr/local/sbin/
	install -D -m 755 ytl-linux-system-reset deb-root/usr/local/sbin/

	mkdir -p deb-root/usr/share/polkit-1/actions/
	cp ytl-linux-system-reset.policy deb-root/usr/share/polkit-1/actions/

	mkdir -p deb-root/usr/share/applications/
	cp ytl-linux-system-reset.desktop deb-root/usr/share/applications/

	ytl-fpm \
		$(DEPENDENCIES)
