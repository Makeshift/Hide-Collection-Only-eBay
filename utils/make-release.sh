#!/bin/bash

set -e

bump-my-version bump "${1:-patch}"
new_version=$(bump-my-version show current_version)

wd=$(pwd)
tmpdir=$(mktemp -d)
echo "tmpdir: $tmpdir"
cp -r index.js manifest.json _locales "$tmpdir/"
cd "$tmpdir" || exit 1

# crx pack -o chrome.crx -p ~/.ssh/deprecated_keys/id_rsa
# mv chrome.crx "$wd"/chrome.crx

# chrome store wants zips...
crx pack --zip-output chrome.zip -p ~/.ssh/deprecated_keys/id_rsa
mv chrome.zip "$wd"/chrome-"${new_version}".zip

crx pack -o firefox.crx -p ~/.ssh/deprecated_keys/id_rsa
mv firefox.crx "$wd"/firefox-"${new_version}".crx

rm -rf "$tmpdir"
