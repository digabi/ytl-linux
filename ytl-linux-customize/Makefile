VERSION := "1.0.0"

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -f ytl-linux-customize_$(VERSION)_amd64.deb ]; then rm ytl-linux-customize_$(VERSION)_amd64.deb; fi

	# Naksu depends: wget, zenity
	mkdir -p deb-root/usr/local/bin/
	cp naksu/naksu deb-root/usr/local/bin/
	chmod 755 deb-root/usr/local/bin/naksu

	mkdir -p deb-root/usr/share/applications/
	cp naksu/naksu.desktop deb-root/usr/share/applications/

	mkdir -p deb-root/usr/local/lib/naksu/
	cp naksu/naksu.png deb-root/usr/local/lib/naksu/

	fpm -C deb-root/ -s dir --name ytl-linux-customize --architecture native -t deb --version "$(VERSION)" --depends wget --depends zenity .
