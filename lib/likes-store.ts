/**
 * Server-only: the site's like counter, kept in Upstash Redis (connected through the Vercel
 * Marketplace, which sets KV_REST_API_URL / KV_REST_API_TOKEN). Talks to Upstash's REST API
 * with plain fetch, so no client library is needed.
 */

const COUNT_KEY = 'likes:count';
/** Ids of the likes that can be taken back (one per liking browser). */
const IDS_KEY = 'likes:ids';
/** One visitor network may add this many likes a day (shared office / mobile networks share an IP). */
const MAX_LIKES_PER_IP_PER_DAY = 5;
const DAY_SECONDS = 24 * 60 * 60;

function config() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export function likesConfigured(): boolean {
  return config() !== null;
}

/** Runs Redis commands in one round trip and returns their results in order. */
async function pipeline(commands: (string | number)[][]): Promise<unknown[]> {
  const cfg = config();
  if (!cfg) throw new Error('Likes storage is not configured');
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
  const replies = (await res.json()) as { result?: unknown; error?: string }[];
  return replies.map((reply) => {
    if (reply.error) throw new Error(reply.error);
    return reply.result;
  });
}

const toCount = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export async function getLikes(): Promise<number> {
  const [count] = await pipeline([['GET', COUNT_KEY]]);
  return toCount(count);
}

/**
 * Hashes the visitor's IP with the database token as the key, so the stored value can't be
 * turned back into an IP and the raw address is never saved.
 */
async function hashIp(ip: string): Promise<string> {
  const cfg = config();
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(cfg?.token ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(signature).slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

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
