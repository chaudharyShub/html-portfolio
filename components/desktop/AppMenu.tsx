'use client';

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

/**
 * The logo menu: a drop-down under the menu-bar logo on desktop, an action sheet on phones.
 * Opened by the logo (desktop) or the dock's "More" button (phones).
 */
export function AppMenu() {
  const { menuOpen } = useOsState();
  const actions = useOsActions();

  const item = (label: string) =>
    ({ className: 'menu-item', ...pressableProps, role: 'menuitem', 'aria-label': label }) as const;

  return (
    <>
      <div className={`menu-scrim${menuOpen ? ' open' : ''}`} aria-hidden="true" />
      <div className={`app-menu${menuOpen ? ' open' : ''}`} id="logo-menu" role="menu" aria-label="Shubham menu">
        {/* On phones the list scrolls inside its own rounded box, with Cancel in a separate box below. */}
        <div className="menu-list">
          <div className="menu-group">
            {SECTION_ITEMS.map(({ id, label }) => (
              <div key={id} {...item(label)} onClick={() => actions.goToSection(id)}>
                {label}
              </div>
            ))}
          </div>
          <div className="menu-sep" role="separator" />
          <div className="menu-group">
            <div
              {...item('Terminal')}
              onClick={() => {
                actions.openTerminal();
                actions.closeMenus();
              }}
            >
              Terminal
            </div>
            <div
              {...item('Debug Runner (game)')}
              onClick={() => {
                actions.openGame();
                actions.closeMenus();
              }}
            >
              Debug Runner (game)
            </div>
          </div>
          <div className="menu-sep" role="separator" />
          <div className="menu-group">
            <div
              {...item('System Settings')}
              onClick={() => {
                actions.openDialog('settings');
                actions.closeMenus();
              }}
            >
              System Settings…
            </div>
          </div>
          <div className="menu-sep" role="separator" />
          <div className="menu-group">
            <div
              {...item('Download Resume')}
              onClick={() => {
                actions.openResumeWizard();
                actions.closeMenus();
              }}
            >
              Download Resume
            </div>
            {EXTERNAL_LINKS.map(({ label, href }) => (
              <a key={label} className="menu-item" role="menuitem" href={href} target="_blank" rel="noopener noreferrer">
                {label} <span className="menu-item-hint">↗</span>
              </a>
            ))}
          </div>
          <div className="menu-sep" role="separator" />
          <div className="menu-group">
            <div {...item('Shut Down')} onClick={actions.shutDown}>
              Shut Down…
            </div>
          </div>
        </div>
        <div className="menu-group menu-cancel">
          <div {...item('Cancel')} onClick={actions.closeMenus}>
            Cancel
          </div>
        </div>
      </div>
    </>
  );
}
