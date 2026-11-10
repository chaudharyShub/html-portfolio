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
        // The clean-up service worker (public/sw.js) must always be fetched fresh.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
