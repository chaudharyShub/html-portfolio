import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Browser tests build into their own folder so they never replace the normal build.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
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
