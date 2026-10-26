'use client';

import { CareerUptime, YearsExperience } from '@/components/live/CareerStats';
import { CurrentYear } from '@/components/live/CurrentYear';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { PROFILE } from '@/data/profile';
import { VISIBLE_PROJECTS } from '@/data/projects';
import { Dialog } from './Dialog';

const GITHUB_HANDLE = PROFILE.links.github.split('/').pop();

/** "About This Developer": a spec sheet for Shubham, in the style of a Mac's About window. */
export function AboutDeveloperDialog() {
  const { dialogs } = useOsState();
  const actions = useOsActions();
  const close = () => actions.closeDialog('about');

  return (
    <Dialog open={dialogs.about} title="About This Developer" onClose={close} boxClassName="about-box">
      <div className="dialog-body about-body">
        {/* Decorative: the name is right below it. Small static file, so a plain <img>. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="about-photo" src={PROFILE.photo} alt="" width={112} height={112} />
        <h3 className="about-name">{PROFILE.name}</h3>
        <p className="about-role">{PROFILE.role}</p>

        <dl className="about-specs">
          <dt>Chip</dt>
          <dd>React.js + Next.js</dd>
          <dt>Memory</dt>
          <dd>
            <YearsExperience withUnit /> in IT
          </dd>
          <dt>Storage</dt>
          <dd>{VISIBLE_PROJECTS.length} projects shipped</dd>
          <dt>Uptime</dt>
          <dd className="about-mono">
            <CareerUptime />
          </dd>
          <dt>Serial number</dt>
          <dd>
            <a href={PROFILE.links.github} target="_blank" rel="noopener noreferrer">
              {GITHUB_HANDLE}
            </a>
          </dd>
        </dl>

        <div className="about-buttons">
          <button
            type="button"
            onClick={() => {
              close();
              actions.goToSection('about');
            }}
          >
            More Info…
          </button>
          <button
            type="button"
            onClick={() => {
              close();
              actions.openResumeWizard();
            }}
          >
            Resume…
          </button>
        </div>
        <p className="about-legal">© <CurrentYear /> {PROFILE.name}</p>
      </div>
    </Dialog>
  );
}
