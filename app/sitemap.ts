import type { MetadataRoute } from 'next';
import { PROFILE } from '@/data/profile';
import { SITE } from '@/lib/site';

/**
 * The desktop, the /projects page, plus the resume PDF: the site only offers it through a button
 * (the setup wizard), so crawlers find it here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE.url}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE.url}/projects`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE.url}${PROFILE.resume.href}`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
