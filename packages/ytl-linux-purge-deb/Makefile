export NAME := ytl-linux-purge-deb
export DESCRIPTION := "Metapackage to remove obsolete deb packages installed by Ubuntu Autoinstall"
export VERSION := 0.0.6

CONFLICTS := \
	--conflicts open-iscsi \
	--conflicts networkd-dispatcher \
	--conflicts cups \
	--conflicts cups-browsed \
	--conflicts cups-bsd \
	--conflicts cups-core-drivers \
	--conflicts cups-daemon \
	--conflicts cups-filters \
	--conflicts cups-filters-core-drivers \
	--conflicts cups-ipp-utils \
	--conflicts cups-pdf \
	--conflicts cups-ppdc \
	--conflicts cups-server-common \
	--conflicts update-manager \
	--conflicts update-notifier \
	--conflicts ubuntu-release-upgrader-gtk

deb:
	ytl-fpm \
		--after-install after-install.sh \
		$(CONFLICTS)
