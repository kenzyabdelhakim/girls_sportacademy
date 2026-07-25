# HTTPS Setup Script for Windows
# This script helps set up HTTPS for local development using mkcert

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sports Academy - HTTPS Setup Script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if mkcert is installed
Write-Host "Checking for mkcert..." -ForegroundColor Yellow
$mkcertInstalled = Get-Command mkcert -ErrorAction SilentlyContinue

if (-not $mkcertInstalled) {
    Write-Host "mkcert is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install mkcert using one of these methods:" -ForegroundColor Yellow
    Write-Host "1. Using Chocolatey: choco install mkcert" -ForegroundColor White
    Write-Host "2. Download from: https://github.com/FiloSottile/mkcert/releases" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing mkcert, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ mkcert is installed" -ForegroundColor Green
Write-Host ""

# Install local CA
Write-Host "Installing local Certificate Authority..." -ForegroundColor Yellow
try {
    mkcert -install
    Write-Host "✓ Local CA installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install local CA" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

# Generate certificates
Write-Host "Generating SSL certificates..." -ForegroundColor Yellow
try {
    mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
    Write-Host "✓ Certificates generated successfully" -ForegroundColor Green
    Write-Host "  - localhost.pem" -ForegroundColor White
    Write-Host "  - localhost-key.pem" -ForegroundColor White
} catch {
    Write-Host "✗ Failed to generate certificates" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
Write-Host ""

# Update .env file
Write-Host "Updating .env file..." -ForegroundColor Yellow
$envFile = ".env"
$envContent = ""

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "VITE_HTTPS=") {
        $envContent = $envContent -replace "VITE_HTTPS=.*", "VITE_HTTPS=true"
        Write-Host "✓ Updated existing VITE_HTTPS setting" -ForegroundColor Green
    } else {
        $envContent += "`nVITE_HTTPS=true`n"
        Write-Host "✓ Added VITE_HTTPS=true to .env" -ForegroundColor Green
    }
    Set-Content -Path $envFile -Value $envContent
} else {
    Write-Host "✗ .env file not found. Please create it from .env.example" -ForegroundColor Red
    Write-Host "  Run: copy .env.example .env" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "  HTTPS Setup Complete!                " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the dev server: npm run dev" -ForegroundColor White
Write-Host "2. Access your app at: https://localhost:5173" -ForegroundColor White
Write-Host "3. The camera should now work on the Scanner page" -ForegroundColor White
Write-Host ""
Write-Host "Note: You may need to restart your browser for changes to take effect." -ForegroundColor Cyan
Write-Host ""
