const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow the Windows host IP to serve the dev app so WSL Playwright can connect.
    // Without this, Next.js 16 blocks _next/* resources and the HMR WebSocket.
    // Hostnames/IPs only — this option does not understand CIDR ranges.
    allowedDevOrigins: ['172.30.192.1', '172.21.160.1', '172.19.32.1', '10.255.255.254'],
    images: {
        remotePatterns: [
            // Google account profile pictures used by NextAuth.
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        ],
    },
    // Legacy vanity URLs. Public profiles used to live at /@username; the
    // canonical form is now /u/username. Config redirects run before the
    // proxy and before filesystem routing, and they're the only layer that
    // can see an @-prefixed segment at all — Next's router refuses to match
    // @-segments against dynamic routes (they collide with the parallel-route
    // slot syntax), which is also why the old proxy rewrite existed. Matching
    // runs on the raw (still-encoded) path, so the percent-encoded /%40user
    // form — produced by some external link handlers — needs its own rules.
    async redirects() {
        return [
            { source: '/@:username', destination: '/u/:username', permanent: true },
            { source: '/@:username/:rest*', destination: '/u/:username/:rest*', permanent: true },
            { source: '/%40:username', destination: '/u/:username', permanent: true },
            { source: '/%40:username/:rest*', destination: '/u/:username/:rest*', permanent: true },
        ];
    },
};

module.exports = withNextIntl(nextConfig);
