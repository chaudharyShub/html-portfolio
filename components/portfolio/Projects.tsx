import { VISIBLE_EXPERIENCE } from '@/data/experience';
import { VISIBLE_PROJECTS, type Project } from '@/data/projects';

interface ProjectGroup {
  title: string;
  /** "Role · dates" for a company, from data/experience.ts. */
  meta?: string;
  projects: Project[];
}

/**
 * Work projects grouped by company (newest job first), then personal projects. Shared with the
 * standalone /projects page.
 */
export function groupProjects(): ProjectGroup[] {
  const groups: ProjectGroup[] = VISIBLE_EXPERIENCE.map((job) => ({
    title: job.company,
    meta: `${job.title} · ${job.period}`,
    projects: VISIBLE_PROJECTS.filter((p) => p.company === job.company),
  }));
  groups.push({ title: 'Personal Projects', projects: VISIBLE_PROJECTS.filter((p) => !p.company) });
  return groups.filter((g) => g.projects.length > 0);
}

export function Projects() {
  return (
    <fieldset className="section" id="section-projects">
      <legend>
        <h2>Projects</h2>
      </legend>
      {groupProjects().map((group) => (
        <section className="project-group" key={group.title} aria-label={group.title}>
          <div className="project-group-header">
            <h3 className="project-group-title">{group.title}</h3>
            {group.meta && <span className="project-group-meta">{group.meta}</span>}
          </div>
          {group.projects.map((project) => (
            <ProjectCard project={project} key={project.name} />
          ))}
        </section>
      ))}
      {/* A plain page with every project, outside the desktop (also where the other sites link). */}
      <p className="projects-more">
        <a href="/projects">See every project on one page &#8594;</a>
      </p>
    </fieldset>
  );
}

/** `heading`: h4 under a company's h3 in the portfolio; h3 on the /projects page. */
export function ProjectCard({ project, heading: Heading = 'h4' }: { project: Project; heading?: 'h3' | 'h4' }) {
  return (
    <article className="project-card">
      <div className="project-title">
        <Heading className="project-name">{project.name}</Heading>
        <span className="status-badge" data-status={project.status}>{project.status}</span>
      </div>
      <div className="project-body">
        <div className="tech">Tech: {project.tech.join(', ')}</div>
        <p>{project.description}</p>
        {project.liveUrl && (
          <a
            className="btn"
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.name} live site (opens in a new tab)`}
          >
            Live Site &#8599;
          </a>
        )}
      </div>
    </article>
  );
}
