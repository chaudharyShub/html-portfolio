'use client';

import { useEffect, useRef, type MouseEvent, type RefObject } from 'react';
import { AppIcon, type AppIconName } from '@/components/icons';
import { useOsApi, useOsState } from '@/components/os/OsProvider';
import { isPhoneLayout, prefersReducedMotion } from '@/lib/motion';

/** Largest icon scale right under the pointer, and how far (px) the magnification reaches. */
const MAX_SCALE = 1.6;
const REACH = 150;

/** The little hop a dock icon does while its app launches (on the tile, so it never fights the magnification). */
function bounce(button: HTMLElement | null) {
  const el = button?.querySelector<HTMLElement>('.app-icon');
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

/**
 * macOS Dock magnification: each icon grows with how close the pointer is (a smooth cosine
 * falloff), and the dock widens with it. Distances are measured against the resting layout,
 * so growing icons never feed back into the math. Written to a CSS variable (--s) per item.
 */
function useMagnification(listRef: RefObject<HTMLUListElement | null>) {
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    let items: HTMLElement[] = [];
    let centers: number[] | null = null; // resting centers, relative to the screen's middle
    let pointerX = 0;
    let frame = 0;

    const measure = () => {
      items = [...list.querySelectorAll<HTMLElement>('.dock-item')].filter((el) => el.offsetWidth > 0);
      const middle = window.innerWidth / 2;
      centers = items.map((el) => {
        const r = el.getBoundingClientRect();
        return r.left + r.width / 2 - middle;
      });
    };
    const apply = () => {
      frame = 0;
      if (!centers) return;
      const x = pointerX - window.innerWidth / 2;
      items.forEach((el, i) => {
        const d = Math.abs(x - (centers?.[i] ?? 0));
        const s = d >= REACH ? 1 : 1 + ((MAX_SCALE - 1) * (Math.cos((d / REACH) * Math.PI) + 1)) / 2;
        el.style.setProperty('--s', s.toFixed(3));
      });
    };
    const onMove = (e: globalThis.MouseEvent) => {
      if (!canHover.matches || isPhoneLayout() || prefersReducedMotion()) return;
      if (!centers) measure();
      pointerX = e.clientX;
      list.classList.add('magnifying');
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      list.classList.remove('magnifying');
      items.forEach((el) => el.style.removeProperty('--s'));
    };
    const onResize = () => {
      onLeave();
      centers = null;
    };
    list.addEventListener('mousemove', onMove);
    list.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);
    return () => {
      onLeave();
      list.removeEventListener('mousemove', onMove);
      list.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, [listRef]);
}

/** macOS Dock on desktop (magnifies under the pointer); the iOS dock on phones. */
export function Dock() {
  const { actions, connect } = useOsApi();
  const { windows, dialogs, menuOpen } = useOsState();
  const prev = useRef({ terminal: windows.terminal, game: dialogs.game });
  const listRef = useRef<HTMLUListElement>(null);
  useMagnification(listRef);

  // Bounce an icon when its app launches from closed.
  useEffect(() => {
    if (prev.current.terminal === 'closed' && windows.terminal === 'open') bounce(actions.getDockIcon('terminal'));
    if (!prev.current.game && dialogs.game) bounce(document.getElementById('dock-game'));
    prev.current = { terminal: windows.terminal, game: dialogs.game };
  }, [windows.terminal, dialogs.game, actions]);

  return (
    <nav className="dock" aria-label="Dock">
      <ul ref={listRef} className="dock-list">
        <DockItem
          id="dock-portfolio"
          label="Shubham"
          icon="portfolio"
          running={windows.main !== 'closed'}
          pressed={windows.main === 'open'}
          buttonRef={connect.mainDockIcon}
          onClick={actions.toggleMain}
        />
        <DockItem
          id="dock-terminal"
          label="Terminal"
          icon="terminal"
          running={windows.terminal !== 'closed'}
          pressed={windows.terminal === 'open'}
          buttonRef={connect.terminalDockIcon}
          onClick={() => (windows.terminal === 'closed' ? actions.openTerminal() : actions.toggleTerminal())}
        />
        <DockItem
          id="dock-game"
          label="Debug Runner"
          icon="game"
          only="mac"
          running={dialogs.game}
          onClick={actions.openGame}
        />
        <DockItem
          id="dock-timemachine"
          label="Time Machine"
          icon="timemachine"
          only="mac"
          running={dialogs.timeMachine}
          onClick={() => actions.openDialog('timeMachine')}
        />
        <DockItem id="dock-settings" label="Settings" icon="settings" onClick={() => actions.openDialog('settings')} />
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
        <DockItem id="dock-trash" label="Trash" icon="trash" only="mac" onClick={() => actions.openDialog('trash')} />
      </ul>
    </nav>
  );
}
