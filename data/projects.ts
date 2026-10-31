export interface Project {
  name: string;
  status: 'Completed' | 'In Progress';
  tech: string[];
  description: string;
  liveUrl?: string;
  /** Company it was built at (matches `company` in data/experience.ts). Leave out for personal projects. */
  company?: string;
  /** Hidden entries are kept for reference but not rendered (previously commented out in the HTML). */
  hidden?: boolean;
}

export const PROJECTS: Project[] = [
  {
    name: 'Agent Fabric',
    company: 'Koru UX',
    status: 'Completed',
    tech: ['React.js', 'TypeScript', 'Cursor AI'],
    description:
      'An AI-native workflow and agent orchestration platform - the kind of internal tooling Fortune 500 teams are building right now to coordinate LLM-driven automation at scale.',
  },
  {
    name: 'CloudPrep',
    status: 'In Progress',
    tech: ['React.js', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'MediaPipe'],
    description:
      'AWS Certification Exam Simulator - a full-length timed mock exam engine with a 2,000 question bank and a learning mode with instant explanations, on a Supabase backend with Postgres, plus an opt-in AI-proctored exam mode with in-browser computer vision (MediaPipe).',
    liveUrl: 'https://cloud-prep-aws.vercel.app',
  },
  {
    name: 'Frontend Interview Prep',
    status: 'Completed',
    tech: ['JavaScript', 'HTML5', 'CSS3', 'localStorage'],
    description:
      'A dependency-free interview prep app with 176 frontend questions and model answers. It includes progress tracking, starred review, search, filters and light/dark themes, all saved in the browser with no sign-up.',
    liveUrl: 'https://frontend-interview-prod.vercel.app',
  },
  {
    name: 'BrowseAnywhere Agent',
    company: 'ShepHertz Technologies',
    status: 'Completed',
    tech: ['Electron.js', 'React.js', 'TypeScript', 'Cursor AI'],
    description:
      'Cross-platform desktop web browser built with Electron.js - collaborating on features, optimizing performance, and shipping with modern tools and integrations.',
    hidden: true,
  },
  {
    name: 'RunTheDay (RTD)',
    company: 'Quokka Labs',
    status: 'Completed',
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express.js', 'Redux', 'Material UI'],
    description:
      'US-based Full stack platform for creating and registering for races (marathons) and viewing live results, supporting multiple roles (Race Directors, Runners, Volunteers) with real-time, WebSocket driven interactions.',
    liveUrl: 'https://runtheday.com',
  },
  {
    name: 'MDM Desktop Application',
    company: 'Quokka Labs',
    status: 'Completed',
    tech: ['Electron.js', 'React.js', 'TypeScript', 'Node.js', 'MQTT', 'Redux'],
    description:
      'Cross-platform Windows/Linux desktop app and background service built with Electron.js that tracks system activity and streams power logs and timestamps to a server every minute.',
  },
  {
    name: 'SportZentric',
    company: 'Quokka Labs',
    status: 'Completed',
    tech: ['React.js', 'Tailwind CSS', 'React Hook Form', 'Styled Components', 'RTK Query'],
    description:
      'Sports platform connecting coaches and players, allowing coaches to create paid training batches that players can discover and join.',
  },
];

export const VISIBLE_PROJECTS = PROJECTS.filter((p) => !p.hidden);
