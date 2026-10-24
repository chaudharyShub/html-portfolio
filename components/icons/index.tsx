/**
 * Hand-drawn icons in an Apple-inspired style (not Apple assets): app tiles are a CSS
 * rounded square (see `.app-icon` in styles/desktop.css) holding a simple white glyph.
 * Decorative by default: callers provide visible text or an aria-label nearby.
 */

import type { ReactNode } from 'react';

const decorative = { 'aria-hidden': true, focusable: false } as const;

export type AppIconName = 'portfolio' | 'terminal' | 'game' | 'settings' | 'resume' | 'trash' | 'drive' | 'more';

const GLYPHS: Record<AppIconName, ReactNode> = {
  portfolio: (
    <>
      <circle cx="16" cy="12.5" r="4.6" fill="#fff" />
      <path d="M7.5 25.5c.9-4.6 4.3-7.2 8.5-7.2s7.6 2.6 8.5 7.2" fill="#fff" />
    </>
  ),
  terminal: (
    <>
      <path d="M8.5 11.5l5 4.5-5 4.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 21.5h7.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  game: (
    <>
      <ellipse cx="16" cy="18" rx="6" ry="7" fill="#fff" />
      <circle cx="16" cy="9.5" r="3.4" fill="#fff" />
      <path d="M10 14.5l-3.5-2M22 14.5l3.5-2M9.5 19H5.5M22.5 19h4M10.5 23.5l-3 2.5M21.5 23.5l3 2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 12.5v12" stroke="#2f9e44" strokeWidth="1.4" />
    </>
  ),
  settings: (
    <>
      <g fill="#fff">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <rect key={deg} x="14.3" y="4.6" width="3.4" height="5" rx="1.1" transform={`rotate(${deg} 16 16)`} />
        ))}
      </g>
      <circle cx="16" cy="16" r="8.2" fill="#fff" />
      <circle cx="16" cy="16" r="5.6" fill="#8e8e93" />
      <circle cx="16" cy="16" r="3.1" fill="#fff" />
    </>
  ),
  resume: (
    <>
      <path d="M10 6.5h8.5l4.5 4.5v14.5H10z" fill="#fff" />
      <path d="M18.5 6.5V11H23" fill="none" stroke="#d0d7e2" strokeWidth="1.2" />
      <path d="M16.5 13.5v7.5M13.4 18l3.1 3.2 3.1-3.2" fill="none" stroke="#e8590c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  trash: (
    <>
      <path d="M9.5 11h13l-1.2 15h-10.6z" fill="#fff" />
      <path d="M8 9.2h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 9V7.4h5V9" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="M13.3 13.5l.5 10M16 13.5v10M18.7 13.5l-.5 10" stroke="#aab4c3" strokeWidth="1.2" />
    </>
  ),
  drive: (
    <>
      <rect x="6" y="11" width="20" height="11" rx="2.5" fill="#fff" />
      <circle cx="22" cy="18.5" r="1.3" fill="#34c759" />
      <path d="M9 18.5h8" stroke="#aab4c3" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  more: (
    <>
      <circle cx="9.5" cy="16" r="2.4" fill="#fff" />
      <circle cx="16" cy="16" r="2.4" fill="#fff" />
      <circle cx="22.5" cy="16" r="2.4" fill="#fff" />
    </>
  ),
};

/** App tile: rounded square with the app's color (CSS) and a white glyph. */
export function AppIcon({ name, size = 48 }: { name: AppIconName; size?: number }) {
  return (
    <span className={`app-icon app-icon--${name}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="100%" height="100%" focusable="false">
        {GLYPHS[name]}
      </svg>
    </span>
  );
}

/** Menu-bar logo: a little monitor that winks (same idea as the favicon). Uses currentColor. */
export function BrandMark() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" {...decorative}>
      <rect x="2" y="2.5" width="16" height="11.5" rx="2.5" fill="currentColor" />
      <rect x="7" y="15" width="6" height="1.6" rx=".6" fill="currentColor" />
      <rect x="5" y="16.8" width="10" height="1.4" rx=".7" fill="currentColor" />
      <circle cx="7.3" cy="7" r="1.2" fill="var(--menubar-bg-solid, #fff)" />
      <path d="M11.4 7.1h2.4M7 10.1c1.6 1.4 4.4 1.4 6 0" stroke="var(--menubar-bg-solid, #fff)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ===== Line glyphs (currentColor) ===== */

const line = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export type TabGlyphName = 'home' | 'about' | 'projects' | 'contact';

/** Icons for the iOS tab bar (hidden on desktop). */
export function TabGlyph({ name }: { name: TabGlyphName }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="tab-glyph" {...decorative}>
      {name === 'home' && <path d="M4 11.2L12 4.5l8 6.7V20h-5.2v-5.4H9.2V20H4z" {...line} />}
      {name === 'about' && (
        <>
          <circle cx="12" cy="8.5" r="3.8" {...line} />
          <path d="M4.8 20c.8-3.9 3.7-6 7.2-6s6.4 2.1 7.2 6" {...line} />
        </>
      )}
      {name === 'projects' && (
        <>
          <rect x="3.5" y="7" width="17" height="12.5" rx="2.5" {...line} />
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17" {...line} />
        </>
      )}
      {name === 'contact' && (
        <>
          <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" {...line} />
          <path d="M4.5 7l7.5 6 7.5-6" {...line} />
        </>
      )}
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" {...decorative}>
      <path d="M8 2v8M4.5 6.8L8 10.3l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The bugs in the Debug Runner game. */
export function BugIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...decorative}>
      <ellipse cx="12" cy="14" rx="5" ry="6" fill="#34c759" />
      <circle cx="12" cy="7" r="3" fill="#30a14e" />
      <path d="M7 11L4 9M17 11l3-2M7 15H3.5M17 15h3.5M7.5 18.5L5 21M16.5 18.5L19 21" stroke="#1f7a35" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ===== Alert icons ===== */

export type DialogIconType = 'info' | 'warning' | 'error' | 'forbidden' | 'question';

export function DialogIcon({ type }: { type: DialogIconType }) {
  const red = type === 'error' || type === 'forbidden';
  return (
    <svg viewBox="0 0 48 48" width="56" height="56" className="dialog-glyph" {...decorative}>
      {type === 'warning' ? (
        <>
          <path d="M24 5L44.5 41h-41z" fill="#ffcc00" stroke="#e0a800" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M24 18v11" stroke="#1d1d1f" strokeWidth="3.4" strokeLinecap="round" />
          <circle cx="24" cy="35" r="2.1" fill="#1d1d1f" />
        </>
      ) : (
        <>
          <circle cx="24" cy="24" r="21" fill={red ? '#ff3b30' : '#0a84ff'} />
          {type === 'info' && (
            <>
              <circle cx="24" cy="14.5" r="2.6" fill="#fff" />
              <path d="M24 21.5v14" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </>
          )}
          {type === 'question' && (
            <path d="M18.5 18.5a5.6 5.6 0 1 1 7.9 5.1c-1.6.8-2.4 1.8-2.4 3.6v1.3M24 35.2v.3" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
          )}
          {type === 'error' && <path d="M17 17l14 14M31 17L17 31" stroke="#fff" strokeWidth="4" strokeLinecap="round" />}
          {type === 'forbidden' && <path d="M14 24h20" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" />}
        </>
      )}
    </svg>
  );
}
