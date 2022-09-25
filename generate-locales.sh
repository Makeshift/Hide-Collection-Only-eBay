#!/bin/bash

# uses the 'translate-shell' package to generate the _locales. Probably not very accurate, but we don't need to translate many strings.
translate_from="_locales/en/messages.json"

# get key-value pairs from the english locale file with a null delimiter for bash
IFS= readarray -d $'\n' -t pairs < <(jq -r 'to_entries[] | "\(.key).message \u0001 \(.value.message)"' "$translate_from")

_jq_merge_objects() {
  # Given two json objects, returns the merged object
  local obj1="$1"
  local obj2="$2"
  echo "$obj1" "$obj2" | jq -rc --slurp 'reduce .[] as $item ({}; . * $item)'
}

_jq_set_key_by_arr() {
  # Given a json string, a key in json array notation, and a value, returns the json string with the key set to the value
  # setpath doesn't work here because it won't overwrite values that aren't objects. eg. if you have {"a": "b"} and you try to set ["a", "b"] to "c", it won't work
  # so we create a new object with the new value and then merge it with the original object
  local key_arr="$1"
  local value="$2"
  local json="$3"
  local new_json

  new_json=$(echo "{}" | jq -c --argjson key_arr "$key_arr" --arg value "$value" 'setpath($key_arr; $value)')
  _jq_merge_objects "$json" "$new_json"
}

_jq_convert_dot_notation_to_json_array() {
  # Given a key in dot notation, returns the key in json array notation
  local input="$1"
  echo "$input" | jq -Rrc 'split(".") | [.[] | gsub("[\\n]"; "") | sub("_DOT_";".")] | map(select(length > 0))'
}

_jq_set_key_by_dot_notation() {
  # Given a json string, a key in dot notation, and a value, returns the json string with the key set to the value
  local key="$1"
  local value="$2"
  local json="$3"
  local arr
  arr=$(_jq_convert_dot_notation_to_json_array "$key")
  _jq_set_key_by_arr "$arr" "$value" "$json"
}

if [ -n "$1" ]; then
  # if passed a list of languages, only generate those ones
  languages="$*"
else
  # get a list of languages supported by translate-shell
  languages=$(sed -n '/function initLocale/,/\}/p' "$(which trans)" | grep -oP '(?<=Locale\[")(.+?)(?="\])' | sort | uniq | grep -vP '^en$')
fi
# for each language
for language in $languages; do
  # maximum of 5 simultaneous translations
  # ((i = i % 5))
  # ((i++ == 0)) && wait
  # (
  mkdir -p "_locales/$language"
  filename="_locales/$language/messages.json"
  json="{}"
  # for each pair, translate the values and write it to the locale file
  for pair in "${pairs[@]}"; do
    # max number of 5 requests running at a time
    key=$(echo "$pair" | grep -oP '(.*)(?='$'\u0001'')')
    value=$(echo "$pair" | grep -oP '(?<='$'\u0001'')(.*)')
    echo "Translating '$value' to '$language'"
    translated_value=$(trans -b :"$language" "$value")
    json=$(_jq_set_key_by_dot_notation "$key" "$translated_value" "$json")
  done
  echo "$json" >"$filename"
  #) &
done

# loop through every messages.json file and make sure it's valid json
for file in _locales/*/messages.json; do
  echo "Validating $file"
  jq empty "$file"
  # check if every key has a message
  if [ "$(jq -r 'to_entries[] | select(.value.message == "") | .key' "$file")" ]; then
    echo "Error: $file has a key with no message"
  fi
done
