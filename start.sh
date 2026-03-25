#!/bin/sh

# Simple startup script for Coolify deployment
# Copy the nginx config and start nginx

echo "Setting up nginx configuration..."

# Copy nginx config directly (no variable substitution needed)
cp /etc/nginx/templates/default.conf.template /etc/nginx/conf.d/default.conf

# Verify the config was created correctly
if [ ! -f /etc/nginx/conf.d/default.conf ]; then
    echo "Error: Failed to copy nginx configuration"
    exit 1
fi

# Test nginx config
nginx -t
if [ $? -ne 0 ]; then
    echo "Error: Invalid nginx configuration"
    exit 1
fi

echo "Starting nginx on port 80..."

# Start nginx
exec nginx -g 'daemon off;'