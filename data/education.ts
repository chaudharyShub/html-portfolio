/**
 * Education, oldest first. Institutions, places and dates come from the user (the MBA and B.Tech
 * match the resume). The school years were worked out from them: no gaps, 12th finished in 2013.
 * The summaries are playful on purpose: they're only shown in the Time Machine.
 */
export interface EducationEntry {
  id: string;
  institution: string;
  place: string;
  title: string;
  period: string;
  duration: string;
  summary: string;
  tags: string[];
  /** The official site, linked from the Time Machine card (links confirmed by the user). */
  website?: string;
  /** Studied alongside a job: the Time Machine draws it on a side lane. */
  alongsideWork?: boolean;
}

export const EDUCATION: EducationEntry[] = [
  {
    id: 'primary-school',
    institution: 'St. Thomas English Medium School',
    place: 'Meerut, U.P.',
    title: 'Nursery - 8th',
    period: '1998 - 2009',
    duration: '11 yrs',
    summary:
      'Installed the core drivers: the alphabet, times tables, cursive writing and a growing library of reasons why the homework was not done. Eleven years, no gaps, very few patches.',
    tags: ['ABCs', 'Times tables', 'Homework excuses'],
    website: 'https://www.stthomasmeerut.com',
  },
  {
    id: 'high-school',
    institution: 'City Vocational Public School',
    place: 'Meerut, U.P.',
    title: '9th - 12th',
    period: '2009 - 2013',
    duration: '4 yrs',
    summary:
      'Major version upgrade: board exams, tougher maths and the first deadlines that could not be pushed to next week. Shipped on time in 2013.',
    tags: ['Board exams', 'Maths', 'Deadlines'],
    website: 'https://www.cvpschool.com',
  },
  {
    id: 'btech',
    institution: 'Vidya College of Engineering',
    place: 'Meerut, U.P.',
    title: 'B.Tech - Mechanical Engineering',
    period: 'June 2013 - June 2017',
    duration: '4 yrs',
    summary:
      'Learned how machines work, from gears to engines. The hardware years: the same debugging mindset, only with spanners instead of a console, and a lot more grease.',
    tags: ['Mechanical Engineering', 'Problem Solving', 'Engineering Drawing'],
    website: 'https://vce.vidya.edu.in',
  },
  {
    id: 'mba',
    institution: 'Amity University Online',
    place: 'Noida, U.P.',
    title: 'MBA - IT & Data Analytics',
    period: 'July 2025 - July 2027',
    duration: '2 yrs, in progress',
    summary:
      "Master of Business Administration with a dual specialization in IT and Data Analytics, studied online alongside the full-time job. A background process: it keeps running after the day's code ships.",
    tags: ['IT', 'Data Analytics', 'Business', 'Work + study'],
    website: 'https://amityonline.com',
    alongsideWork: true,
  },
];
