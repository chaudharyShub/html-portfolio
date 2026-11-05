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

/**
 * Search snippet: the person first (name, role, years, main stack), then what the site is.
 * Google shows about the first 155 characters, so the important words come first.
 */
const description =
  'Shubham Chaudhary, Full Stack Engineer with 4+ years building web and desktop apps in React, Next.js, TypeScript and Node.js. Projects, experience and resume in an interactive portfolio.';

/** Read at build time; set them in Vercel once Search Console / Bing Webmaster Tools give a code. */
const verification = {
  google: process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined,
  bing: process.env.BING_SITE_VERIFICATION?.trim() || undefined,
};

export const SITE = {
  url: resolveSiteUrl(),
  /** App name: the label under the icon when the site is added to an iPhone Home Screen. */
  name: 'Shubham OS',
  /** The site's name in search results and link previews (Google reads it from WebSite data). */
  siteName: PROFILE.name,
  /** Name + role first, so a cut-off title still says who this is. */
  title: `${PROFILE.name} - ${PROFILE.role} | React, Next.js, Node.js`,
  description,
  verification,
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
} as const;
