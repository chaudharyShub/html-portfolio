import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';
import { COVER_HOSTS } from './lib/blog-hosts';

// This computer's local network addresses, so a phone on the same Wi-Fi can open the dev server
// (Next.js blocks dev resources requested from other hosts). Only affects `next dev`.
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net && net.family === 'IPv4' && !net.internal)
  .map((net) => net!.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanAddresses,
  // Browser tests build into their own folder so they never replace the normal build.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  // Blog cover images in the Writing section, resized by next/image.
  images: { remotePatterns: COVER_HOSTS.map((hostname) => ({ protocol: 'https' as const, hostname })) },
  async headers() {
    return [
      {
        // Security headers on every response. No other site may show this one in a frame (so
        // nobody can trick visitors into clicking Like on a hidden copy). A full script CSP is
        // left out on purpose: Next.js ships the page data as inline scripts, and the theme
        // pre-paint script is inline too.
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
        ],
      },
      {
        // The clean-up service worker (public/sw.js) must always be fetched fresh.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
