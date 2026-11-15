import type { Metadata } from 'next';
import Link from 'next/link';
import { MakerMark } from '@/components/icons';
import { groupProjects, ProjectCard } from '@/components/portfolio/Projects';
import { OTHER_SITES } from '@/data/projects';
import { PROFILE } from '@/data/profile';
import { SITE } from '@/lib/site';

const description = `Every project by ${PROFILE.name}, ${PROFILE.role}: work at each company and personal sites, with the tech used and live links.`;
const socialTitle = `Projects | ${PROFILE.name}`;

// A page's openGraph / twitter replace the root layout's whole block (Next doesn't merge them),
// so the share image and site name are repeated here.
export const metadata: Metadata = {
  title: 'Projects',
  description,
  alternates: { canonical: '/projects' },
  openGraph: {
    type: 'website',
    siteName: SITE.siteName,
    url: '/projects',
    title: socialTitle,
    description,
    images: [SITE.social.image],
  },
  twitter: {
    card: 'summary_large_image',
    title: socialTitle,
    description,
    images: [SITE.social.image.url],
  },
};

/**
 * A plain, fast list of every project, outside the desktop: the page the other Shubham Works
 * sites link to as "All projects" (no startup screen, no windows). Same content and styles as
 * the portfolio's Projects section, two per row, in one card on the wallpaper.
 */
export default function ProjectsPage() {
  // Personal sites first: most visitors arrive here from one of them. Then the jobs, newest first.
  const groups = groupProjects().sort((a, b) => Number(!!a.meta) - Number(!!b.meta));
  return (
    <div className="projects-page">
      <main className="projects-sheet">
        <header className="projects-header">
          <div>
            <h1>Projects</h1>
            <p className="projects-intro">
              By {PROFILE.name}, {PROFILE.role}.
            </p>
          </div>
          <Link className="btn btn-primary" href="/">
            Open the portfolio
          </Link>
        </header>

        {groups.map((group) => (
          <section className="project-group" key={group.title} aria-labelledby={slug(group.title)}>
            <div className="project-group-header">
              <h2 className="project-group-title" id={slug(group.title)}>
                {group.title}
              </h2>
              {group.meta && <span className="project-group-meta">{group.meta}</span>}
            </div>
            <div className="projects-grid">
              {group.projects.map((project) => (
                <ProjectCard project={project} heading="h3" key={project.name} />
              ))}
            </div>
          </section>
        ))}

        {/* The Shubham Works block (docs/SHUBHAM_WORKS.md). "All projects" is this page, so it is left out. */}
        <footer className="projects-footer sw-block">
          <p className="projects-footer-brand">
            <span className="made-by-mark">
              <MakerMark size={20} />
            </span>
            A Shubham Works project
          </p>
          <p>
            Made by <Link href="/">{PROFILE.name}</Link>
          </p>
          <p>
            Also:{' '}
            {OTHER_SITES.map((site, i) => (
              <span key={site.name}>
                {i > 0 && ', '}
                <a href={site.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`${site.name} (opens in a new tab)`}>
                  {site.name} &#8599;
                </a>
              </span>
            ))}
          </p>
        </footer>
      </main>
    </div>
  );
}

function slug(text: string) {
  return `group-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}
