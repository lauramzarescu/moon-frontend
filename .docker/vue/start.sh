#!/bin/sh

ROOT_DIR=/code/dist

RESOLVER=$(grep -i '^nameserver' /etc/resolv.conf | head -n1 | cut -d ' ' -f2)
export RESOLVER

# shellcheck disable=SC2016
# shellcheck disable=SC2046
defined_envs=$(printf '${%s} ' $(env | cut -d= -f1))

# replace template values for nginx config
dest="/etc/nginx/nginx.conf"
src="$dest.template"
echo "Running envsubst on $src to $dest"
envsubst "$defined_envs" <"$src" >"$dest"

# Run the replacement when environment is not "local"
if [ "$ENVIRONMENT" != "local" ]; then
  # Replace env vars in JavaScript files
  echo "Non-local environment detected. Replacing env constants in JS"

  # Find all JS files in dist and dist/assets
  find $ROOT_DIR -type f \( -name "*.js" -o -name "*.html" \) | while read file
  do
    echo "Processing $file ...";

    # Get all environment variables that start with VITE_
    env | grep "^VITE_" | while IFS='=' read -r key value
    do
      # Replace the key with its value in the file
      sed -i "s|${key}_PLACEHOLDER|${value}|g" $file
      echo "Replaced ${key}_PLACEHOLDER with ${value} in $file"
    done
  done
else
  echo "Local environment detected. Skipping environment variable replacement."
fi

echo "Starting Nginx"
nginx -g 'daemon off;'