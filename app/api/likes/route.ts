import { clientIp, forbidden, fromOtherSite, NO_STORE } from '@/lib/api-response';
import { addLike, getLikes, isLikeId, likesConfigured, removeLike } from '@/lib/likes-store';

// Always read the live count; never cache this route.
export const dynamic = 'force-dynamic';

function unavailable() {
  return Response.json({ error: 'Likes are not available' }, { status: 503, headers: NO_STORE });
}

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

  try {
    return Response.json(await addLike(clientIp(request)), { headers: NO_STORE });
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
