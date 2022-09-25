#!/bin/bash

description_en=$(cat store_listing_description_en.txt)

# supported languages on the webstore
languages=("en" "am" "ar" "bn" "bg" "ca" "hr" "cs" "da" "nl" "et" f"il" "fi" "fr" "de" "el" "gu" "iw" "hi" "hu" "id" "it" "ja" "kn" "ko" "lv" "lt" "ms" "ml" "mr" "no" "fa" "pl" "ro" "ru" "sk" "sl" "es" "sw" "sv" "ta" "te" "th" "tr" "uk" "vi")

for language in "${languages[@]}"; do
  echo "language: $language"
  trans -b :"$language" "$description_en" | tee -a store_listing_description_translations.txt
  printf "\n\n" | tee -a store_listing_description_translations.txt
done
