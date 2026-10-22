/**
 * Hand-drawn Win95-style SVG icons (ported 1:1 from the original markup).
 * Decorative by default: callers provide visible text or an aria-label nearby.
 */

interface IconProps {
  size?: number;
}

const decorative = { 'aria-hidden': true, focusable: false } as const;

export function RecycleBinIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...decorative}>
      <rect x="8" y="6" width="16" height="3" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="12" y="3" width="8" height="3" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <path d="M10 10 L11 27 L21 27 L22 10 Z" fill="#e8e8e8" stroke="#000" strokeWidth="1" />
      <line x1="14" y1="12" x2="14.5" y2="25" stroke="#808080" strokeWidth="1" />
      <line x1="16" y1="12" x2="16" y2="25" stroke="#808080" strokeWidth="1" />
      <line x1="18" y1="12" x2="17.5" y2="25" stroke="#808080" strokeWidth="1" />
    </svg>
  );
}

export function MyComputerIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...decorative}>
      <rect x="4" y="5" width="24" height="17" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="6" y="7" width="20" height="12" fill="#1084d0" stroke="#000060" strokeWidth="1" />
      <rect x="12" y="22" width="8" height="3" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="9" y="25" width="14" height="2" fill="#808080" stroke="#000" strokeWidth="1" />
    </svg>
  );
}

/** The Debug Runner bug (desktop icon and in-game enemy). */
export function BugIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...decorative}>
      <ellipse cx="16" cy="18" rx="8" ry="9" fill="#33aa33" stroke="#003300" strokeWidth="1" />
      <circle cx="16" cy="8" r="4" fill="#33aa33" stroke="#003300" strokeWidth="1" />
      <line x1="8" y1="12" x2="3" y2="8" stroke="#003300" strokeWidth="1.5" />
      <line x1="24" y1="12" x2="29" y2="8" stroke="#003300" strokeWidth="1.5" />
      <line x1="6" y1="18" x2="1" y2="18" stroke="#003300" strokeWidth="1.5" />
      <line x1="26" y1="18" x2="31" y2="18" stroke="#003300" strokeWidth="1.5" />
      <line x1="7" y1="24" x2="2" y2="28" stroke="#003300" strokeWidth="1.5" />
      <line x1="25" y1="24" x2="30" y2="28" stroke="#003300" strokeWidth="1.5" />
      <circle cx="13" cy="7" r="1" fill="#000" />
      <circle cx="19" cy="7" r="1" fill="#000" />
    </svg>
  );
}

export function DosDesktopIcon({ size = 32 }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} {...decorative}>
      <rect x="3" y="4" width="26" height="19" fill="#000" stroke="#000" strokeWidth="1.5" />
      <text x="6" y="17" fontFamily="Courier New" fontSize="9" fill="#33ff33">
        {'C:\\>_'}
      </text>
      <rect x="3" y="25" width="26" height="3" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
    </svg>
  );
}

/** Small DOS icon for the title bar and taskbar. */
export function DosSmallIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" {...decorative}>
      <rect x="1" y="1" width="14" height="11" fill="#000" stroke="#000" strokeWidth="1" />
      <text x="2.5" y="9.5" fontFamily="Courier New" fontSize="6.5" fill="#33ff33">
        {'C:\\>'}
      </text>
    </svg>
  );
}

/** "Shubham.exe" document icon for the title bar and taskbar. */
export function DocumentIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" {...decorative}>
      <rect x="2" y="1" width="10" height="14" fill="#fff" stroke="#000" strokeWidth="1" />
      <polygon points="9,1 12,1 12,4" fill="#c0c0c0" stroke="#000" strokeWidth="0.5" />
      <line x1="4" y1="6" x2="10" y2="6" stroke="#000" strokeWidth="0.7" />
      <line x1="4" y1="8" x2="10" y2="8" stroke="#000" strokeWidth="0.7" />
    </svg>
  );
}

export function StartLogo() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" {...decorative}>
      <rect x="0" y="0" width="7" height="7" fill="#ff4444" />
      <rect x="8" y="0" width="7" height="7" fill="#33cc33" />
      <rect x="0" y="8" width="7" height="7" fill="#3399ff" />
      <rect x="8" y="8" width="7" height="7" fill="#ffcc00" />
    </svg>
  );
}

export function DisplayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...decorative}>
      <rect x="2" y="3" width="20" height="14" fill="#1084d0" stroke="#000" strokeWidth="1" />
      <rect x="8" y="19" width="8" height="2" fill="#808080" />
    </svg>
  );
}

