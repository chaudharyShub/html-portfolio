'use client';

import { BrandMark } from '@/components/icons';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { useNow } from '@/lib/clock';

/** macOS-style menu bar (desktop only; phones already show the real iOS status bar). */
export function MenuBar() {
  const { menuOpen, windows } = useOsState();
  const actions = useOsActions();
  const now = useNow();
  const date = now === null ? null : new Date(now);
  const activeApp = windows.terminal === 'open' && windows.main !== 'open' ? 'Terminal' : 'Shubham';

  return (
    <div className="menubar">
      <button
        type="button"
        className={`menubar-item menubar-brand${menuOpen ? ' active' : ''}`}
        id="logo-menu-button"
        aria-label="Shubham menu"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls="logo-menu"
        onClick={(e) => {
          e.stopPropagation(); // the window click handler would immediately close it again
          actions.toggleMenu();
        }}
      >
        <BrandMark />
      </button>
      <span className="menubar-app">{activeApp}</span>
      <button type="button" className="menubar-item" onClick={() => actions.goToSection('about')}>
        About
      </button>
      <button type="button" className="menubar-item" onClick={() => actions.goToSection('projects')}>
        Projects
      </button>
      <button type="button" className="menubar-item" onClick={() => actions.goToSection('contact')}>
        Contact
      </button>
      <span className="menubar-clock" id="clock-behind">
        {date
          ? date.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
          : ''}
      </span>
    </div>
  );
}
