VERSION := 0.0.1

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f ytl-linux-digabi2-examnet-bouncer_$(VERSION)_all.deb ]; then rm ytl-linux-digabi2-examnet-bouncer_$(VERSION)_all.deb; fi

	hatch run packaging:pyinstaller --onefile digabi2-examnet-bouncer

	mkdir -p deb-root/usr/local/bin
	cp dist/digabi2-examnet-bouncer deb-root/usr/local/bin/

	fpm -C deb-root/ -s dir --name ytl-linux-digabi2-examnet-bouncer --architecture native -t deb --version "$(VERSION)" \
		 --description "Network services from the digabi2 exam system" \
		 --maintainer "abitti@ylioppilastutkinto.fi" \
		 --vendor "Matriculation Examination Board" \
		 --url "https://github.com/digabi/ytl-linux" \
		 --deb-no-default-config-files \
		 .
