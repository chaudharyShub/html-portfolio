'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { PROFILE_LINKS } from '@/data/profile';
import { pressableProps } from '@/lib/a11y';
import type { SectionId } from '@/lib/sections';

const SECTION_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'about', label: 'About Me' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
];

/**
 * The logo menu: a drop-down under the menu-bar logo on desktop, an action sheet on phones.
 * Opened by the logo (desktop) or the dock's "More" button (phones).
 */
export function AppMenu() {
  const { menuOpen } = useOsState();
  const actions = useOsActions();
  // The "Links" submenu (computers only): where it sits, and whether to focus it (opened by keyboard).
  const [links, setLinks] = useState<{ top: number; left: number; focus: boolean } | null>(null);
  const [wasOpen, setWasOpen] = useState(menuOpen);
  const linksItemRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  // Closing the menu closes the submenu too.
  if (wasOpen !== menuOpen) {
    setWasOpen(menuOpen);
    if (!menuOpen) setLinks(null);
  }

  useEffect(() => {
    if (links?.focus) submenuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [links]);

  /** Opens the submenu beside the "Links" item, like a macOS submenu (kept on screen). */
  const openLinks = (focus: boolean) => {
    const item = linksItemRef.current;
    const menu = item?.closest('.app-menu');
    if (!item || !menu) return;
    const itemRect = item.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const height = PROFILE_LINKS.length * 26 + 10;
    setLinks({
      left: menuRect.right - 4,
      top: Math.max(8, Math.min(itemRect.top - 5, window.innerHeight - height - 8)),
      focus,
    });
  };

  const onLinksKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openLinks(true);
    }
  };

  const onSubmenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLinks(null);
      linksItemRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    }
  };

  const item = (label: string) =>
    ({ className: 'menu-item', ...pressableProps, role: 'menuitem', 'aria-label': label }) as const;

  return (
    <>
      <div className={`menu-scrim${menuOpen ? ' open' : ''}`} aria-hidden="true" />
      <div className={`app-menu${menuOpen ? ' open' : ''}`} id="logo-menu" role="menu" aria-label="Shubham menu">
        {/* On phones the list scrolls inside its own rounded box, with Cancel in a separate box below. */}
        <div
          className="menu-list"
          // Pointing at any other item closes the Links submenu, like on a Mac.
          onPointerOver={(e) => {
            const target = (e.target as HTMLElement).closest('.menu-item');
            if (target && target !== linksItemRef.current) setLinks(null);
          }}
        >
          <div className="menu-group">
            <div
              {...item('About This Developer')}
              onClick={() => {
                actions.openDialog('about');
                actions.closeMenus();
              }}
            >
              About This Developer
            </div>
          </div>
          {/* Phones only: computers have these in the menu bar and the window's sidebar. */}
          <div className="menu-sep menu-phone-only" role="separator" />
          <div className="menu-group menu-phone-only">
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
            <div
              {...item('Time Machine')}
              onClick={() => {
                actions.openDialog('timeMachine');
                actions.closeMenus();
              }}
            >
              Time Machine
            </div>
            <div
              {...item('Activity Monitor')}
              onClick={() => {
                actions.openDialog('activity');
                actions.closeMenus();
              }}
            >
              Activity Monitor
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
            {/* Computers only: phones have the Links icon on the Home Screen for these. */}
            <div
              ref={linksItemRef}
              className={`menu-item menu-item--profile-link${links ? ' menu-item--open' : ''}`}
              role="menuitem"
              tabIndex={0}
              aria-haspopup="menu"
              aria-expanded={links !== null}
              aria-controls="logo-menu-links"
              onPointerEnter={() => {
                if (!links) openLinks(false);
              }}
              onClick={(e) => {
                e.stopPropagation(); // the window click handler would close the whole menu
                if (!links) openLinks(false);
              }}
              onKeyDown={onLinksKeyDown}
            >
              Links <span className="menu-item-hint menu-item-chevron">›</span>
            </div>
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
      {/* Outside the menu: its scroll box (and blur) would clip it. */}
      {menuOpen && links && (
        <div
          ref={submenuRef}
          className="app-menu app-submenu open"
          id="logo-menu-links"
          role="menu"
          aria-label="Links"
          style={{ top: links.top, left: links.left }}
          onKeyDown={onSubmenuKeyDown}
        >
          {PROFILE_LINKS.map(({ id, label, href }) => (
            <a key={id} className="menu-item" role="menuitem" href={href} target="_blank" rel="noopener noreferrer">
              {label} <span className="menu-item-hint">↗</span>
            </a>
          ))}
        </div>
      )}
    </>
  );
}
