'use client';

import { PROFILE } from '@/data/profile';
import { useNow } from '@/lib/clock';
import { computeUptime, formatUptime } from '@/lib/uptime';

const CAREER_START = new Date(PROFILE.careerStart);

function useCareerUptime() {
  const now = useNow();
  return now === null ? null : computeUptime(CAREER_START, new Date(now));
}

/**
 * Whole years since the career start, e.g. "4+" or "4+ Years". `serverYears` (worked out when the
 * page is rendered on the server) fills the server HTML and hydration, so crawlers, link previews
 * and the first paint see the number instead of a dash; then the live clock takes over.
 */
export function YearsExperience({ withUnit = false, serverYears }: { withUnit?: boolean; serverYears?: number }) {
  const uptime = useCareerUptime();
  const years = uptime?.years ?? serverYears;
  if (years === undefined) return <>-</>;
  return <>{withUnit ? `${years}+ Years` : `${years}+`}</>;
}

/** Live "IT Career Uptime" ticker: 4y 1m 21d 13:05:09. */
export function CareerUptime() {
  const uptime = useCareerUptime();
  return <>{uptime ? formatUptime(uptime) : 'calculating...'}</>;
}
