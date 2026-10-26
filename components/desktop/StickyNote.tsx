'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent } from 'react';

/** A little motto on the desktop; a different one each hour. */
const NOTES = [
  'Ship it, then make it better.',
  'Read the error message. Twice.',
  'Good UI is the one nobody notices.',
  'Leave the code cleaner than you found it.',
  'Small commits, big progress.',
  'Every bug is a lesson with a timestamp.',
];

const HOUR = 60 * 60 * 1000;

/** Counts hours on the visitor's own clock, so the note changes at 10:00, not at 10:30 in India. */
const getHour = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / HOUR);

function subscribeHour(onChange: () => void) {
  let timer = 0;
  const schedule = () => {
    const nextHour = new Date();
    nextHour.setMinutes(60, 0, 0);
    timer = window.setTimeout(() => {
      onChange();
      schedule();
    }, nextHour.getTime() - Date.now() + 50);
  };
  schedule();
  return () => window.clearTimeout(timer);
}
/** No note in the server HTML: which one shows depends on the visitor's clock. */
const getServerHour = () => -1;

/** Yellow sticky note on the desktop (draggable with a mouse); a widget on the phone Home Screen. */
export function StickyNote() {
  const hour = useSyncExternalStore(subscribeHour, getHour, getServerHour);
  const [position, setPosition] = useState({ left: 24, top: 20 });
  const detach = useRef<(() => void) | null>(null);

  useEffect(() => () => detach.current?.(), []);

  if (hour < 0) return null;

  const startDrag = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const note = e.currentTarget;
    const layer = note.offsetParent as HTMLElement | null;
    const offsetX = e.clientX - note.offsetLeft;
    const offsetY = e.clientY - note.offsetTop;
    const onMove = (ev: globalThis.MouseEvent) => {
      const maxLeft = (layer?.clientWidth ?? window.innerWidth) - note.offsetWidth;
      const maxTop = (layer?.clientHeight ?? window.innerHeight) - note.offsetHeight;
      setPosition({
        left: Math.max(0, Math.min(ev.clientX - offsetX, maxLeft)),
        top: Math.max(0, Math.min(ev.clientY - offsetY, maxTop)),
      });
    };
    const stop = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', stop);
      detach.current = null;
    };
    detach.current?.();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', stop);
    detach.current = stop;
  };

  return (
    <div className="sticky-note" style={position} role="note" aria-label="Sticky note" onMouseDown={startDrag}>
      <span className="sticky-note-tape" aria-hidden="true" />
      <p className="sticky-note-head">Note to self</p>
      <p className="sticky-note-text">{NOTES[hour % NOTES.length]}</p>
    </div>
  );
}
