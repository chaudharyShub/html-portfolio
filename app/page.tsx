import type { Metadata } from 'next';
import { ShubhamOS } from '@/components/os/ShubhamOS';
import { About } from '@/components/portfolio/About';
import { Contact } from '@/components/portfolio/Contact';
import { Experience } from '@/components/portfolio/Experience';
import { InfoBar } from '@/components/portfolio/InfoBar';
import { Projects } from '@/components/portfolio/Projects';
import { Skills } from '@/components/portfolio/Skills';
import { StatusBar } from '@/components/portfolio/StatusBar';
// import { Writing } from '@/components/portfolio/Writing';
import { JsonLd } from '@/components/shared/JsonLd';
// import { getBlogPosts } from '@/lib/blog';
import { buildProfilePageJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Writing section turned off for now (Nov 2026): to bring it back, uncomment the Writing lines here and in lib/sections.ts and
// lib/terminal.ts. It looks for new blog posts about once a day (BLOG_REVALIDATE in lib/blog.ts;
// must be a literal here).
// export const revalidate = 86400;

/**
 * The portfolio content below is rendered on the server (fully present in the HTML for
 * crawlers) and handed to the client-side desktop, which only decides layout and visibility.
 */
export default function HomePage() {
  // const posts = await getBlogPosts(); (and make HomePage async again)
  return (
    <>
      <JsonLd data={buildProfilePageJsonLd()} />
      <ShubhamOS
        infoBar={<InfoBar />}
        statusBar={<StatusBar />}
        // posts={posts.map(({ title, url, dateLabel, readMinutes }) => ({ title, url, dateLabel, readMinutes }))}
        posts={[]}
        sections={{
          about: <About />,
          skills: <Skills />,
          projects: <Projects />,
          experience: <Experience />,
          // writing: <Writing posts={posts} />,
          contact: <Contact />,
        }}
      />
    </>
  );
}
