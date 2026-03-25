#!/bin/sh

# Startup script for Coolify deployment
# This script substitutes environment variables in nginx config and starts nginx

# Set default port if not provided
export PORT=${PORT:-3000}

# Substitute environment variables in nginx config
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Verify the config was created correctly
if [ ! -f /etc/nginx/conf.d/default.conf ]; then
    echo "Error: Failed to generate nginx configuration"
    exit 1
fi

echo "Starting nginx on port $PORT..."

# Start nginx
exec nginx -g 'daemon off;'