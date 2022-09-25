#!/bin/bash

wd=$(pwd)
tmpdir=$(mktemp -d)
echo "tmpdir: $tmpdir"
cp -r index.js manifest.json _locales "$tmpdir/"
cd "$tmpdir" || exit 1

# Chrome
jq '.manifest_version = 3' manifest.json >manifest.json.tmp && mv manifest.json.tmp manifest.json
# chrome store wants zips...
crx pack --zip-output chrome.zip -p ~/.ssh/id_rsa
mv chrome.zip "$wd"/chrome.zip
crx pack -o chrome.crx -p ~/.ssh/id_rsa
mv chrome.crx "$wd"/chrome.crx
# Firefox doesn't currently support manifest v3
jq '.manifest_version = 2' manifest.json >manifest.json.tmp && mv manifest.json.tmp manifest.json
crx pack -o firefox.crx -p ~/.ssh/id_rsa
mv firefox.crx "$wd"/firefox.crx

rm -rf "$tmpdir"
