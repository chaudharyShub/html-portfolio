import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from '@/lib/storage';

/**
 * Keeps the site owner's own visits out of Vercel Analytics and Speed Insights.
 *
 * Opening the site with the secret token after `#` marks that browser as the owner's; adding
 * `.on` to it undoes that. Only the token's SHA-256 is here, so reading this code doesn't reveal
 * it, and the browser stores the token itself (checked on every visit), so a hand-made
 * localStorage value doesn't work either. The part after `#` is never sent to a server.
 */
const OWNER_TOKEN_SHA256 = '00ad41f213985ec4c69bf6fd3eb60c220399829190ca21e5c4001ddfc9dbe05b';
const TURN_ON_SUFFIX = '.on';

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function matchesToken(token: string, hash: string = OWNER_TOKEN_SHA256): Promise<boolean> {
  return token.length > 0 && (await sha256Hex(token)) === hash;
}

let pending: Promise<boolean> | null = null;

/**
 * True when this browser belongs to the owner. Handles the secret link first, if present.
 * Checks running at the same time share one result, so the link is handled (and confirmed) once.
 */
export function isOwnerDevice(hash: string = OWNER_TOKEN_SHA256): Promise<boolean> {
  pending ??= checkDevice(hash).finally(() => {
    pending = null;
  });
  return pending;
}

async function checkDevice(hash: string): Promise<boolean> {
  const fromLink = decodeURIComponent(window.location.hash.slice(1));
  if (fromLink) {
    const turnOn = fromLink.endsWith(TURN_ON_SUFFIX);
    const token = turnOn ? fromLink.slice(0, -TURN_ON_SUFFIX.length) : fromLink;
    if (await matchesToken(token, hash)) {
      // Take the token out of the address bar (and so out of history and anything shared).
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      if (turnOn) {
        removeStorage(STORAGE_KEYS.ownerDevice);
        window.alert('Analytics is back on for this browser.');
        return false;
      }
      writeStorage(STORAGE_KEYS.ownerDevice, token);
      window.alert("This browser won't be counted in analytics.");
      return true;
    }
  }
  const saved = readStorage(STORAGE_KEYS.ownerDevice);
  return saved !== null && (await matchesToken(saved, hash));
}
