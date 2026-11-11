/** Shared bits for the site's small API routes. */

export const NO_STORE = { 'Cache-Control': 'no-store' };

/** True when the request comes from another site's page (only this site may write). */
export function fromOtherSite(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  // `Origin: null` (sandboxed frames, some privacy tools) or anything unparsable isn't this site.
  try {
    return new URL(origin).host !== request.headers.get('host');
  } catch {
    return true;
  }
}

export const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403, headers: NO_STORE });

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  );
}
