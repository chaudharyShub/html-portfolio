import { forbidden, fromOtherSite, NO_STORE } from '@/lib/api-response';
import { createRunTicket, runnerScoreConfigured } from '@/lib/runner-score-store';

export const dynamic = 'force-dynamic';

/** Starts a Debug Runner run: returns `{ ticket }`, which the score is sent with at game over. */
export async function POST(request: Request) {
  if (!runnerScoreConfigured()) {
    return Response.json({ error: 'Top score is not available' }, { status: 503, headers: NO_STORE });
  }
  if (fromOtherSite(request)) return forbidden();
  return Response.json({ ticket: await createRunTicket() }, { headers: NO_STORE });
}
