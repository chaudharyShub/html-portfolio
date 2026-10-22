export interface ExperienceEntry {
  company: string;
  title: string;
  period: string;
  duration: string;
  summary: string;
  tags: string[];
  /** Hidden entries are kept for reference but not rendered (previously commented out in the HTML). */
  hidden?: boolean;
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    company: 'Koru UX',
    title: 'Frontend Developer',
    period: 'May 2026 - Sept 2026',
    duration: '~5 mos',
    summary:
      'Contributed as a Frontend Developer on Agent Fabric UI, a React 19+ TypeScript enterprise web application built with Vite, Mantine, and Redux Toolkit Query, enabling teams to configure, test, qualify, and govern AI agents across their full lifecycle, leveraging Cursor AI-assisted development to accelerate implementation and delivery.',
    tags: ['React.js', 'Cursor', 'Claude', 'TypeScript', 'Tailwind', 'Playwright', 'Redux', 'Git', 'PostgreSQL'],
  },
  {
    company: 'ShepHertz Technologies',
    title: 'Software Engineer',
    period: 'April 2026 - May 2026',
    duration: '~1 mo',
    summary:
      'Building cross-platform desktop web browser using Electron.js, collaborating on features, optimizing performance, and shipping with modern tools and integrations.',
    tags: ['React.js', 'Electron.js', 'JavaScript', 'TypeScript', 'Tailwind', 'Cursor AI', 'Git'],
    hidden: true,
  },
  {
    company: 'Quokka Labs',
    title: 'Software Engineer',
    period: 'Sept 2022 - March 2026',
    duration: '3 yrs 6 mos',
    summary:
      'Frontend engineer specializing in React, Next.js, and Electron - building responsive, user-friendly interfaces with clean, optimized code. Translated requirements into production UI and contributed to backend (Node, Express, PostgreSQL) when handling APIs and end-to-end functionality.',
    tags: [
      'React.js',
      'Next.js',
      'Electron.js',
      'TypeScript',
      'Tailwind',
      'Node.js',
      'Express.js',
      'PostgreSQL',
      'Material UI',
      'Redux',
      'REST APIs',
      'Git',
    ],
  },
  {
    company: 'Riviera Home Furnishings',
    title: 'Mechanical Engineer',
    period: 'June 2020 - June 2022',
    duration: '2 yrs',
    summary:
      'Led a team of 10-12 technicians in the maintenance department of a bathmat manufacturing plant. Owned preventive & breakdown maintenance, scheduled repairs, identified root causes of equipment failures, coordinated with production, and upheld safety/quality standards to keep production uninterrupted.',
    tags: [
      'Supervision',
      'Preventive Maintenance',
      'Breakdown Maintenance',
      'Project Management',
      'Leadership',
      'Ownership',
    ],
  },
];

export const VISIBLE_EXPERIENCE = EXPERIENCE.filter((e) => !e.hidden);
