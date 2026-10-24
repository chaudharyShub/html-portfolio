import { PROFILE } from '@/data/profile';
import { STORAGE_KEYS, readStorage, writeStorage } from '@/lib/storage';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

/**
 * Web3Forms access key from the `WEB3FORMS_ACCESS_KEY` env var. Read on the server (see
 * components/portfolio/Contact.tsx) and passed to the form, because Web3Forms only accepts
 * submissions made from the visitor's browser. The key is public by design: it only routes
 * messages to the account owner's inbox. Empty = mailto-only mode.
 */
export function getWeb3FormsAccessKey(): string {
  return process.env.WEB3FORMS_ACCESS_KEY?.trim() ?? '';
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export function buildMailtoLink({ name, email, message }: ContactMessage): string {
  const sender = name || 'there';
  return (
    `mailto:${PROFILE.email}?subject=${encodeURIComponent(`Portfolio contact from ${sender}`)}` +
    `&body=${encodeURIComponent(`${message}\n\nFrom: ${sender} (${email})`)}`
  );
}

/** Sends the message through Web3Forms. Resolves to true only when the service confirms delivery. */
export async function sendViaWeb3Forms(accessKey: string, { name, email, message }: ContactMessage): Promise<boolean> {
  const body = new FormData();
  body.append('access_key', accessKey);
  body.append('subject', `Portfolio contact from ${name || 'someone'}`);
  body.append('from_name', 'Shubham OS Portfolio');
  body.append('name', name);
  body.append('email', email);
  body.append('message', message);

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      body,
      headers: { Accept: 'application/json' },
    });
    const data: unknown = await response.json().catch(() => null);
    return response.ok && typeof data === 'object' && data !== null && (data as { success?: unknown }).success === true;
  } catch {
    return false;
  }
}

/** A visitor can send up to 5 messages per minute through Web3Forms. */
export const SEND_LIMIT = 5;
const SEND_WINDOW_MS = 60_000;

// Also kept in memory so the limit holds when localStorage is blocked.
let sendsInMemory: number[] = [];

/** Send times within the last minute, oldest first. */
function recentSends(now: number): number[] {
  let stored: unknown = null;
  try {
    stored = JSON.parse(readStorage(STORAGE_KEYS.contactSends) ?? '[]');
  } catch {
    // Corrupt value: treat as no sends.
  }
  const saved = Array.isArray(stored) ? stored.filter((t): t is number => typeof t === 'number') : [];
  return [...new Set([...saved, ...sendsInMemory])]
    .map((t) => Math.min(t, now)) // a time from the future (changed clock) counts as "now"
    .filter((t) => now - t < SEND_WINDOW_MS)
    .sort((a, b) => a - b);
}

/** Seconds left before this visitor may send again (0 = allowed now). */
export function secondsUntilNextSend(now = Date.now()): number {
  const recent = recentSends(now);
  // Allowed again once the oldest send that counts toward the limit leaves the window.
  const oldestCounted = recent[recent.length - SEND_LIMIT];
  if (oldestCounted === undefined) return 0;
  const left = oldestCounted + SEND_WINDOW_MS - now;
  return Math.max(1, Math.ceil(left / 1000));
}

export function recordMessageSent(now = Date.now()): void {
  sendsInMemory = [...recentSends(now), now];
  writeStorage(STORAGE_KEYS.contactSends, JSON.stringify(sendsInMemory));
}
