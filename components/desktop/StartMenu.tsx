'use client';

import { DisplayIcon } from '@/components/icons';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { PROFILE } from '@/data/profile';
import { pressableProps } from '@/lib/a11y';
import type { SectionId } from '@/lib/sections';

const SECTION_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'about', label: 'About Me' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

const EXTERNAL_LINKS = [
  { label: 'GitHub', href: PROFILE.links.github },
  { label: 'LinkedIn', href: PROFILE.links.linkedin },
  { label: 'Instagram', href: PROFILE.links.instagram },
];

export function StartMenu() {
  const { startMenuOpen } = useOsState();
  const actions = useOsActions();

  const item = (label: string) =>
    ({ className: 'start-item', ...pressableProps, role: 'menuitem', 'aria-label': label }) as const;

  return (
    <div className={`start-menu${startMenuOpen ? ' open' : ''}`} id="start-menu" role="menu" aria-label="Start menu">
      <div className="start-menu-side" aria-hidden="true">
        SHUBHAM 95
      </div>
      <div className="start-menu-items">
        {SECTION_ITEMS.map(({ id, label }) => (
          <div key={id} {...item(label)} onClick={() => actions.goToSection(id)}>
            📁 {label}
          </div>
        ))}
        <div className="start-sep" role="separator" />
        <div {...item('MS-DOS Prompt')} onClick={actions.openDos}>🖥 MS-DOS Prompt</div>
        <div {...item('Debug Runner (game)')} onClick={actions.openGame}>🐛 Debug Runner (game)</div>
        <div className="start-sep" role="separator" />
        <div {...item('Display Properties')} onClick={() => actions.openDialog('display')}>
          <DisplayIcon /> Display Properties
        </div>
        <div className="start-sep" role="separator" />
        <div
          {...item('Download Resume')}
          onClick={() => {
            actions.openResumeWizard();
            actions.closeMenus();
          }}
        >
          💾 Download Resume
        </div>
        {EXTERNAL_LINKS.map(({ label, href }) => (
          <a key={label} className="start-item" role="menuitem" href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ))}
        <div className="start-sep" role="separator" />
        <div {...item('Shut Down')} onClick={actions.shutDown}>Shut Down...</div>
      </div>
    </div>
  );
}
