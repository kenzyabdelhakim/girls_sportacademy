# HTTPS Setup Guide for Camera Access

## Why HTTPS is Required

Modern browsers require HTTPS (secure connection) to access device cameras for security reasons. This is essential for the QR Scanner feature to work properly.

## Quick Setup Options

### Option 1: Use mkcert (Recommended - Easiest)

`mkcert` is a simple tool for creating locally-trusted SSL certificates.

#### Windows Setup:

1. **Install mkcert using Chocolatey:**
   ```bash
   choco install mkcert
   ```

   Or download from: https://github.com/FiloSottile/mkcert/releases

2. **Install the local CA:**
   ```bash
   mkcert -install
   ```

3. **Generate certificates in your project directory:**
   ```bash
   cd "C:\Users\Data\Downloads\sport academy"
   mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
   ```

4. **Enable HTTPS in your .env file:**
   ```env
   VITE_HTTPS=true
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

6. **Access your app at:**
   ```
   https://localhost:5173
   ```

#### macOS Setup:

1. **Install mkcert using Homebrew:**
   ```bash
   brew install mkcert
   brew install nss # if you use Firefox
   ```

2. **Install the local CA:**
   ```bash
   mkcert -install
   ```

3. **Generate certificates:**
   ```bash
   cd /path/to/sport-academy
   mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
   ```

4. **Enable HTTPS in .env:**
   ```env
   VITE_HTTPS=true
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

#### Linux Setup:

1. **Install mkcert:**
   ```bash
   # Debian/Ubuntu
   sudo apt install libnss3-tools
   wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
   chmod +x mkcert-v1.4.4-linux-amd64
   sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert

   # Arch Linux
   sudo pacman -S mkcert
   ```

2. **Install the local CA:**
   ```bash
   mkcert -install
   ```

3. **Generate certificates:**
   ```bash
   cd /path/to/sport-academy
   mkcert -key-file localhost-key.pem -cert-file localhost.pem localhost 127.0.0.1 ::1
   ```

4. **Enable HTTPS in .env:**
   ```env
   VITE_HTTPS=true
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

### Option 2: Use OpenSSL (Manual)

If you prefer not to install mkcert, you can use OpenSSL:

1. **Generate a self-signed certificate:**
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/CN=localhost"
   ```

2. **Enable HTTPS in .env:**
   ```env
   VITE_HTTPS=true
   ```

3. **Start the dev server:**
   ```bash
   npm run dev
   ```

4. **Accept the security warning in your browser:**
   - Chrome: Click "Advanced" → "Proceed to localhost (unsafe)"
   - Firefox: Click "Advanced" → "Accept the Risk and Continue"
   - Safari: Click "Show Details" → "visit this website"

### Option 3: Deploy to Production (No Local Setup Needed)

Deploy your app to a hosting service that provides HTTPS automatically:

- **Vercel**: Automatic HTTPS
- **Netlify**: Automatic HTTPS
- **Firebase Hosting**: Automatic HTTPS
- **GitHub Pages**: Automatic HTTPS

See the README.md deployment section for detailed instructions.

## Troubleshooting

### "HTTPS is required" error persists

1. Verify `.env` file has `VITE_HTTPS=true`
2. Restart the dev server after changing `.env`
3. Check that certificate files exist: `localhost.pem` and `localhost-key.pem`
4. Clear browser cache and reload

### Certificate not trusted

If using OpenSSL (Option 2), you'll see security warnings. This is normal for self-signed certificates. Click through the warning to proceed.

For mkcert (Option 1), certificates should be automatically trusted.

### Camera still not working

1. Check browser permissions: Click the lock icon in the address bar
2. Ensure camera is not in use by another application
3. Try a different browser
4. Check browser console for specific error messages

### Port already in use

If port 5173 is already in use, you can change it in `vite.config.js`:

```javascript
server: {
  port: 3000, // Change to any available port
  // ... rest of config
}
```

## Security Notes

- **Development certificates** (localhost.pem, localhost-key.pem) should NEVER be committed to git
- These files are already in `.gitignore`
- For production, use proper SSL certificates from your hosting provider
- Never use self-signed certificates in production

## Additional Resources

- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Vite HTTPS Documentation](https://vitejs.dev/config/server-options.html#server-https)
- [MDN: getUserMedia Security](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#security)
