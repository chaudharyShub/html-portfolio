import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import type { ReactNode } from 'react';
import { ServiceWorkerRegistrar } from '@/components/shared/ServiceWorkerRegistrar';
import { PROFILE } from '@/data/profile';
import { SITE } from '@/lib/site';
import { buildAppearanceInitScript, DEFAULT_THEME } from '@/lib/themes';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${PROFILE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: PROFILE.name, url: SITE.url }],
  creator: PROFILE.name,
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: SITE.social.title,
    description: SITE.social.description,
    url: '/',
    images: [SITE.social.image],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.social.title,
    description: SITE.social.twitterDescription,
    images: [SITE.social.image.url],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: SITE.themeColor,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The inline theme script sets CSS variables / data-theme on <html> before first paint,
    // so React must not complain that those attributes differ from the server HTML.
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: buildAppearanceInitScript() }} />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistrar />
        {/* Vercel Web Analytics (cookieless page views). Its script is served only by Vercel, so it is
            rendered only in builds made on Vercel; local dev/start would just get a 404. */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
