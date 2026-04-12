/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow the Windows host IP to serve the dev app so WSL Playwright can connect.
    // Without this, Next.js 16 blocks _next/* resources and the HMR WebSocket.
    allowedDevOrigins: ['172.30.192.1', '172.30.0.0/16', '10.255.255.254'],
}

module.exports = nextConfig
