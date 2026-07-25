#!/bin/bash

# HTTPS Setup Script for macOS/Linux
# This script helps set up HTTPS for local development using mkcert

echo "========================================"
echo "  Sports Academy - HTTPS Setup Script  "
echo "========================================"
echo ""

# Check if mkcert is installed
echo "Checking for mkcert..."
if ! command -v mkcert &> /dev/null; then
    echo "✗ mkcert is not installed"
    echo ""
    echo "Please install mkcert using one of these methods:"
    echo ""
    echo "macOS (Homebrew):"
    echo "  brew install mkcert"
    echo "  brew install nss  # if you use Firefox"
    echo ""
    echo "Linux (Debian/Ubuntu):"
    echo "  sudo apt install libnss3-tools"
    echo "  wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64"
    echo "  chmod +x mkcert-v1.4.4-linux-amd64"
    echo "  sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert"
    echo ""
    echo "Linux (Arch):"
    echo "  sudo pacman -S mkcert"
    echo ""
    echo "After installing mkcert, run this script again."
    exit 1
fi

echo "✓ mkcert is installed"
echo ""

# Install local CA
echo "Installing local Certificate Authority..."
if mkcert -install; then
    echo "✓ Local CA installed"
else
    echo "✗ Failed to install local CA"
    exit 1
fi
echo ""

# Generate certificates
echo "Generating SSL certificates..."
if mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1; then
    echo "✓ Certificates generated successfully"
    echo "  - localhost.pem"
    echo "  - localhost-key.pem"
else
    echo "✗ Failed to generate certificates"
    exit 1
fi
echo ""

# Update .env file
echo "Updating .env file..."
if [ -f ".env" ]; then
    if grep -q "VITE_HTTPS=" .env; then
        # Update existing line
        sed -i.bak 's/VITE_HTTPS=.*/VITE_HTTPS=true/' .env
        echo "✓ Updated existing VITE_HTTPS setting"
    else
        # Add new line
        echo "" >> .env
        echo "VITE_HTTPS=true" >> .env
        echo "✓ Added VITE_HTTPS=true to .env"
    fi
else
    echo "✗ .env file not found. Please create it from .env.example"
    echo "  Run: cp .env.example .env"
    exit 1
fi
echo ""

# Success message
echo "========================================"
echo "  HTTPS Setup Complete!                "
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Start the dev server: npm run dev"
echo "2. Access your app at: https://localhost:5173"
echo "3. The camera should now work on the Scanner page"
echo ""
echo "Note: You may need to restart your browser for changes to take effect."
echo ""
