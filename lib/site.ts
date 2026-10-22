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
  'A fully interactive Windows-95-style desktop: draggable windows, a real DOS prompt, joke error dialogs, and a bouncing DVD logo. 4+ years frontend experience, React, Next.js, Node.js.';

export const SITE = {
  url: resolveSiteUrl(),
  name: 'Shubham OS',
  title: `${PROFILE.name} - ${PROFILE.role} (Portfolio That Boots Like Windows 95)`,
  description,
  social: {
    title: `${PROFILE.name} - This Portfolio Boots Like It's 1995`,
    description,
    twitterDescription:
      "Draggable windows. A real DOS prompt. Joke error dialogs. A bouncing DVD logo. Yes, it's a real portfolio - 4+ years frontend experience.",
    image: { url: '/og-image.png', width: 1200, height: 630, alt: 'Preview of the Shubham OS portfolio window' },
  },
  themeColor: '#000080',
  backgroundColor: '#008080',
} as const;
