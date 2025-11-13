#!/bin/sh
set -e

echo "Starting environment variable replacement..."

# Look specifically for the ZEROQC_API_URL environment variable
if [ ! -z "$ZEROQC_API_URL" ]; then
  echo "Found ZEROQC_API_URL: $ZEROQC_API_URL"

  # First, replace the exact string "ZEROQC_API_URL" in all JavaScript files
  find /usr/share/nginx/html -type f -name "*.js" -exec grep -l "ZEROQC_API_URL" {} \; | xargs -I{} sed -i "s|ZEROQC_API_URL|$ZEROQC_API_URL|g" {}

  # Also check for the escaped version which might appear in some files
  find /usr/share/nginx/html -type f -name "*.js" -exec grep -l "\"ZEROQC_API_URL\"" {} \; | xargs -I{} sed -i "s|\"ZEROQC_API_URL\"|\"$ZEROQC_API_URL\"|g" {}

  echo "Replaced ZEROQC_API_URL with $ZEROQC_API_URL"
else
  echo "WARNING: ZEROQC_API_URL environment variable is not set. API calls may fail."
fi

# Process any other ZEROQC_ prefixed environment variables
for envvar in $(env | grep ZEROQC_ | grep -v ZEROQC_API_URL)
do
  key=$(echo $envvar | cut -d '=' -f 1)
  value=$(echo $envvar | cut -d '=' -f 2-)
  echo "Replacing $key with $value"

  find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.css" \) -exec sed -i "s|$key|$value|g" {} \;
done

echo "Environment variable replacement complete"
