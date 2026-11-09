/**
 * Server-only: the Debug Runner top score (the highest score of any visitor), in Upstash Redis
 * (see lib/kv.ts).
 *
 * Anyone can send a request, so a score is only accepted with a run ticket: the server signs the
 * time a run started, and the game earns exactly POINTS_PER_SECOND, so a score can't be higher
 * than the time since the ticket allows (plus a little slack for the request). Each ticket counts
 * once. Faking a top score therefore takes as long as playing for it.
 */

import { POINTS_PER_SECOND } from './debug-runner';
import { kvConfigured, pipeline, signHex, toCount } from './kv';

/** Sorted set with one member, so `ZADD GT` raises the score only when the new one is higher. */
const TOP_KEY = 'debugRunner:top';
const TOP_MEMBER = 'best';
const USED_PREFIX = 'debugRunner:run:';
/** A ticket is good for this long (a run that long would score 36,000). */
const TICKET_MAX_AGE_MS = 60 * 60 * 1000;
/** Slack for the start request's trip and timer differences. */
const SLACK_POINTS = 30;
const SLACK_RATE = 1.05;

export const runnerScoreConfigured = kvConfigured;

export async function getTopScore(): Promise<number> {
  const [score] = await pipeline([['ZSCORE', TOP_KEY, TOP_MEMBER]]);
  return toCount(score);
}

const ticketBody = (startedAt: number, nonce: string) => `run:${startedAt}.${nonce}`;

/** A signed ticket for a run starting now: `<start ms>.<nonce>.<signature>`. */
export async function createRunTicket(now = Date.now()): Promise<string> {
  const nonce = crypto.randomUUID().replaceAll('-', '');
  return `${now}.${nonce}.${await signHex(ticketBody(now, nonce))}`;
}

/** Highest score a run that started at `startedAt` can have earned by `now`. */
export function maxScoreFor(startedAt: number, now: number): number {
  return Math.floor(((now - startedAt) / 1000) * POINTS_PER_SECOND * SLACK_RATE) + SLACK_POINTS;
}

export type SubmitResult =
  | { ok: true; best: number; record: boolean }
  | { ok: false; reason: 'bad-ticket' | 'used' | 'too-high'; best: number };

export async function submitScore(ticket: unknown, score: unknown, now = Date.now()): Promise<SubmitResult> {
  const parts = typeof ticket === 'string' ? ticket.split('.') : [];
  const [startText = '', nonce = '', signature = ''] = parts;
  const startedAt = Number(startText);
  const valid =
    parts.length === 3 &&
    /^\d{13}$/.test(startText) &&
    /^[0-9a-f]{32}$/.test(nonce) &&
    startedAt <= now &&
    now - startedAt <= TICKET_MAX_AGE_MS &&
    typeof score === 'number' &&
    Number.isInteger(score) &&
    score > 0 &&
    signature === (await signHex(ticketBody(startedAt, nonce)));
  if (!valid) return { ok: false, reason: 'bad-ticket', best: await getTopScore() };
  if (score > maxScoreFor(startedAt, now)) return { ok: false, reason: 'too-high', best: await getTopScore() };

  const [fresh] = await pipeline([['SET', `${USED_PREFIX}${nonce}`, '1', 'NX', 'PX', TICKET_MAX_AGE_MS]]);
  if (fresh !== 'OK') return { ok: false, reason: 'used', best: await getTopScore() };

  const [changed, best] = await pipeline([
    ['ZADD', TOP_KEY, 'GT', 'CH', score, TOP_MEMBER],
    ['ZSCORE', TOP_KEY, TOP_MEMBER],
  ]);
  return { ok: true, best: toCount(best), record: toCount(changed) === 1 };
}
