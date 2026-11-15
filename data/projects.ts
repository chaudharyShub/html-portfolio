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

/**
 * Personal projects (no `company`) are listed newest first: the Shubham Works badge's "Also:"
 * shows the first 3 with a live link (`MadeBy.tsx`).
 */
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
    name: 'Git, Drawn Out',
    status: 'Completed',
    tech: ['JavaScript', 'HTML5', 'CSS3', 'SVG'],
    description:
      'Git, Drawn Out is an interactive field guide that explains Git through pictures instead of walls of text. It started as my personal cheat sheet while learning Git, then I made it public. Step through commands in the playground and watch the commit graph change in real time.',
    liveUrl: 'https://git-drawn-out.vercel.app',
  },
  {
    name: 'CloudPrep',
    status: 'Completed',
    tech: ['React.js', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'MediaPipe'],
    description:
      'AWS certification exam simulator for CLF-C02, SAA-C03 and DVA-C03: a 4,000-question original bank, timed mock exams, and a learning mode with explanations and spaced-repetition review. React + TypeScript on Supabase (Postgres, Auth, RLS), with an opt-in AI-proctored mode using in-browser computer vision (MediaPipe).',
    liveUrl: 'https://aws-cloud-prepare.vercel.app',
  },
  {
    name: 'Frontend Interview Prep',
    status: 'Completed',
    tech: ['JavaScript', 'HTML5', 'CSS3', 'localStorage'],
    description:
      'Dependency-free frontend interview prep: 283 questions with model answers on JavaScript, TypeScript, React, Next.js, HTML & CSS and system design. It has runnable coding challenges, progress tracking, starred review and offline support, with no sign-up.',
    liveUrl: 'https://frontend-interview-prepare.vercel.app',
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
