# Remove Naksu 1 settings
if [ -f /home/school/naksu.ini ]; then
    rm -f /home/school/naksu.ini
fi

# Remove Naksu 1 system files
if [ -d /home/school/ktp/ ]; then
    rm -fR /home/school/ktp/
fi
