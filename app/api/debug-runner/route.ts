import { forbidden, fromOtherSite, NO_STORE } from '@/lib/api-response';
import { getTopScore, runnerScoreConfigured, submitScore } from '@/lib/runner-score-store';

// Always read the live score; never cache this route.
export const dynamic = 'force-dynamic';

function unavailable() {
  return Response.json({ error: 'Top score is not available' }, { status: 503, headers: NO_STORE });
}

/** The Debug Runner top score of all visitors: `{ best }`. */
export async function GET() {
  if (!runnerScoreConfigured()) return unavailable();
  try {
    return Response.json({ best: await getTopScore() }, { headers: NO_STORE });
  } catch {
    return unavailable();
  }
}

/**
 * Sends a finished run's score: `{ ticket, score }` (the ticket from POST /api/debug-runner/run).
 * Returns `{ best, record }`; 400 for a bad or reused ticket or a score the run time can't reach.
 */
export async function POST(request: Request) {
  if (!runnerScoreConfigured()) return unavailable();
  if (fromOtherSite(request)) return forbidden();

  const body = (await request.json().catch(() => null)) as { ticket?: unknown; score?: unknown } | null;
  try {
    const result = await submitScore(body?.ticket, body?.score);
    if (!result.ok) {
      return Response.json({ error: result.reason, best: result.best }, { status: 400, headers: NO_STORE });
    }
    return Response.json({ best: result.best, record: result.record }, { headers: NO_STORE });
  } catch {
    return unavailable();
  }
}
