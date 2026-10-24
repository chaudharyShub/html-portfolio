import { PROFILE } from '@/data/profile';

/** The domain the site has been served from so far. Used only when nothing else is configured. */
const FALLBACK_SITE_URL = 'https://shubhamworks.vercel.app';

/**
 * Resolves the public site URL used for canonical links, Open Graph, sitemap and robots.
 *
 * Order: NEXT_PUBLIC_SITE_URL (set this for a custom domain) -> Vercel's production
 * domain (provided automatically on Vercel; it prefers a custom domain once one is attached)
 * -> the existing vercel.app domain.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) return `https://${vercelProduction.replace(/\/+$/, '')}`;
  return FALLBACK_SITE_URL;
}

const description =
  'An interactive macOS-style desktop (an iPhone-style app on phones): a real Terminal, a Dock, windows and a tiny game. 4+ years building with React, Next.js and Node.js.';

export const SITE = {
  url: resolveSiteUrl(),
  name: 'Shubham OS',
  title: `${PROFILE.name} - ${PROFILE.role} (A Portfolio That Works Like a Mac)`,
  description,
  social: {
    title: `${PROFILE.name} - This Portfolio Works Like a Mac`,
    description,
    twitterDescription:
      "A Dock, windows that minimize into it, a real Terminal and a tiny game. Yes, it's a real portfolio - 4+ years building with React, Next.js and Node.js.",
    image: {
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'The Shubham OS portfolio: a Mac-style window with a sidebar profile card, on a colorful desktop with a Dock',
    },
  },
  themeColor: '#1d1d1f',
  backgroundColor: '#6a5acd',
} as const;
