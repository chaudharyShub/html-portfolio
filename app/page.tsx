import type { Metadata } from 'next';
import { ShubhamOS } from '@/components/os/ShubhamOS';
import { About } from '@/components/portfolio/About';
import { Contact } from '@/components/portfolio/Contact';
import { Experience } from '@/components/portfolio/Experience';
import { InfoBar } from '@/components/portfolio/InfoBar';
import { Projects } from '@/components/portfolio/Projects';
import { Skills } from '@/components/portfolio/Skills';
import { StatusBar } from '@/components/portfolio/StatusBar';
import { JsonLd } from '@/components/shared/JsonLd';
import { buildProfilePageJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * The portfolio content below is rendered on the server (fully present in the HTML for
 * crawlers) and handed to the client-side desktop, which only decides layout and visibility.
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={buildProfilePageJsonLd()} />
      <ShubhamOS
        infoBar={<InfoBar />}
        statusBar={<StatusBar />}
        sections={{
          about: <About />,
          skills: <Skills />,
          projects: <Projects />,
          experience: <Experience />,
          contact: <Contact />,
        }}
      />
    </>
  );
}
