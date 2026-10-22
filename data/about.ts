export interface CoreModule {
  area: string;
  description: string;
  tech: string;
}

export interface StaticStat {
  value: string;
  label: string;
}

export const ABOUT_SUMMARY =
  'Full stack developer (frontend-heavy) with 4 years of experience building production web and desktop ' +
  'applications. Specializes in React.js, Next.js, JavaScript and TypeScript on the frontend, backed by Node.js, ' +
  'Express.js APIs and PostgreSQL data layers. Comfortable owning a feature end to end from UI architecture and ' +
  'state management through REST API design and deployment with working knowledge of Docker, Nginx, CI/CD ' +
  'pipelines, and AWS fundamentals for shipping and running applications in production.';

export const CORE_MODULES: CoreModule[] = [
  {
    area: 'Frontend Development',
    description:
      'Building responsive, accessible UIs with React, Next.js, and modern design systems, backed by scalable state management.',
    tech: 'React.js, Next.js, TypeScript, JavaScript, Tailwind CSS, Material UI, Redux, RTK Query',
  },
  {
    area: 'Backend Development',
    description: 'Designing RESTful APIs with Node.js and Express, integrating with SQL and NoSQL databases.',
    tech: 'Node.js, Express.js, PostgreSQL',
  },
  {
    area: 'Desktop Applications',
    description: 'Cross-platform desktop apps with Electron.js - web technologies meet native OS power.',
    tech: 'Electron.js, React.js, IPC, Electron-store',
  },
  {
    area: 'DevOps & Deployment',
    description:
      'Containerizing services, configuring reverse proxies, and setting up CI/CD pipelines to ship and run applications reliably in the cloud.',
    tech: 'Docker, Nginx, CI/CD, AWS',
  },
  {
    area: 'AI & Agentic Systems',
    description: 'Building AI-assisted workflows and multi-agent orchestration tools.',
    tech: 'Cursor AI, Claude Code, Chat GPT',
  },
];

/** Fixed stats shown after the live "Years Experience" box. */
export const STATIC_STATS: StaticStat[] = [
  { value: '4+', label: 'Projects Delivered' },
  { value: '5+', label: 'Happy Clients' },
  { value: '10K+', label: 'Lines of Code' },
];
