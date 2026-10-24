import { SKILL_GROUPS } from '@/data/skills';

export function Skills() {
  return (
    <fieldset className="section" id="section-skills">
      <legend>
        <h2>Skills.cfg</h2>
      </legend>
      {SKILL_GROUPS.map((group) => (
        <div className="skill-group" key={group.title}>
          <h3 className="sub">{group.title}</h3>
          {group.skills.map((skill) => (
            <div className="skill-row" key={skill.name}>
              <span className="skill-name">{skill.name}</span>
              <span className="skill-level">{skill.level}</span>
              <div className="skill-bar-track" aria-hidden="true">
                <div className="skill-bar-fill" style={{ width: `${skill.percent}%` }} />
              </div>
              <span className="skill-pct">{skill.percent}%</span>
            </div>
          ))}
        </div>
      ))}
    </fieldset>
  );
}
