import { CareerUptime, YearsExperience } from '@/components/live/CareerStats';
import { ABOUT_SUMMARY, CORE_MODULES, STATIC_STATS } from '@/data/about';
import { PROFILE } from '@/data/profile';

export function About() {
  return (
    <fieldset className="section" id="section-about">
      <legend>About Me</legend>
      <p>{ABOUT_SUMMARY}</p>
      <h3 className="sub">Core Modules</h3>
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Description</th>
            <th>Tech</th>
          </tr>
        </thead>
        <tbody>
          {CORE_MODULES.map((m) => (
            <tr key={m.area}>
              <td>{m.area}</td>
              <td>{m.description}</td>
              <td>{m.tech}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="sub">Stats.dat</h3>
      <div className="stats-grid">
        <div className="stat-box">
          <div className="num">
            <YearsExperience />
          </div>
          <div className="lbl">Years Experience</div>
        </div>
        {STATIC_STATS.map((s) => (
          <div className="stat-box" key={s.label}>
            <div className="num">{s.value}</div>
            <div className="lbl">{s.label}</div>
          </div>
        ))}
        <div className="stat-box wide">
          <div className="num">
            <CareerUptime />
          </div>
          <div className="lbl">IT Career Uptime (live, since {PROFILE.careerStartLabel})</div>
        </div>
      </div>
    </fieldset>
  );
}
