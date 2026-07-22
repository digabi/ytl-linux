#!/usr/bin/env bash

set -euo pipefail

TARGET=""
RELEASE="noble"
MIRROR="http://archive.ubuntu.com/ubuntu/"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    --release)
      RELEASE="$2"
      shift 2
      ;;
    --mirror)
      MIRROR="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 --target <target-root> [--release noble] [--mirror url]" >&2
  exit 1
fi

TARGET=$(readlink -f "$TARGET")
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
RECOVERY_LABEL="YTL_RECOVERY"
SNAPSHOT_LABEL="YTL_CLEAN_INSTALL"
ROOT_LABEL="YTL_ROOT"
EFI_LABEL="YTL_EFI"
RECOVERY_MNT=/mnt/ytl-recovery
SNAPSHOT_MNT=/mnt/ytl-clean-install
ROOT_SNAPSHOT_NAME=rootfs-postinstall.fsa
ROOT_SNAPSHOT_PATH="$SNAPSHOT_MNT/$ROOT_SNAPSHOT_NAME"
RECOVERY_PACKAGES=(
  linux-image-generic
  systemd-sysv
  grub-efi-amd64-bin
  efibootmgr
  fsarchiver
  e2fsprogs
  dosfstools
  util-linux
  bash
  coreutils
)

log() {
  echo "ytl-linux-recovery-tools: $*"
}

cleanup() {
  set +e
  if mountpoint -q "$RECOVERY_MNT/dev/pts"; then umount "$RECOVERY_MNT/dev/pts"; fi
  if mountpoint -q "$RECOVERY_MNT/dev"; then umount "$RECOVERY_MNT/dev"; fi
  if mountpoint -q "$RECOVERY_MNT/proc"; then umount "$RECOVERY_MNT/proc"; fi
  if mountpoint -q "$RECOVERY_MNT/sys"; then umount "$RECOVERY_MNT/sys"; fi
  if mountpoint -q "$RECOVERY_MNT"; then umount "$RECOVERY_MNT"; fi
  if mountpoint -q "$SNAPSHOT_MNT"; then umount "$SNAPSHOT_MNT"; fi
}
trap cleanup EXIT

mkdir -p "$RECOVERY_MNT" "$SNAPSHOT_MNT"

RECOVERY_DEV=$(readlink -f "/dev/disk/by-label/$RECOVERY_LABEL")
SNAPSHOT_DEV=$(readlink -f "/dev/disk/by-label/$SNAPSHOT_LABEL")
ROOT_DEV=$(findmnt -n -o SOURCE "$TARGET")
EFI_DEV=$(findmnt -n -o SOURCE "$TARGET/boot/efi")

log "Recovery partition: $RECOVERY_DEV"
log "Snapshot partition: $SNAPSHOT_DEV"
log "Root filesystem: $ROOT_DEV"
log "EFI filesystem: $EFI_DEV"

mount "$RECOVERY_DEV" "$RECOVERY_MNT"
mount "$SNAPSHOT_DEV" "$SNAPSHOT_MNT"

log "Bootstrapping recovery system into $RECOVERY_MNT"
debootstrap --arch amd64 --variant=minbase "$RELEASE" "$RECOVERY_MNT" "$MIRROR"

mkdir -p "$RECOVERY_MNT/etc/apt"

cat > "$RECOVERY_MNT/etc/apt/sources.list" <<EOF
 deb $MIRROR $RELEASE main restricted universe multiverse
 deb $MIRROR ${RELEASE}-updates main restricted universe multiverse
 deb $MIRROR ${RELEASE}-security main restricted universe multiverse
EOF

mount --bind /dev "$RECOVERY_MNT/dev"
mount --bind /dev/pts "$RECOVERY_MNT/dev/pts"
mount --bind /proc "$RECOVERY_MNT/proc"
mount --bind /sys "$RECOVERY_MNT/sys"

chroot "$RECOVERY_MNT" apt-get update
chroot "$RECOVERY_MNT" env DEBIAN_FRONTEND=noninteractive apt-get install -y "${RECOVERY_PACKAGES[@]}"

cat > "$RECOVERY_MNT/etc/fstab" <<EOF
LABEL=$RECOVERY_LABEL / ext4 defaults 0 1
LABEL=$SNAPSHOT_LABEL /mnt/clean-install ext4 defaults 0 2
LABEL=$EFI_LABEL /boot/efi vfat umask=0077 0 1
EOF

mkdir -p "$RECOVERY_MNT/mnt/clean-install"
mkdir -p "$RECOVERY_MNT/boot/efi"
mkdir -p "$RECOVERY_MNT/usr/local/sbin"
echo ytl-recovery > "$RECOVERY_MNT/etc/hostname"
cp "$SCRIPT_DIR/restore-clean-install.sh" "$RECOVERY_MNT/usr/local/sbin/ytl-restore-clean-install"
chmod 755 "$RECOVERY_MNT/usr/local/sbin/ytl-restore-clean-install"

cat > "$RECOVERY_MNT/root/README-restore.txt" <<EOF
Run /usr/local/sbin/ytl-restore-clean-install to restore LABEL=$ROOT_LABEL from the post-install snapshot stored on LABEL=$SNAPSHOT_LABEL.
EOF

mkdir -p "$TARGET/etc/grub.d"
cat > "$TARGET/etc/grub.d/41_ytl_recovery" <<'EOF'
#!/bin/sh
exec tail -n +3 "$0"
EOF
cat "$SCRIPT_DIR/grub-recovery-menuentry.cfg" >> "$TARGET/etc/grub.d/41_ytl_recovery"
chmod 755 "$TARGET/etc/grub.d/41_ytl_recovery"

log "Creating fsarchiver snapshot at $ROOT_SNAPSHOT_PATH"
sync
fsfreeze --freeze "$TARGET"
archive_status=0
if ! fsarchiver savefs "$ROOT_SNAPSHOT_PATH" "$ROOT_DEV"; then
  archive_status=$?
fi
fsfreeze --unfreeze "$TARGET" || true
if [[ $archive_status -ne 0 ]]; then
  echo "fsarchiver savefs failed with exit code $archive_status" >&2
  exit "$archive_status"
fi
sha256sum "$ROOT_SNAPSHOT_PATH" > "$ROOT_SNAPSHOT_PATH.sha256"
cat > "$SNAPSHOT_MNT/rootfs-postinstall.meta" <<EOF
ROOT_LABEL=$ROOT_LABEL
RECOVERY_LABEL=$RECOVERY_LABEL
SNAPSHOT_LABEL=$SNAPSHOT_LABEL
EFI_LABEL=$EFI_LABEL
ROOT_DEVICE=$ROOT_DEV
EFI_DEVICE=$EFI_DEV
CREATED_AT=$(date --iso-8601=seconds)
ARCHIVE=$ROOT_SNAPSHOT_NAME
EOF

log "Recovery environment prepared and snapshot created successfully"


