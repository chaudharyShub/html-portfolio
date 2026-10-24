'use client';

import { PROFILE } from '@/data/profile';
import { useNow } from '@/lib/clock';
import { computeUptime, formatUptime } from '@/lib/uptime';

const CAREER_START = new Date(PROFILE.careerStart);

function useCareerUptime() {
  const now = useNow();
  return now === null ? null : computeUptime(CAREER_START, new Date(now));
}

/** Whole years since the career start, e.g. "4+" or "4+ Years". */
export function YearsExperience({ withUnit = false }: { withUnit?: boolean }) {
  const uptime = useCareerUptime();
  if (!uptime) return <>-</>;
  return <>{withUnit ? `${uptime.years}+ Years` : `${uptime.years}+`}</>;
}

/** Live "IT Career Uptime" ticker: 4y 1m 21d 13:05:09. */
export function CareerUptime() {
  const uptime = useCareerUptime();
  return <>{uptime ? formatUptime(uptime) : 'calculating...'}</>;
}
