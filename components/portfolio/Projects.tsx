import { VISIBLE_EXPERIENCE } from '@/data/experience';
import { VISIBLE_PROJECTS, type Project } from '@/data/projects';

interface ProjectGroup {
  title: string;
  /** "Role · dates" for a company, from data/experience.ts. */
  meta?: string;
  projects: Project[];
}

/** Work projects grouped by company (newest job first), then personal projects. */
function groupProjects(): ProjectGroup[] {
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
    </fieldset>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project-card">
      <div className="project-title">
        <h4 className="project-name">{project.name}</h4>
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
