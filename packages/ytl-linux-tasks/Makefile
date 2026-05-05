NAME := ytl-linux-tasks
VERSION := 0.3.1

deb:
	if [ -d deb-root ]; then rm -fR deb-root/; fi
	if [ -d deb-scripts ]; then rm -fR deb-scripts/; fi
	if [ -f $(NAME)_$(VERSION)_all.deb ]; then rm $(NAME)_$(VERSION)_all.deb; fi

	mkdir -p deb-root

	# Install a more up-to-date version of just than is available in the Ubuntu repos

	# Unzip stored tarball
	cd vendor; \
	ARCHIVE=$$(find . -name "*.tar.gz" | head -n 1); \
	mkdir -p just-x86_64-unknown-linux-musl; \
	tar -xzf "$${ARCHIVE}" -C "just-x86_64-unknown-linux-musl"

	# Copy just binary
	mkdir -p deb-root/usr/local/bin
	cp vendor/just-x86_64-unknown-linux-musl/just deb-root/usr/local/bin

	# Cleanup
	rm -rf vendor/just-x86_64-unknown-linux-musl

	install -D -m 644 justfile deb-root/usr/local/share/ytl-linux-tasks/justfile
	install -D -m 755 ytl-tasks deb-root/usr/local/bin/ytl-tasks
	install -D -m 644 ytl-tasks-maintenance.service deb-root/etc/systemd/system/ytl-tasks-maintenance.service
	cp -r scripts deb-root/usr/local/share/ytl-linux-tasks/scripts

	fpm -C deb-root/ -s dir --name $(NAME) --architecture all -t deb --version "$(VERSION)" \
		--description "Command runner specialized for YTL Linux administration tasks" \
		--maintainer "abitti@ylioppilastutkinto.fi" \
		--vendor "Matriculation Examination Board" \
		--url "https://github.com/digabi/ytl-linux" \
		--deb-no-default-config-files \
		--after-install after-install.sh \
		.
