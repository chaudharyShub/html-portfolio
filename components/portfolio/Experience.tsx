import { VISIBLE_EXPERIENCE } from '@/data/experience';

export function Experience() {
  return (
    <fieldset className="section" id="section-experience">
      <legend>Experience\logs\</legend>
      {VISIBLE_EXPERIENCE.map((job) => (
        <article className="exp-entry" key={`${job.company}-${job.period}`}>
          <h3 className="exp-header">
            {job.company} - {job.title}
          </h3>
          <div className="exp-duration">
            {job.period} <span className="exp-total">{job.duration}</span>
          </div>
          <p>{job.summary}</p>
          <div>
            {job.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </fieldset>
  );
}
