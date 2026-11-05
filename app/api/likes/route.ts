import { addLike, getLikes, isLikeId, likesConfigured, removeLike } from '@/lib/likes-store';

// Always read the live count; never cache this route.
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

function unavailable() {
  return Response.json({ error: 'Likes are not available' }, { status: 503, headers: NO_STORE });
}

/** Only this site's own pages may add or take back likes. */
function fromOtherSite(request: Request): boolean {
  const origin = request.headers.get('origin');
  return Boolean(origin && new URL(origin).host !== request.headers.get('host'));
}

const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });

export async function GET() {
  if (!likesConfigured()) return unavailable();
  try {
    return Response.json({ count: await getLikes() }, { headers: NO_STORE });
  } catch {
    return unavailable();
  }
}

/** Adds one like. Returns `{ count, id }`; `id` is null when this network's daily limit is reached. */
export async function POST(request: Request) {
  if (!likesConfigured()) return unavailable();
  if (fromOtherSite(request)) return forbidden();

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  try {
    return Response.json(await addLike(ip), { headers: NO_STORE });
  } catch {
    return unavailable();
  }
}

/** Takes back the like with the given id (`{ id }` in the body). Returns `{ count, removed }`. */
export async function DELETE(request: Request) {
  if (!likesConfigured()) return unavailable();
  if (fromOtherSite(request)) return forbidden();

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = body?.id;
  if (!isLikeId(id)) {
    return Response.json({ error: 'Unknown like' }, { status: 400, headers: NO_STORE });
  }
  try {
    return Response.json(await removeLike(id), { headers: NO_STORE });
  } catch {
    return unavailable();
  }
}