export function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...decorative}>
      <path d="M12 4 A8 8 0 1 1 4.5 8" fill="none" stroke="#000" strokeWidth="2" />
      <polygon points="4,3 4,9 9,6" fill="#000" />
    </svg>
  );
}

export function ArrangeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" {...decorative}>
      <rect x="1" y="1" width="6" height="6" fill="#000" />
      <rect x="9" y="1" width="6" height="6" fill="#000" />
      <rect x="1" y="9" width="6" height="6" fill="#000" />
      <rect x="9" y="9" width="6" height="6" fill="#000" />
    </svg>
  );
}

export function PropertiesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" {...decorative}>
      <circle cx="12" cy="12" r="10" fill="#1084d0" stroke="#000060" strokeWidth="1" />
      <rect x="11" y="10" width="2" height="7" fill="#fff" />
      <rect x="11" y="6" width="2" height="2" fill="#fff" />
    </svg>
  );
}

export function NewDocumentIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" {...decorative}>
      <rect x="2" y="1" width="10" height="14" fill="#fff" stroke="#000" strokeWidth="0.5" />
      <polygon points="9,1 12,1 12,4" fill="#c0c0c0" stroke="#000" strokeWidth="0.5" />
    </svg>
  );
}

export function FloppyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...decorative}>
      <rect x="3" y="3" width="18" height="18" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
      <rect x="6" y="3" width="9" height="6" fill="#fff" stroke="#000" strokeWidth="1" />
      <rect x="6" y="14" width="12" height="6" fill="#fff" stroke="#000" strokeWidth="1" />
      <rect x="14" y="4" width="2" height="4" fill="#000" />
    </svg>
  );
}

export function WizardDiskIcon() {
  return (
    <svg viewBox="0 0 36 36" width="56" height="56" {...decorative}>
      <rect x="2" y="2" width="32" height="32" rx="2" fill="#c0c0c0" stroke="#808080" strokeWidth="1.5" />
      <rect x="4" y="14" width="28" height="18" fill="#ffffff" stroke="#808080" strokeWidth="1" />
      <rect x="11" y="2" width="16" height="10" fill="#808080" stroke="#606060" strokeWidth="1" />
      <rect x="13" y="4" width="10" height="6" fill="#404040" />
      <rect x="4" y="30" width="4" height="4" fill="#a0a0a0" />
    </svg>
  );
}

/* ===== 40px dialog icons ===== */

export type DialogIconType = 'info' | 'warning' | 'error' | 'forbidden' | 'question';

export function DialogIcon({ type }: { type: DialogIconType }) {
  return (
    <svg viewBox="0 0 24 24" width="40" height="40" {...decorative}>
      {type === 'warning' && (
        <>
          <polygon points="12,2 22,20 2,20" fill="#ffcc00" stroke="#000" strokeWidth="1" />
          <rect x="11" y="9" width="2" height="6" fill="#000" />
          <rect x="11" y="16" width="2" height="2" fill="#000" />
        </>
      )}
      {type === 'error' && (
        <>
          <circle cx="12" cy="12" r="10" fill="#cc0000" stroke="#660000" strokeWidth="1" />
          <line x1="8" y1="8" x2="16" y2="16" stroke="#fff" strokeWidth="2.5" />
          <line x1="16" y1="8" x2="8" y2="16" stroke="#fff" strokeWidth="2.5" />
        </>
      )}
      {type === 'info' && (
        <>
          <circle cx="12" cy="12" r="10" fill="#1084d0" stroke="#000060" strokeWidth="1" />
          <rect x="11" y="10" width="2" height="7" fill="#fff" />
          <rect x="11" y="6" width="2" height="2" fill="#fff" />
        </>
      )}
      {type === 'forbidden' && (
        <>
          <circle cx="12" cy="12" r="10" fill="#cc0000" stroke="#660000" strokeWidth="1" />
          <rect x="5" y="10.5" width="14" height="3" fill="#fff" />
        </>
      )}
      {type === 'question' && (
        <>
          <circle cx="12" cy="12" r="10" fill="#1084d0" stroke="#000060" strokeWidth="1" />
          <text x="12" y="17" fontSize="13" fontFamily="Arial" fontWeight="bold" fill="#fff" textAnchor="middle">
            ?
          </text>
        </>
      )}
    </svg>
  );
}
