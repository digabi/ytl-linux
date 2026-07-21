NAME := ytl-linux-cpu-governor
VERSION := 0.1

DEPENDENCIES := --depends cpufrequtils

deb:
	# The carrot
	mkdir -p deb-root/etc/default
	cp cpufrequtils deb-root/etc/default/
	chmod 644 deb-root/etc/default/cpufrequtils

	# Package documentation
	mkdir -p deb-root/usr/local/share/doc/$(NAME)
	cp *.md deb-root/usr/local/share/doc/$(NAME)/

	${FPM} \
		--name $(NAME) \
		--version "$(VERSION)" \
		--description "Sets CPU governor 'performance' to all CPUs/cores" \
		--deb-no-default-config-files \
		$(DEPENDENCIES) \
		.
