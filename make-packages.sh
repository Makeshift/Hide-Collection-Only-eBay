#!/bin/bash

wd=$(pwd)
tmpdir=$(mktemp -d)
cp index.js manifest.json "$tmpdir/"
cd "$tmpdir" || exit 1

# Chrome
jq '.manifest_version = 3' manifest.json >manifest.json.tmp && mv manifest.json.tmp manifest.json
crx pack -o chrome.crx -p ~/.ssh/id_rsa
# Firefox doesn't currently support manifest v3
jq '.manifest_version = 2' manifest.json >manifest.json.tmp && mv manifest.json.tmp manifest.json
crx pack -o firefox.crx -p ~/.ssh/id_rsa

mv ./*.crx "$wd"

rm -rf "$tmpdir"
