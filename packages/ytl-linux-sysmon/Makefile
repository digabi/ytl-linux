export NAME := ytl-linux-sysmon
export DESCRIPTION := "YTL Linux system monitoring tools"
export VERSION := 0.1.0

# This package also depends on the bandwhich snap, but we have to install that in the postinstall step
DEPENDENCIES := --depends netdata

deb:
	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)/

	mkdir -p deb-root/usr/share/applications/
	cp -r desktop/* deb-root/usr/share/applications/

	mkdir -p deb-root/usr/share/icons/
	cp -r icons/* deb-root/usr/share/icons/

	ytl-fpm \
		--after-install after-install.sh \
		--after-remove after-remove.sh \
		$(DEPENDENCIES)
