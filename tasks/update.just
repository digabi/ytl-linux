# Update Naksu 2 to latest version and push changes to GitHub
[working-directory('../debs')]
naksu2:
    #!/usr/bin/env bash
    set -euo pipefail

    rm -f naksu2*.deb
    gh release download --repo digabi/naksu2 --pattern '*.deb'

    NEW_NAKSU_VERSION=$(find . -name 'naksu2_*.deb' | cut -d '_' -f 2)

    echo -n "New Naksu version is $NEW_NAKSU_VERSION. Do you want to commit and push the changes? (y/N) "
    read -r ANSWER

    if [[ $ANSWER != "y" ]]; then
        echo "Release aborted. Please revert incorrect changes."
        exit 1
    fi

    git add debs/naksu2*.deb
    git commit -m "Update Naksu 2 to $NEW_NAKSU_VERSION"
    git push

# Update AnyDesk to latest version and push changes to GitHub
[working-directory('../debs')]
anydesk:
    #!/usr/bin/env bash
    set -euo pipefail

    rm -f anydesk-meb*.deb
    gh release download --repo digabi/anydesk-meb --pattern '*.deb'

    NEW_ANYDESK_VERSION=$(find . -name 'anydesk-meb_*.deb' | cut -d '_' -f 2)

    echo -n "New AnyDesk version is $NEW_ANYDESK_VERSION. Do you want to commit and push the changes? (y/N) "
    read -r ANSWER

    if [[ $ANSWER != "y" ]]; then
        echo "Release aborted. Please revert incorrect changes."
        exit 1
    fi

    git add debs/anydesk-meb*.deb
    git commit -m "Update AnyDesk to $LATEST_ANYDESK_VERSION"
    git push

# Update vendored just for ytl-linux-tasks to latest version
[working-directory('../packages/ytl-linux-tasks')]
@vendored-just:
    rm -rf vendor/*
    cd vendor
    gh release download --repo casey/just --pattern "just-*-x86_64-unknown-linux-musl.tar.gz"
