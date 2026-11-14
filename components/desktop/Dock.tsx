'use client';

import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { AppIcon, type AppIconName } from '@/components/icons';
import { useOsApi, useOsState, type DialogId, type OsActions } from '@/components/os/OsProvider';
import { isPhoneLayout, prefersReducedMotion } from '@/lib/motion';

/** Largest icon scale right under the pointer, and how far (px) the magnification reaches. */
const MAX_SCALE = 1.6;
const REACH = 150;
/** How long a Dock tile takes to slide out when its app closes (matches dockItemOut in desktop.css). */
const LEAVE_MS = 280;

/** The Dock button each app bounces when it opens (`dock-terminal` is handled with its window). */
const DOCK_BUTTONS: Partial<Record<DialogId, string>> = {
  activity: 'dock-activity',
  settings: 'dock-settings',
  wizard: 'dock-resume',
  trash: 'dock-trash',
  game: 'dock-game',
  timeMachine: 'dock-timemachine',
  writing: 'dock-writing',
};

/** Apps that aren't kept in the Dock: they get a tile there only while open, like on a Mac. */
const VISITING_APPS: { dialog: DialogId; id: string; label: string; icon: AppIconName; open: (a: OsActions) => void }[] = [
  { dialog: 'game', id: 'dock-game', label: 'Debug Runner', icon: 'game', open: (a) => a.openGame() },
  { dialog: 'timeMachine', id: 'dock-timemachine', label: 'Time Machine', icon: 'timemachine', open: (a) => a.openDialog('timeMachine') },
  { dialog: 'writing', id: 'dock-writing', label: 'Writing', icon: 'writing', open: (a) => a.toggleDialogFromDock('writing') },
];

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
  /** A visiting app's tile: slides in when it appears, out when `leaving`. */
  visiting?: boolean;
  leaving?: boolean;
  /** The pointer rests on it (used to get a minimized app's way back ready). */
  onRest?: () => void;
}

/** How long the pointer rests on a Dock icon before the genie's copies are prepared. */
const REST_MS = 80;

function DockItem({ id, label, icon, running, only, onClick, buttonRef, pressed, visiting, leaving, onRest }: ItemProps) {
  const restTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(restTimer.current), []);
  const classes = ['dock-item', only && `dock-${only}-only`, visiting && 'dock-item--visiting', leaving && 'dock-item--leaving'];
  return (
    <li className={classes.filter(Boolean).join(' ')}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        className="dock-button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        onPointerEnter={
          onRest
            ? () => {
                window.clearTimeout(restTimer.current);
                restTimer.current = window.setTimeout(onRest, REST_MS);
              }
            : undefined
        }
        onPointerLeave={() => window.clearTimeout(restTimer.current)}
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
    // A tile came or went: measure the resting layout again on the next move.
    const changes = new MutationObserver(() => {
      centers = null;
    });
    changes.observe(list, { childList: true });
    list.addEventListener('mousemove', onMove);
    list.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);
    return () => {
      onLeave();
      changes.disconnect();
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
  // Resting on a minimized app's icon builds its genie copies ahead, so the click starts at once.
  const restFor = (dialog: DialogId) => (dialogs[dialog] ? () => actions.preparePanelRestore(dialog) : undefined);
  const prevTerminal = useRef(windows.terminal);
  const prevDialogs = useRef(dialogs);
  const listRef = useRef<HTMLUListElement>(null);
  useMagnification(listRef);

  // Visiting tiles of apps that just closed stay a moment to slide out.
  const [leaving, setLeaving] = useState<DialogId[]>([]);
  const [shownDialogs, setShownDialogs] = useState(dialogs);
  if (shownDialogs !== dialogs) {
    const closed = VISITING_APPS.filter((app) => shownDialogs[app.dialog] && !dialogs[app.dialog]).map((app) => app.dialog);
    setShownDialogs(dialogs);
    const next = [...leaving.filter((d) => !dialogs[d]), ...(prefersReducedMotion() ? [] : closed)];
    if (next.length !== leaving.length || next.some((d, i) => d !== leaving[i])) setLeaving(next);
  }
  useEffect(() => {
    if (!leaving.length) return;
    const timer = window.setTimeout(() => setLeaving([]), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // An app's icon bounces when it launches from closed (from the Dock, the desktop or a menu).
  useEffect(() => {
    if (prevTerminal.current === 'closed' && windows.terminal === 'open') bounce(actions.getDockIcon('terminal'));
    prevTerminal.current = windows.terminal;
  }, [windows.terminal, actions]);
  useEffect(() => {
    for (const [dialog, id] of Object.entries(DOCK_BUTTONS)) {
      const key = dialog as DialogId;
      if (!prevDialogs.current[key] && dialogs[key]) bounce(document.getElementById(id));
    }
    prevDialogs.current = dialogs;
  }, [dialogs]);

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
          id="dock-activity"
          label="Activity Monitor"
          icon="activity"
          only="mac"
          running={dialogs.activity}
          onClick={() => actions.toggleDialogFromDock('activity')}
          onRest={restFor('activity')}
        />
        <DockItem
          id="dock-settings"
          label="Settings"
          icon="settings"
          running={dialogs.settings}
          onClick={() => actions.openDialog('settings')}
        />
        <DockItem id="dock-resume" label="Resume" icon="resume" only="mac" running={dialogs.wizard} onClick={actions.openResumeWizard} />
        {VISITING_APPS.filter((app) => dialogs[app.dialog] || leaving.includes(app.dialog)).map((app) => (
          <DockItem
            key={app.id}
            id={app.id}
            label={app.label}
            icon={app.icon}
            only="mac"
            visiting
            leaving={!dialogs[app.dialog]}
            running={dialogs[app.dialog]}
            onRest={restFor(app.dialog)}
            // Already open: Writing goes to the Dock and back like the windows; the others only come
            // back if minimized (a running game isn't restarted).
            onClick={() => (dialogs[app.dialog] && app.dialog === 'game' ? undefined : app.open(actions))}
          />
        ))}
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
        <DockItem id="dock-trash" label="Trash" icon="trash" only="mac" running={dialogs.trash} onClick={() => actions.openDialog('trash')} />
      </ul>
    </nav>
  );
}
