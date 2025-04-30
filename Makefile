INSTALL_IMAGE = ytl-install-24.iso
VM_NAME = YTL Linux
VM_DISK_SIZE = 51200
VM_MEMORY_SIZE = 4096
IMAGE = ubuntu.iso

docker:
	./download-ubuntu-base-image $(IMAGE)
	mkdir -p bin
	docker rm --force --volumes ytl-linux-builder
	docker build -t ytl-linux-build-img:latest -f Dockerfile.build .
	docker run -w /app --name ytl-linux-builder --env AUTOINSTALL_URL --volume ./$(IMAGE):/app/$(IMAGE) ytl-linux-build-img:latest ./build-ytl-image
	docker cp ytl-linux-builder:/app/$(INSTALL_IMAGE) .

create-vb-vm:
	-VBoxManage controlvm "$(VM_NAME)" poweroff
	-VBoxManage unregistervm "$(VM_NAME)" --delete
	VBoxManage createvm --name "$(VM_NAME)" --register --ostype Linux_64
	VBoxManage modifyvm "$(VM_NAME)" --memory $(VM_MEMORY_SIZE) --nic1 nat --usb off --firmware efi --cpus 2 --vram 16

	VBoxManage storagectl "$(VM_NAME)" --name SATA --add sata --controller IntelAHCI --portcount 2
	VBoxManage createhd --filename "$(VM_NAME).vdi" --size $(VM_DISK_SIZE)
	VBoxManage storageattach "$(VM_NAME)" --storagectl "SATA" --device 0 --port 0 --type hdd --medium "$(VM_NAME).vdi"
	VBoxManage storageattach "$(VM_NAME)" --storagectl "SATA" --device 0 --port 1 --type dvddrive --medium $(INSTALL_IMAGE)

create-kvm-vm:
	qemu-img create -f qcow2 "$(VM_NAME).img" $(VM_DISK_SIZE)M
	kvm -hda "$(VM_NAME).img" -cdrom "$(INSTALL_IMAGE)" -m $(VM_MEMORY_SIZE)

start-httpd:
	python3 -m http.server -d docs/ 8080
