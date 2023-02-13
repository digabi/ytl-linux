VB_VMNAME = "YTL Linux"
IMAGE = "ytl-install-22.iso"

docker:
	mkdir -p bin
	-docker rm ytl-linux-builder
	docker build -t ytl-linux-build-img:latest -f Dockerfile.build .
	docker run -w /app --name ytl-linux-builder ytl-linux-build-img:latest ./build-ytl-image
	docker cp ytl-linux-builder:/app/$(IMAGE) .

create-vb-vm:
	-VBoxManage controlvm $(VB_VMNAME) poweroff
	-VBoxManage unregistervm $(VB_VMNAME) --delete
	VBoxManage createvm --name $(VB_VMNAME) --register --ostype Linux_64
	VBoxManage modifyvm $(VB_VMNAME) --memory 2048 --nic1 nat --usb off --firmware efi --cpus 2 --vram 16

	VBoxManage storagectl $(VB_VMNAME) --name SATA --add sata --controller IntelAHCI --portcount 2
	VBoxManage createhd --filename "YTL_Linux.vdi" --size 8192
	VBoxManage storageattach $(VB_VMNAME) --storagectl "SATA" --device 0 --port 0 --type hdd --medium "YTL_Linux.vdi"
	VBoxManage storageattach $(VB_VMNAME) --storagectl "SATA" --device 0 --port 1 --type dvddrive --medium $(IMAGE)

create-kvm-vm:
	qemu-img create -f qcow2 YTL_Linux.img 8G
	kvm -hda YTL_Linux.img -cdrom $(IMAGE) -m 2048