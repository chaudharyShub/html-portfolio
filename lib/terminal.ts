// PROFILE is only needed by the blog command (turned off): import { PROFILE, PROFILE_LINKS }
import { PROFILE_LINKS } from '@/data/profile';
import type { BlogPost } from './blog';
import { VISIBLE_PROJECTS } from '@/data/projects';
import type { SectionId } from './sections';

/** The prompt's parts (drawn in different colors) and the plain-text prompt. */
export const PROMPT_PARTS = { user: 'shubham@portfolio', dir: '~', symbol: '%' } as const;
export const TERMINAL_PROMPT = `${PROMPT_PARTS.user} ${PROMPT_PARTS.dir} ${PROMPT_PARTS.symbol}`;

export const TERMINAL_BANNER =
  "Welcome to Shubham's portfolio terminal.\nType 'help' to see available commands.";

/** Side effects a command may trigger in the rest of the desktop. */
export interface TerminalEffects {
  goToSection: (id: SectionId) => void;
  openResumeWizard: () => void;
  closeTerminal: () => void;
  openUrl: (url: string) => void;
}

/** What the `blog` command needs of a post (handed down from the server-rendered page). */
export type TerminalPost = Pick<BlogPost, 'title' | 'url' | 'dateLabel' | 'readMinutes'>;

export type TerminalResult = { kind: 'append'; lines: string[] } | { kind: 'clear' };

type CommandOutput = string | null | { clear: true };
type Command = (fx: TerminalEffects) => CommandOutput;

/**
 * Clues for the hidden commands (sudo hire-me, matrix, rm -rf), one per `hint`, in turn. They
 * point the way without giving the command away, so finding them is still the fun part.
 */
const HINTS = [
  'Ask for the job the way a superuser would.',
  'Red pill or blue pill? Type the world Neo woke up from.',
  'Try deleting everything. Go on, I dare you.',
];
let nextHint = 0;

const COMMANDS: Record<string, Command> = {
  help: () =>
    `Available commands:\n  whoami, about, skills, projects, experience, contact,\n  resume, links, ${PROFILE_LINKS.map((link) => link.id).join(', ')},\n  date, ver, echo <text>, clear, exit\n\nPsst: ${HINTS.length} commands are hidden. Type 'hint' for a clue.`,
  hint: () => {
    const i = nextHint;
    nextHint = (nextHint + 1) % HINTS.length;
    return `Clue ${i + 1} of ${HINTS.length}: ${HINTS[i]}`;
  },
  whoami: () => 'Shubham Chaudhary - Full Stack Engineer - 4+ years experience, building with AI agents',
  about: () =>
    'Full-stack engineer specializing in the full stack (frontend-heavy).\n4+ years as a Software Engineer (plus 2 yrs prior as a Mechanical Engineer).\nBuilding with AI via Cursor AI and Agent Fabric (multi-agent orchestration).',
  skills: () =>
    'React.js, Next.js, TypeScript, JavaScript, Tailwind, Node.js, Express.js, PostgreSQL, Electron.js, Git, Docker, Cursor AI, Prompt Engineering',
  projects: () =>
    `${VISIBLE_PROJECTS.map((p, i) => `${i + 1}. ${p.name}`).join('\n')}\nSee the Projects section for full details.`,
  experience: () => 'Koru UX (2026-2026)\nQuokka Labs (2022-2026)\nRiviera Home Furnishings (2020-2022)',
  contact: (fx) => {
    fx.goToSection('contact');
    return 'Opening contact section...';
  },
  resume: (fx) => {
    fx.openResumeWizard();
    return 'Opening the resume installer...';
  },
  links: () => PROFILE_LINKS.map((link) => `${link.label.padEnd(10)} ${link.href}`).join('\n'),
  // One command per profile link (github, linkedin, ...), named by its id.
  ...Object.fromEntries(
    PROFILE_LINKS.map((link): [string, Command] => [
      link.id,
      (fx) => {
        fx.openUrl(link.href);
        return `Opening ${link.label}...`;
      },
    ]),
  ),
  date: () => new Date().toString(),
  ver: () => 'Shubham OS 3.0',
  clear: () => ({ clear: true }),
  exit: (fx) => {
    fx.closeTerminal();
    return null;
  },
};

/** Parses one line of input. The echoed prompt line is always the first appended line. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for the blog command (turned off for now)
export function runTerminalCommand(raw: string, fx: TerminalEffects, _posts: readonly TerminalPost[]): TerminalResult {
  const cmd = raw.trim();
  const echo = `${TERMINAL_PROMPT} ${cmd}`;
  if (cmd === '') return { kind: 'append', lines: [echo] };

  const lower = cmd.toLowerCase();
  if (lower === 'sudo hire-me') {
    fx.goToSection('contact');
    return { kind: 'append', lines: [echo, 'Permission granted. Redirecting to contact form...'] };
  }
  if (lower.startsWith('rm -rf')) {
    return { kind: 'append', lines: [echo, 'Nice try. This filesystem is read-only (and so is my resolve).'] };
  }
  if (lower === 'matrix') {
    return { kind: 'append', lines: [echo, 'Wake up... there is no spoon, only React state.'] };
  }
  // `echo` alone prints an empty line, like zsh.
  if (lower === 'echo' || lower.startsWith('echo ')) return { kind: 'append', lines: [echo, cmd.slice(5)] };

  // The blog command is turned off with the Writing section (Nov 2026). To bring it back, uncomment
  // this line and blog() below, add 'blog, ' back to help, and use `posts` instead of `_posts`.
  // if (lower === 'blog' || lower.startsWith('blog ')) return { kind: 'append', lines: [echo, blog(lower.slice(5).trim(), fx, posts)] };

  const command = COMMANDS[lower.split(' ')[0] ?? ''];
  if (!command) {
    return {
      kind: 'append',
      lines: [echo, `zsh: command not found: ${cmd.split(' ')[0]}\nType 'help' for a list of available commands.`],
    };
  }
  const output = command(fx);
  if (output !== null && typeof output === 'object') return { kind: 'clear' };
  return { kind: 'append', lines: output ? [echo, output] : [echo] };
}

// /** `blog` lists the latest posts; `blog <number>` opens one, `blog all` opens the blog. */
// function blog(arg: string, fx: TerminalEffects, posts: readonly TerminalPost[]): string {
//   const blogUrl = PROFILE.links.hashnode.href;
//   if (arg === 'all') {
//     fx.openUrl(blogUrl);
//     return 'Opening the blog...';
//   }
//   if (posts.length === 0) return `Couldn't load the posts right now. Read them at ${blogUrl}`;
//   if (arg === '') {
//     const list = posts.map((p, i) => `${String(i + 1).padStart(2)}. ${p.title}\n    ${p.dateLabel} · ${p.readMinutes} min read`);
//     return `Latest posts:\n${list.join('\n')}\n\nType 'blog <number>' to open one, or 'blog all' for the blog.`;
//   }
//   const post = /^\d+$/.test(arg) ? posts[Number(arg) - 1] : undefined;
//   if (!post) return `blog: no post '${arg}'. Pick 1-${posts.length}, or type 'blog all'.`;
//   fx.openUrl(post.url);
//   return `Opening "${post.title}"...`;
// }

/** Appends lines newline-separated, with no leading blank line. */
export function appendTerminalLines(current: string, lines: string[]): string {
  return lines.reduce((out, line) => out + (out ? '\n' : '') + line, current);
}
