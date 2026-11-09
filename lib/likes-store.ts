/**
 * Server-only: the site's like counter, kept in Upstash Redis (see lib/kv.ts).
 */

import { kvConfigured, pipeline, signHex, toCount } from './kv';

const COUNT_KEY = 'likes:count';
/** Ids of the likes that can be taken back (one per liking browser). */
const IDS_KEY = 'likes:ids';
/** One visitor network may add this many likes a day (shared office / mobile networks share an IP). */
const MAX_LIKES_PER_IP_PER_DAY = 5;
const DAY_SECONDS = 24 * 60 * 60;

export const likesConfigured = kvConfigured;

export async function getLikes(): Promise<number> {
  const [count] = await pipeline([['GET', COUNT_KEY]]);
  return toCount(count);
}

/** The visitor's IP, hashed so the stored value can't be turned back into an address. */
const hashIp = (ip: string) => signHex(ip);

/** A like id as handed out by addLike (a UUID). */
export function isLikeId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
}

/**
 * Adds one like unless this network has hit its daily limit. Returns the new total and the new
 * like's id (the browser keeps it so it can take the like back), or `id: null` when not counted.
 */
export async function addLike(ip: string): Promise<{ count: number; id: string | null }> {
  const ipKey = `likes:ip:${await hashIp(ip)}`;
  const [used] = await pipeline([
    ['INCR', ipKey],
    ['EXPIRE', ipKey, DAY_SECONDS, 'NX'],
  ]);
  if (toCount(used) > MAX_LIKES_PER_IP_PER_DAY) {
    return { count: await getLikes(), id: null };
  }
  const id = crypto.randomUUID();
  const [, count] = await pipeline([
    ['SADD', IDS_KEY, id],
    ['INCR', COUNT_KEY],
  ]);
  return { count: toCount(count), id };
}

/**
 * Takes a like back. Only an id that addLike handed out (and that wasn't taken back yet) lowers
 * the total, so made-up or repeated requests can't remove anyone else's like.
 */
export async function removeLike(id: string): Promise<{ count: number; removed: boolean }> {
  const [removed] = await pipeline([['SREM', IDS_KEY, id]]);
  if (toCount(removed) !== 1) return { count: await getLikes(), removed: false };
  const [count] = await pipeline([['DECR', COUNT_KEY]]);
  return { count: Math.max(0, toCount(count)), removed: true };
}
