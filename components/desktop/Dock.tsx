'use client';

import { useEffect, useRef, type MouseEvent } from 'react';
import { AppIcon, type AppIconName } from '@/components/icons';
import { useOsApi, useOsState } from '@/components/os/OsProvider';
import { prefersReducedMotion } from '@/lib/motion';

/** The little hop a dock icon does while its app launches. */
function bounce(el: HTMLElement | null) {
  if (!el || prefersReducedMotion()) return;
  el.animate(
    [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-22px)', offset: 0.25 },
      { transform: 'translateY(0)', offset: 0.5 },
      { transform: 'translateY(-10px)', offset: 0.72 },
      { transform: 'translateY(0)' },
    ],
    { duration: 900, easing: 'ease-in-out' },
  );
}

interface ItemProps {
  id: string;
  label: string;
  icon: AppIconName;
  running?: boolean;
  /** 'mac' items are hidden on phones, 'ios' items on desktop. */
  only?: 'mac' | 'ios';
  onClick: (e: MouseEvent) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
  pressed?: boolean;
}

function DockItem({ id, label, icon, running, only, onClick, buttonRef, pressed }: ItemProps) {
  return (
    <li className={`dock-item${only ? ` dock-${only}-only` : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        className="dock-button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
      >
        <AppIcon name={icon} size={48} />
      </button>
      <span className="dock-label" aria-hidden="true">
        {label}
      </span>
      <span className={`dock-dot${running ? ' on' : ''}`} aria-hidden="true" />
    </li>
  );
}

/** macOS Dock on desktop (magnifies under the pointer); the iOS dock on phones. */
export function Dock() {
  const { actions, connect } = useOsApi();
  const { windows, dialogs, menuOpen } = useOsState();
  const prev = useRef({ dos: windows.dos, game: dialogs.game });

  // Bounce an icon when its app launches from closed.
  useEffect(() => {
    if (prev.current.dos === 'closed' && windows.dos === 'open') bounce(actions.getDockIcon('dos'));
    if (!prev.current.game && dialogs.game) bounce(document.getElementById('dock-game'));
    prev.current = { dos: windows.dos, game: dialogs.game };
  }, [windows.dos, dialogs.game, actions]);

  return (
    <nav className="dock" aria-label="Dock">
      <ul className="dock-list">
        <DockItem
          id="taskbar-window-btn"
          label="Shubham"
          icon="portfolio"
          running={windows.main !== 'closed'}
          pressed={windows.main === 'open'}
          buttonRef={connect.mainDockIcon}
          onClick={actions.toggleMain}
        />
        <DockItem
          id="taskbar-dos-btn"
          label="Terminal"
          icon="terminal"
          running={windows.dos !== 'closed'}
          pressed={windows.dos === 'open'}
          buttonRef={connect.dosDockIcon}
          onClick={() => (windows.dos === 'closed' ? actions.openDos() : actions.toggleDos())}
        />
        <DockItem
          id="dock-game"
          label="Debug Runner"
          icon="game"
          only="mac"
          running={dialogs.game}
          onClick={actions.openGame}
        />
        <DockItem id="dock-settings" label="Settings" icon="settings" onClick={() => actions.openDialog('display')} />
        <DockItem id="dock-resume" label="Resume" icon="resume" only="mac" onClick={actions.openResumeWizard} />
        <DockItem
          id="dock-more"
          label="More"
          icon="more"
          only="ios"
          pressed={menuOpen}
          onClick={(e) => {
            e.stopPropagation(); // keep the window click handler from closing the sheet at once
            actions.toggleMenu();
          }}
        />
        <li className="dock-sep dock-mac-only" aria-hidden="true" />
        <DockItem id="dock-trash" label="Trash" icon="trash" only="mac" onClick={() => actions.openDialog('recycleBin')} />
      </ul>
    </nav>
  );
}
