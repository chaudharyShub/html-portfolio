/**
 * Server-only: the site's small Upstash Redis database (connected through the Vercel Marketplace,
 * which sets KV_REST_API_URL / KV_REST_API_TOKEN). Talks to Upstash's REST API with plain fetch,
 * so no client library is needed. Used by the like counter and the Debug Runner top score.
 */

function config() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export function kvConfigured(): boolean {
  return config() !== null;
}

/** Runs Redis commands in one round trip and returns their results in order. */
export async function pipeline(commands: (string | number)[][]): Promise<unknown[]> {
  const cfg = config();
  if (!cfg) throw new Error('Storage is not configured');
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

export const toCount = (value: unknown) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/**
 * HMAC-SHA-256 of `text`, keyed with the database token (secret, server-only), as hex. Used to
 * hash IPs (can't be turned back into an address) and to sign Debug Runner run tickets.
 */
export async function signHex(text: string, bytes = 16): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(config()?.token ?? ''),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(signature).slice(0, bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}
