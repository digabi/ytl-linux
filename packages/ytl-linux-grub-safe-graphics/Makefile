export NAME := ytl-linux-grub-safe-graphics
export DESCRIPTION := "Scripts to add/remove 'nomodesetä kernel parameter at /etc/default/grub"
export VERSION := 0.1

DEPENDENCIES := --depends policykit-1

deb:
	mkdir -p deb-root/usr/local/sbin/
	cp ytl-grub-safe-graphics deb-root/usr/local/sbin/
	chmod 755 deb-root/usr/local/sbin/ytl-grub-safe-graphics

	mkdir -p deb-root/usr/share/applications/
	cp ytl-grub-safe-graphics-on.desktop deb-root/usr/share/applications/
	cp ytl-grub-safe-graphics-off.desktop deb-root/usr/share/applications/

	mkdir -p deb-root/usr/share/polkit-1/actions
	cp ytl-grub-safe-graphics.policy deb-root/usr/share/polkit-1/actions/

	mkdir -p deb-root/usr/local/share/pixmaps/
	cp ytl-grub-safe-graphics.png deb-root/usr/local/share/pixmaps/

	ytl-fpm \
	  $(DEPENDENCIES)
