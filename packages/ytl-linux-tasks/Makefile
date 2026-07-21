export NAME := ytl-linux-tasks
export DESCRIPTION := "Command runner specialized for YTL Linux administration tasks"
export VERSION := 0.4.0

deb:
	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)/

	# Install a more up-to-date version of just than is available in the Ubuntu repos

	# Unzip stored tarball
	cd vendor; \
	ARCHIVE=$$(find . -name "*.tar.gz" | head -n 1); \
	mkdir -p just-x86_64-unknown-linux-musl; \
	tar -xzf "$${ARCHIVE}" -C "just-x86_64-unknown-linux-musl"

	# Copy just binary
	mkdir -p deb-root/usr/local/bin
	cp vendor/just-x86_64-unknown-linux-musl/just deb-root/usr/local/bin

	install -D -m 644 justfile deb-root/usr/local/share/ytl-linux-tasks/justfile
	install -D -m 755 ytl-tasks deb-root/usr/local/bin/ytl-tasks
	install -D -m 644 ytl-tasks-maintenance.service deb-root/etc/systemd/system/ytl-tasks-maintenance.service
	cp -r scripts deb-root/usr/local/share/ytl-linux-tasks/scripts

	ytl-fpm \
		--after-install after-install.sh
