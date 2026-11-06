'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MakerMark } from '@/components/icons';
import { VISIBLE_PROJECTS } from '@/data/projects';
import { PROFILE } from '@/data/profile';

/*
 * The "Shubham Works" block shared by all the developer's sites (same wording and order
 * everywhere). Three looks of the same text:
 * - desktop: a slim pill in the bottom-left corner, behind windows; a click shows the links above
 *   it (`MadeByPill` with `className="made-by"`; it replaced a glass card, user's call Nov 2026);
 * - phone Home Screen page 1: the same pill above the Dock (`MadeByPill`, commented out for now);
 * - phone Home Screen page 2: a full-width widget (`MadeByWidget`).
 * Only the mark is orange; the rest is quiet text.
 */

/** The developer's other sites: personal projects with a live link, in data order. */
const OTHER_SITES = VISIBLE_PROJECTS.filter((p) => !p.company && p.liveUrl);

const BRAND = 'A Shubham Works project';

function Mark({ size = 20 }: { size?: number }) {
  return (
    <span className="made-by-mark">
      <MakerMark size={size} />
    </span>
  );
}

/** "Made by" and "Also:" lines. */
function Details() {
  return (
    <>
      <p>Made by {PROFILE.name}</p>
      <p>
        Also:{' '}
        {OTHER_SITES.map((site, i) => (
          <span key={site.name}>
            {i > 0 && ', '}
            <a
              href={site.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${site.name} (opens in a new tab)`}
            >
              {site.name} &#8599;
            </a>
          </span>
        ))}
      </p>
    </>
  );
}

/**
 * A slim pill; clicking it shows "Made by" and the links above it. `made-by` places it in the
 * desktop's bottom-left corner, `home-pill` above the phone Dock.
 */
export function MadeByPill({ className = 'home-pill' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  // Tapping anywhere else or pressing Escape closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`${className} sw-block`} ref={rootRef}>
      <div className="home-pill-panel sw-glass" id={panelId} hidden={!open}>
        <Details />
      </div>
      <button
        type="button"
        className="home-pill-button sw-glass"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <Mark />
        {BRAND}
      </button>
    </div>
  );
}

/** Phone Home Screen, page 2: a full-width widget with a large Dial tile. */
export function MadeByWidget() {
  return (
    <section className="sw-widget sw-block sw-glass" aria-label="Shubham Works">
      <span className="sw-widget-tile">
        <MakerMark size={32} />
      </span>
      <p className="sw-widget-title">{BRAND}</p>
      <Details />
    </section>
  );
}
