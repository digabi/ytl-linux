VERSION := "1.0.0"

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -f ytl-linux-customize_$(VERSION)_amd64.deb ]; then rm ytl-linux-customize_$(VERSION)_amd64.deb; fi

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/ytl-linux-customize

	# Naksu depends: wget, zenity
	mkdir -p deb-root/usr/local/bin/
	cp naksu/naksu deb-root/usr/local/bin/
	chmod 755 deb-root/usr/local/bin/naksu

	mkdir -p deb-root/usr/share/applications/
	cp naksu/naksu.desktop deb-root/usr/share/applications/

	mkdir -p deb-root/usr/local/lib/naksu/
	cp naksu/naksu.png deb-root/usr/local/lib/naksu/

	# ytl-grub-safe-graphics depends: policykit-1
	mkdir -p deb-root/usr/local/sbin/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics-on deb-root/usr/local/sbin/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics-off deb-root/usr/local/sbin/
	chmod 755 deb-root/usr/local/sbin/ytl-grub-safe-graphics-*

	mkdir -p deb-root/usr/share/applications/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics-on.desktop deb-root/usr/share/applications/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics-off.desktop deb-root/usr/share/applications/

	mkdir -p deb-root/usr/share/polkit-1/actions
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics.policy deb-root/usr/share/polkit-1/actions/

	mkdir -p deb-root/usr/local/share/pixmaps/
	cp ytl-grub-safe-graphics/ytl-grub-safe-graphics.png deb-root/usr/local/share/pixmaps/

	cp ytl-grub-safe-graphics/*.md deb-root/usr/local/share/doc/ytl-linux-customize/

	fpm -C deb-root/ -s dir --name ytl-linux-customize --architecture native -t deb --version "$(VERSION)" \
		--depends wget --depends zenity \
		--depends policykit-1 \
		.
