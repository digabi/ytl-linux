UBUNTU_DOWNLOAD_URL := 'https://releases.ubuntu.com/noble/ubuntu-24.04.3-live-server-amd64.iso'
BASE_IMAGE_FILE := 'ubuntu.iso'
INSTALL_IMAGE_FILE := 'ytl-install-24.iso'

VM_NAME := env('VM_NAME', 'YTL Linux')
VM_DISK_SIZE := env('VM_DISK_SIZE', '51200')
VM_DISK_PATH := env('VM_DISK_PATH', `echo "$HOME/VirtualBox VMs/{{ VM_NAME }}"`)
VM_MEMORY_SIZE := env('VM_MEMORY_SIZE', '4096')
VM_CPUS := env('VM_CPUS', '2')
VM_VIDEO_MEMORY_SIZE := env('VM_VIDEO_MEMORY_SIZE', '16')
VM_GRAPHICS_CONTROLLER := env('VM_GRAPHICS_CONTROLLER', 'vboxvga')

export AUTOINSTALL_URL := env('AUTOINSTALL_URL', 'https://digabi.github.io/ytl-linux/autoinstall-config-24/')

mod update 'tasks/update.just'

# Lists all tasks in the order they appear in the justfile
[private]
default:
    @just --list --unsorted

# Format justfile
[private]
format:
    @just --unstable --fmt
    @for file in tasks/*.just; do just --unstable --fmt --justfile "$file"; done

download-ubuntu-base-image:
  if [[ ! -e '{{ BASE_IMAGE_FILE }}' ]]; then wget -O '{{ BASE_IMAGE_FILE }}' {{ UBUNTU_DOWNLOAD_URL }}; fi

build-ytl-install-image: download-ubuntu-base-image
  mkdir -p bin
  docker rm --force --volumes ytl-linux-builder
  docker build -t ytl-linux-build-img:latest -f builder/Dockerfile .
  docker run --workdir /app --name ytl-linux-builder --env AUTOINSTALL_URL --volume './{{ BASE_IMAGE_FILE }}:/app/{{ BASE_IMAGE_FILE }}' ytl-linux-build-img:latest ./build-ytl-image
  docker cp 'ytl-linux-builder:/app/{{ INSTALL_IMAGE_FILE }}' .

create-vb-vm:
  VBoxManage controlvm '{{ VM_NAME }}' poweroff
  VBoxManage unregistervm '{{ VM_NAME }}' --delete
  VBoxManage createvm --name '{{ VM_NAME }}' --register --ostype Linux_64
  VBoxManage modifyvm '{{ VM_NAME }}' --memory '{{ VM_MEMORY_SIZE }}' --nic1 nat --usb off --firmware efi --cpus '{{ VM_CPUS }}' --vram '{{ VM_VIDEO_MEMORY_SIZE }}' --graphicscontroller '{{ VM_GRAPHICS_CONTROLLER }}'

  VBoxManage storagectl '{{ VM_NAME }}' --name SATA --add sata --controller IntelAHCI --portcount 2
  VBoxManage createhd --filename '{{ VM_DISK_PATH }}/{{ VM_NAME }}.vdi' --size '{{ VM_DISK_SIZE }}'
  VBoxManage storageattach '{{ VM_NAME }}' --storagectl 'SATA' --device 0 --port 0 --type hdd --medium '{{ VM_DISK_PATH }}/{{ VM_NAME }}.vdi'
  VBoxManage storageattach '{{ VM_NAME }}' --storagectl 'SATA' --device 0 --port 1 --type dvddrive --medium '{{ INSTALL_IMAGE_FILE }}'
  VBoxManage sharedfolder add '{{ VM_NAME }}' --name ytl-linux --hostpath $PWD --automount --auto-mount-point /home/school/ytl-linux

serve:
  docker rm --force --volumes ytl-linux-autoinstall-config
  docker run --name ytl-linux-autoinstall-config -p 8080:80 -v ./docs:/usr/share/nginx/html:ro nginx:alpine
  docker inspect ytl-linux-autoinstall-config
