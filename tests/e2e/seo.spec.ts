import { expect, test } from '@playwright/test';

/** What search engines and link previews read, straight from the server HTML. */

test('the page tells search engines who this is', async ({ request }) => {
  const html = await (await request.get('/')).text();
  const meta = (attr: string, value: string) =>
    html.match(new RegExp(`<meta ${attr}="${value}" content="([^"]*)"`))?.[1];

  expect(html).toContain('<title>Shubham Chaudhary - Full Stack Engineer | React, Next.js, Node.js</title>');
  const description = meta('name', 'description')!;
  expect(description.startsWith('Shubham Chaudhary, Full Stack Engineer')).toBe(true);
  // The site is described by the person, not marketed as macOS (the user's rule).
  expect(description).not.toMatch(/mac ?os|ios/i);
  expect(meta('property', 'og:site_name')).toBe('Shubham Chaudhary');
  expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^"]+"/);
  expect(meta('name', 'google-site-verification')).toBe('test-google-code');
  expect(meta('name', 'msvalidate.01')).toBe('test-bing-code');

  // Structured data: the site name and the person.
  const jsonLd = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1] ?? '{}');
  const byType = (type: string) => jsonLd['@graph'].find((node: { '@type': string }) => node['@type'] === type);
  expect(byType('WebSite').name).toBe('Shubham Chaudhary');
  expect(byType('Person').name).toBe('Shubham Chaudhary');
  expect(byType('Person').knowsAbout).toContain('Next.js');
  expect(byType('Person').sameAs).toContain('https://github.com/chaudharyShub');
  expect(byType('Person').sameAs).toContain('https://dev.to/shubham_works');

  // All the portfolio text is in the HTML, not only after JavaScript runs.
  for (const text of ['About Me', 'Agent Fabric', 'Quokka Labs', 'CloudPrep', 'Older Post About npm']) expect(html).toContain(text);
  // The years of experience are in the HTML too, not a "-" placeholder until the clock starts.
  expect(html).toMatch(/Experience:<\/b> (<!-- -->)?\d+\+ Years/);
  expect(html).toMatch(/<div class="num">\d+\+<\/div><div class="lbl">Years Experience/);
});

test('robots.txt and the sitemap let crawlers find the page and the resume', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Allow: /');
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);

  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toMatch(/<loc>[^<]+\/<\/loc>/);
  expect(sitemap).toMatch(/<loc>[^<]+\/projects<\/loc>/);
  expect(sitemap).toMatch(/<loc>[^<]+\/Shubham_resume\.pdf<\/loc>/);
  expect((await request.get('/Shubham_resume.pdf')).status()).toBe(200);
});

test('the /projects page lists every visible project in the server HTML', async ({ request }) => {
  const response = await request.get('/projects');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('<title>Projects | Shubham Chaudhary</title>');
  expect(html).toMatch(/<link rel="canonical" href="https?:\/\/[^"]+\/projects"/);
  // Link previews: its own title, plus the shared image and site name from the root layout.
  expect(html).toMatch(/<meta property="og:image" content="https?:\/\/[^"]+\/og-image\.jpg"/);
  expect(html).toContain('<meta property="og:site_name" content="Shubham Chaudhary"/>');
  expect(html).toContain('<meta name="twitter:title" content="Projects | Shubham Chaudhary"/>');
  for (const name of ['Agent Fabric', 'RunTheDay (RTD)', 'Git, Drawn Out', 'CloudPrep', 'Frontend Interview Prep', 'Personal Projects'])
    expect(html).toContain(name.replace('&', '&amp;'));
  // Personal sites come first (visitors arrive from them), then the jobs.
  expect(html.indexOf('Personal Projects')).toBeLessThan(html.indexOf('Koru UX'));
  // Hidden entries stay hidden here too.
  expect(html).not.toContain('BrowseAnywhere');
  // The Shubham Works footer, without "All projects" (this page is it).
  expect(html).toContain('A Shubham Works project');
  expect(html).not.toContain('All projects');
});

test('every response carries the security headers (no framing by other sites)', async ({ request }) => {
  for (const path of ['/', '/projects', '/api/likes', '/Shubham_resume.pdf']) {
    const headers = (await request.get(path)).headers();
    expect(headers['x-frame-options'], path).toBe('DENY');
    expect(headers['content-security-policy'], path).toBe("frame-ancestors 'none'");
    expect(headers['x-content-type-options'], path).toBe('nosniff');
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
  }
});
