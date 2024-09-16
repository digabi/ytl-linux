NAME := "ytl-linux-cpu-governor"
VERSION := "0.0"

DEPENDENCIES := --depends cpufrequtils

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	# The carrot
	mkdir -p deb-root/etc/default
	cp cpufrequtils deb-root/etc/default/
	chmod 644 deb-root/etc/default/cpufrequtils

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)/

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		 --description "Turn TSO off for all ethernet devices" \
		 --maintainer "abitti@ylioppilastutkinto.fi" \
		 --vendor "Matriculation Examination Board" \
		 --url "https://github.com/digabi/ytl-linux" \
		 --deb-no-default-config-files \
		 $(DEPENDENCIES) \
		.
