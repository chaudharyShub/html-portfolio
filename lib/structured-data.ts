import { PROFILE } from '@/data/profile';
import { SITE } from './site';

/** schema.org ProfilePage describing the portfolio owner. Uses only facts shown on the site. */
export function buildProfilePageJsonLd(): Record<string, unknown> {
  const url = `${SITE.url}/`;
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    name: SITE.title,
    description: SITE.description,
    mainEntity: {
      '@type': 'Person',
      name: PROFILE.name,
      jobTitle: PROFILE.role,
      url,
      image: `${SITE.url}${PROFILE.photo}`,
      sameAs: [PROFILE.links.github, PROFILE.links.linkedin],
      description: SITE.description,
    },
  };
}
