#!/bin/bash
set -x

# welp nevermind you can't update your listing from the API

if [ ! -f ".env" ]; then
  echo "Error: .env file not found. Please create one from .env.example"
  exit 1
fi
source .env

if [ -z "$1" ]; then
  echo "Get an access token from here:"
  echo "https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=${CHROME_CLIENT_ID}&redirect_uri=urn:ietf:wg:oauth:2.0:oob"
  echo "Then run this script with the code as the first argument"
  exit 0
fi

access_code="$1"
TOKEN=$(curl "https://accounts.google.com/o/oauth2/token" -d \
  "client_id=$CHROME_CLIENT_ID&client_secret=$CHROME_CLIENT_SECRET&code=$access_code&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob" | jq '.access_token')
echo "access_token: $TOKEN"

echo "Getting info..."
curl \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-goog-api-version: 2" \
  -H "Content-Length: 0" \
  -H "Expect:" \
  -X GET \
  -v \
  https://www.googleapis.com/chromewebstore/v1.1/items/$CHROME_STORE_ID?projection=DRAFT
