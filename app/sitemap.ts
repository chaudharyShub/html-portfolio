import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/** Single public page. Add entries here if real sub-pages are introduced. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE.url}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
