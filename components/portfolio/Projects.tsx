import { VISIBLE_PROJECTS } from '@/data/projects';

export function Projects() {
  return (
    <fieldset className="section" id="section-projects">
      <legend>Projects\</legend>
      {VISIBLE_PROJECTS.map((project) => (
        <article className="project-card" key={project.name}>
          <div className="project-title">
            <h3 className="project-name">{project.name}</h3>
            <span className="status-badge">{project.status}</span>
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
      ))}
    </fieldset>
  );
}
