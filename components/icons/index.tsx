/**
 * Hand-drawn icons in an Apple-inspired style (not Apple assets): app tiles are a CSS
 * rounded square (see `.app-icon` in styles/desktop.css) holding a simple white glyph.
 * Decorative by default: callers provide visible text or an aria-label nearby.
 */

import type { ReactNode } from 'react';
import type { ProfileLinkId } from '@/data/profile';

const decorative = { 'aria-hidden': true, focusable: false } as const;

export type AppIconName = 'portfolio' | 'terminal' | 'game' | 'settings' | 'resume' | 'trash' | 'drive' | 'more' | 'timemachine' | 'activity' | 'links';

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
  timemachine: (
    <>
      <path d="M8.6 11.8A8.5 8.5 0 1 1 8 18.9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M5.4 10.6h6.4l-3.2 4z" fill="#fff" strokeLinejoin="round" />
      <path d="M16.5 11.3V16l3.3 2.3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  activity: (
    <>
      <rect x="6.5" y="7.5" width="19" height="17" rx="2.5" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.55" />
      <path d="M8 17.5h3.6l2-5.5 3.4 9 2.4-6.2 1.2 2.7H24" fill="none" stroke="#4be37a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  links: (
    <>
      <path d="M14.6 17.4a4.2 4.2 0 0 0 6 0l3.4-3.4a4.2 4.2 0 0 0-6-6l-1.6 1.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M17.4 14.6a4.2 4.2 0 0 0-6 0L8 18a4.2 4.2 0 0 0 6 6l1.6-1.6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
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

/**
 * Small tiles for the profile links in the Contact card: our own simple glyphs on a colored
 * tile (not the services' logos), drawn like the app tiles.
 */
const LINK_GLYPHS: Record<ProfileLinkId, ReactNode> = {
  github: (
    <path
      d="M12 10.5L6.5 16l5.5 5.5M20 10.5l5.5 5.5-5.5 5.5M17.6 8.5l-3.2 15"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  linkedin: (
    <>
      <path d="M12.5 11V9.2c0-.9.7-1.6 1.6-1.6h3.8c.9 0 1.6.7 1.6 1.6V11" fill="none" stroke="#fff" strokeWidth="2" />
      <rect x="6.5" y="11" width="19" height="13.5" rx="2.5" fill="#fff" />
      <path d="M6.5 17h19" stroke="#0a66c2" strokeWidth="1.4" />
    </>
  ),
  devto: (
    <>
      <rect x="8" y="6.5" width="16" height="19" rx="2.5" fill="#fff" />
      <path d="M11.5 12h9M11.5 16h9M11.5 20h5.5" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  hashnode: (
    <path
      d="M13.5 7.5l-2 17M20.5 7.5l-2 17M8.5 12.5h16M7.5 19.5h16"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  ),
  instagram: (
    <>
      <rect x="7.5" y="7.5" width="17" height="17" rx="5" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="#fff" strokeWidth="2.2" />
      <circle cx="21.2" cy="10.8" r="1.3" fill="#fff" />
    </>
  ),
};

export function LinkTile({ id, size = 30 }: { id: ProfileLinkId; size?: number }) {
  return (
    <span className={`app-icon link-tile--${id}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 32 32" width="100%" height="100%" focusable="false">
        {LINK_GLYPHS[id]}
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

/**
 * Symbols for the window buttons (close / minimize / full screen). Each is drawn on the
 * button's own 12x12 grid around its center, so it sits dead center at any zoom.
 */
export type WindowGlyphName = 'close' | 'minimize' | 'zoom';

const WINDOW_GLYPHS: Record<WindowGlyphName, ReactNode> = {
  close: <path d="M3.75 3.75l4.5 4.5M8.25 3.75l-4.5 4.5" />,
  minimize: <rect className="fill" x="2.75" y="5.45" width="6.5" height="1.1" rx="0.55" />,
  zoom: (
    <>
      <path className="fill" d="M3.6 3.6h3.2L3.6 6.8z" />
      <path className="fill" d="M8.4 8.4H5.2l3.2-3.2z" />
    </>
  ),
};

export function WindowGlyph({ name }: { name: WindowGlyphName }) {
  return (
    <svg className="tl-glyph" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {WINDOW_GLYPHS[name]}
    </svg>
  );
}

export type TabGlyphName = 'home' | 'about' | 'projects' | 'skills' | 'writing' | 'contact';

/** Filled shapes: same outline (so the size matches), solid inside. */
const solid = { ...line, fill: 'currentColor' } as const;
/** Inside a mask: black hides, so these lines are cut out of a filled shape. */
const cut = { ...line, stroke: '#000' } as const;

/** One cut-out mask per glyph that needs one (there is a single tab bar, so the ids are unique). */
function CutMask({ id, children }: { id: string; children: ReactNode }) {
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
      <rect width="24" height="24" fill="#fff" />
      {children}
    </mask>
  );
}

const TAB_GLYPHS: Record<TabGlyphName, { line: ReactNode; fill: ReactNode }> = {
  home: {
    line: <path d="M4 11.2L12 4.5l8 6.7V20h-5.2v-5.4H9.2V20H4z" {...line} />,
    // The door is a notch in the outline, so it stays open when filled.
    fill: <path d="M4 11.2L12 4.5l8 6.7V20h-5.2v-5.4H9.2V20H4z" {...solid} />,
  },
  about: {
    line: (
      <>
        <circle cx="12" cy="8.5" r="3.8" {...line} />
        <path d="M4.8 20c.8-3.9 3.7-6 7.2-6s6.4 2.1 7.2 6" {...line} />
      </>
    ),
    fill: (
      <>
        <circle cx="12" cy="8.5" r="3.8" {...solid} />
        <path d="M4.8 20c.8-3.9 3.7-6 7.2-6s6.4 2.1 7.2 6z" {...solid} />
      </>
    ),
  },
  projects: {
    line: (
      <>
        <rect x="3.5" y="7" width="17" height="12.5" rx="2.5" {...line} />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17" {...line} />
      </>
    ),
    fill: (
      <>
        <CutMask id="tab-cut-projects">
          <path d="M2 12.5h20" {...cut} />
        </CutMask>
        <rect x="3.5" y="7" width="17" height="12.5" rx="2.5" {...solid} mask="url(#tab-cut-projects)" />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" {...line} />
      </>
    ),
  },
  skills: {
    line: <path d="M12 3.8l2.4 5 5.4.7-4 3.8 1 5.4L12 16.1l-4.8 2.6 1-5.4-4-3.8 5.4-.7z" {...line} />,
    fill: <path d="M12 3.8l2.4 5 5.4.7-4 3.8 1 5.4L12 16.1l-4.8 2.6 1-5.4-4-3.8 5.4-.7z" {...solid} />,
  },
  // A pencil; the band below the eraser is cut out when filled.
  writing: {
    line: (
      <>
        <path d="M4.5 19.5l1-4.3L15.6 5.1a2 2 0 0 1 2.8 0l.5.5a2 2 0 0 1 0 2.8L8.8 18.5z" {...line} />
        <path d="M13.6 7.1l3.3 3.3" {...line} />
      </>
    ),
    fill: (
      <>
        <CutMask id="tab-cut-writing">
          <path d="M13.6 7.1l3.3 3.3" {...cut} />
        </CutMask>
        <path
          d="M4.5 19.5l1-4.3L15.6 5.1a2 2 0 0 1 2.8 0l.5.5a2 2 0 0 1 0 2.8L8.8 18.5z"
          {...solid}
          mask="url(#tab-cut-writing)"
        />
      </>
    ),
  },
  contact: {
    line: (
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" {...line} />
        <path d="M4.5 7l7.5 6 7.5-6" {...line} />
      </>
    ),
    fill: (
      <>
        <CutMask id="tab-cut-contact">
          <path d="M4.5 7l7.5 6 7.5-6" {...cut} />
        </CutMask>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" {...solid} mask="url(#tab-cut-contact)" />
      </>
    ),
  },
};

/**
 * Icons for the sections: outline, and on phones the selected tab shows the filled version
 * (like iOS tab bars; CSS picks which group shows).
 */
export function TabGlyph({ name }: { name: TabGlyphName }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className="tab-glyph" {...decorative}>
      <g className="tab-glyph-line">{TAB_GLYPHS[name].line}</g>
      <g className="tab-glyph-fill">{TAB_GLYPHS[name].fill}</g>
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

/** The status bar's like button: an outline heart, filled once liked (fill comes from CSS). */
export function HeartIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" className="heart-icon" {...decorative}>
      <path
        d="M8 13.6S2 10 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 4-6 7.6-6 7.6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
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

/**
 * The Shubham Works maker mark, the "Dial": a squared SW in a ring, shared by all the
 * developer's sites (CloudPrep's `MakerMark`, docs/SHUBHAM_WORKS.md in that repo). This is the
 * small version (thick ring, larger letters) for 16-24px; it takes the text colour.
 */
export function MakerMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      {...decorative}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="24" r="21.5" strokeWidth="3" />
      <path
        d="M22.5 19.5H13a2 2 0 0 0-2 2V22a2 2 0 0 0 2 2h7.5a2 2 0 0 1 2 2v.5a2 2 0 0 1-2 2H11M25.5 19.5v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7M31.5 22v6.5"
        strokeWidth="2.5"
        transform="translate(24 24) scale(1.18) translate(-24.25 -24)"
      />
    </svg>
  );
}
