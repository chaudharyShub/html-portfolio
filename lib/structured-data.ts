import { PROFILE, PROFILE_LINKS } from '@/data/profile';
import { SKILL_GROUPS } from '@/data/skills';
import { SITE } from './site';

/**
 * schema.org data for search engines, using only facts shown on the site:
 * - WebSite: gives Google the site name for results ("Shubham Chaudhary", also "Shubham Works");
 * - ProfilePage + Person: who the page is about, their profiles and skills.
 */
export function buildProfilePageJsonLd(): Record<string, unknown> {
  const url = `${SITE.url}/`;
  const personId = `${url}#person`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}#website`,
        url,
        name: SITE.siteName,
        alternateName: ['Shubham Works', `${PROFILE.name} Portfolio`],
        publisher: { '@id': personId },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${url}#profile`,
        url,
        name: SITE.title,
        description: SITE.description,
        isPartOf: { '@id': `${url}#website` },
        mainEntity: { '@id': personId },
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: PROFILE.name,
        jobTitle: PROFILE.role,
        url,
        image: `${SITE.url}${PROFILE.photo}`,
        sameAs: PROFILE_LINKS.map((link) => link.href),
        knowsAbout: SKILL_GROUPS.flatMap((group) => group.skills.map((skill) => skill.name)),
        description: SITE.description,
      },
    ],
  };
}
