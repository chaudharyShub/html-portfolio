/**
 * Server-only: the site's like counter, kept in Upstash Redis (connected through the Vercel
 * Marketplace, which sets KV_REST_API_URL / KV_REST_API_TOKEN). Talks to Upstash's REST API
 * with plain fetch, so no client library is needed.
 */

const COUNT_KEY = 'likes:count';
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

/** Adds one like unless this network has hit its daily limit. Returns the new total. */
export async function addLike(ip: string): Promise<{ count: number; counted: boolean }> {
  const ipKey = `likes:ip:${await hashIp(ip)}`;
  const [used] = await pipeline([
    ['INCR', ipKey],
    ['EXPIRE', ipKey, DAY_SECONDS, 'NX'],
  ]);
  if (toCount(used) > MAX_LIKES_PER_IP_PER_DAY) {
    return { count: await getLikes(), counted: false };
  }
  const [count] = await pipeline([['INCR', COUNT_KEY]]);
  return { count: toCount(count), counted: true };
}
