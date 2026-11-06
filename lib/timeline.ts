import { EDUCATION } from '@/data/education';
import { VISIBLE_EXPERIENCE } from '@/data/experience';

/** One stop in the Time Machine: birth, school, college, jobs and the side-lane MBA. */
export interface Milestone {
  id: string;
  title: string;
  /** Who or where (company, school), shown in the snapshot's menu bar. */
  org: string;
  /** The meta line under the title. */
  meta: string;
  /** First part of the period, e.g. "June 2020", shown next to the big year. */
  start: string;
  year: number;
  /** The label under the dot on the year rail. */
  rail: string;
  summary: string;
  tags: string[];
  tagsLabel: string;
  /** Official site of the company or school, when one could be confirmed. */
  website?: string;
  /** Wallpaper class suffix (`tm-era-<era>`). */
  era: string;
  /** `side`: happened alongside the main line (the MBA during the job). */
  lane: 'main' | 'side';
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Months since year 0, for sorting ("June 2020" -> 2020 * 12 + 5; a bare "1995" -> January). */
function sortKey(start: string) {
  const year = Number(start.match(/\d{4}/)?.[0] ?? 0);
  const month = MONTHS.indexOf(start.slice(0, 3).toLowerCase());
  return year * 12 + Math.max(0, month);
}

const startOf = (period: string) => period.split(' - ')[0] ?? period;
const yearOf = (period: string) => Number(period.match(/\d{4}/)?.[0] ?? 0);

/** Before school: written for the Time Machine only (the user asked for a little humour). */
const LIFE: Milestone[] = [
  {
    id: 'birth',
    title: 'System first booted',
    org: 'Shubham OS 1.0',
    meta: '1995 · Day 1',
    start: '1995',
    year: 1995,
    rail: '1995',
    summary:
      'Shubham OS 1.0 ships. Early build: no keyboard skills, loud error sounds at 3 a.m., and it needs feeding every few hours. Many updates planned.',
    tags: ['Crying', 'Sleeping', 'Milk-driven development'],
    tagsLabel: 'Highlights',
    era: 'birth',
    lane: 'main',
  },
  {
    id: 'idle',
    title: '3 years of doing nothing',
    org: 'Idle mode',
    meta: '1995 - 1998 · 3 yrs',
    start: '1995 - 1998',
    year: 1995,
    rail: 'zzz',
    summary:
      'Ran in idle mode. Main processes: eating, sleeping and pushing things off tables to test gravity. Learned walking and talking, both without documentation.',
    tags: ['Walking', 'Talking', 'Gravity testing'],
    tagsLabel: 'Highlights',
    era: 'idle',
    lane: 'main',
  },
];

const SCHOOLING: Milestone[] = EDUCATION.map((e) => ({
  id: e.id,
  title: e.title,
  org: e.institution,
  meta: `${e.institution}, ${e.place} · ${e.period} · ${e.duration}`,
  start: startOf(e.period),
  year: yearOf(e.period),
  rail: String(yearOf(e.period)),
  summary: e.summary,
  tags: e.tags,
  tagsLabel: 'Highlights',
  website: e.website,
  era: e.id,
  lane: e.alongsideWork ? 'side' : 'main',
}));

// The experience data is newest first; the jobs keep the wallpapers they always had.
const JOBS: Milestone[] = [...VISIBLE_EXPERIENCE].reverse().map((e, i) => ({
  id: `job-${i}`,
  title: e.title,
  org: e.company,
  meta: `${e.company} · ${e.period} · ${e.duration}`,
  start: startOf(e.period),
  year: yearOf(e.period),
  rail: String(yearOf(e.period)),
  summary: e.summary,
  tags: e.tags,
  tagsLabel: 'Skills',
  website: e.website,
  era: String(i % 4),
  lane: 'main',
}));

/** Every stop, oldest first (a stable sort keeps birth before the idle years). */
export const MILESTONES: Milestone[] = [...LIFE, ...SCHOOLING, ...JOBS].sort(
  (a, b) => sortKey(a.start) - sortKey(b.start),
);
