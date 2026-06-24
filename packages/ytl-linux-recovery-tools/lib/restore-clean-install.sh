#!/usr/bin/env bash

set -euo pipefail

ROOT_LABEL="${ROOT_LABEL:-YTL_ROOT}"
SNAPSHOT_LABEL="${SNAPSHOT_LABEL:-YTL_CLEAN_INSTALL}"
EFI_LABEL="${EFI_LABEL:-YTL_EFI}"
ARCHIVE_NAME="${ARCHIVE_NAME:-rootfs-postinstall.fsa}"
TARGET_MNT=/mnt/ytl-restore-target
SNAPSHOT_MNT=/mnt/ytl-restore-snapshot
EFI_MNT=$TARGET_MNT/boot/efi

log() {
  echo "ytl-linux-recovery-tools: $*"
}

cleanup() {
  set +e
  if mountpoint -q "$TARGET_MNT/sys"; then umount "$TARGET_MNT/sys"; fi
  if mountpoint -q "$TARGET_MNT/proc"; then umount "$TARGET_MNT/proc"; fi
  if mountpoint -q "$TARGET_MNT/dev"; then umount "$TARGET_MNT/dev"; fi
  if mountpoint -q "$EFI_MNT"; then umount "$EFI_MNT"; fi
  if mountpoint -q "$TARGET_MNT"; then umount "$TARGET_MNT"; fi
  if mountpoint -q "$SNAPSHOT_MNT"; then umount "$SNAPSHOT_MNT"; fi
}
trap cleanup EXIT

ROOT_DEV=$(readlink -f "/dev/disk/by-label/$ROOT_LABEL")
SNAPSHOT_DEV=$(readlink -f "/dev/disk/by-label/$SNAPSHOT_LABEL")
EFI_DEV=$(readlink -f "/dev/disk/by-label/$EFI_LABEL")

mkdir -p "$TARGET_MNT" "$SNAPSHOT_MNT"
mount "$SNAPSHOT_DEV" "$SNAPSHOT_MNT"

if [[ ! -f "$SNAPSHOT_MNT/$ARCHIVE_NAME" ]]; then
  echo "Snapshot archive $ARCHIVE_NAME not found on $SNAPSHOT_DEV" >&2
  exit 1
fi
if [[ -f "$SNAPSHOT_MNT/$ARCHIVE_NAME.sha256" ]]; then
  (cd "$SNAPSHOT_MNT" && sha256sum -c "$ARCHIVE_NAME.sha256")
fi

log "Restoring $ROOT_DEV from $SNAPSHOT_MNT/$ARCHIVE_NAME"
mkfs.ext4 -F -L "$ROOT_LABEL" "$ROOT_DEV"
fsarchiver restfs "$SNAPSHOT_MNT/$ARCHIVE_NAME" id=0,dest="$ROOT_DEV"

mount "$ROOT_DEV" "$TARGET_MNT"
mkdir -p "$EFI_MNT"
mount "$EFI_DEV" "$EFI_MNT"
mkdir -p "$TARGET_MNT/dev" "$TARGET_MNT/proc" "$TARGET_MNT/sys"

if [[ -f "$TARGET_MNT/etc/fstab" ]]; then
  sed -i \
    -e "s|^[^#].* / .*|LABEL=$ROOT_LABEL / ext4 defaults 0 1|" \
    -e "s|^[^#].* /boot/efi .*|LABEL=$EFI_LABEL /boot/efi vfat umask=0077 0 1|" \
    "$TARGET_MNT/etc/fstab"
fi

mount --bind /dev "$TARGET_MNT/dev"
mount --bind /proc "$TARGET_MNT/proc"
mount --bind /sys "$TARGET_MNT/sys"

chroot "$TARGET_MNT" update-initramfs -u
chroot "$TARGET_MNT" update-grub
log "Restore completed successfully. Reboot when ready."


