import { addLike, getLikes, likesConfigured } from '@/lib/likes-store';

// Always read the live count; never cache this route.
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

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

export async function POST(request: Request) {
  if (!likesConfigured()) return unavailable();

  // Only this site's own pages may add likes.
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  try {
    return Response.json(await addLike(ip), { headers: NO_STORE });
  } catch {
    return unavailable();
  }
}
