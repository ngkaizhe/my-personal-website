const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow the Windows host IP to serve the dev app so WSL Playwright can connect.
    // Without this, Next.js 16 blocks _next/* resources and the HMR WebSocket.
    allowedDevOrigins: ['172.30.192.1', '172.30.0.0/16', '172.21.0.0/16', '172.21.160.1', '10.255.255.254'],
    images: {
        remotePatterns: [
            // Google account profile pictures used by NextAuth.
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        ],
    },
};

module.exports = withNextIntl(nextConfig);
