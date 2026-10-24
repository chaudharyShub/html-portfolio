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

/** Who first, then what the site is: a portfolio you can explore like a desktop. */
const description =
  "An interactive macOS-style portfolio built by a Full Stack Engineer with 4+ years building web and desktop apps in React, Next.js and Node.js.";

export const SITE = {
  url: resolveSiteUrl(),
  name: 'Shubham OS',
  title: `${PROFILE.name} - ${PROFILE.role} Portfolio`,
  description,
  social: {
    title: `${PROFILE.name} - ${PROFILE.role} Portfolio`,
    description,
    twitterDescription:
      'Full Stack Engineer with 4+ years in React, Next.js and Node.js. Explore my projects, experience and skills in an interactive, desktop-style portfolio.',
    image: {
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: "Shubham Chaudhary's portfolio: profile, projects and experience in an interactive desktop-style window",
    },
  },
  themeColor: '#1d1d1f',
  backgroundColor: '#6a5acd',
} as const;
