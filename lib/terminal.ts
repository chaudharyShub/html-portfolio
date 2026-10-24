import { PROFILE } from '@/data/profile';
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

export type TerminalResult = { kind: 'append'; lines: string[] } | { kind: 'clear' };

type CommandOutput = string | null | { clear: true };
type Command = (fx: TerminalEffects) => CommandOutput;

const COMMANDS: Record<string, Command> = {
  help: () =>
    'Available commands:\n  whoami, about, skills, projects, experience, contact,\n  github, linkedin, date, ver, echo <text>, clear, exit',
  whoami: () => 'Shubham Chaudhary - Full Stack Engineer - 4+ years experience, building with AI agents',
  about: () =>
    'Full-stack engineer specializing in the full stack (frontend-heavy).\n4+ years as a Software Engineer (plus 2 yrs prior as a Mechanical Engineer).\nBuilding with AI via Cursor AI and Agent Fabric (multi-agent orchestration).',
  skills: () =>
    'React.js, Next.js, TypeScript, JavaScript, Tailwind, Node.js, Express.js, PostgreSQL, Electron.js, Git, Docker, Cursor AI, Prompt Engineering',
  projects: () =>
    '1. Agent Fabric\n2. RunTheDay (RTD)\n4. SportZentric\n5. Desktop Application\nSee the Projects section for full details.',
  experience: () => 'Koru UX (2026-2026)\nQuokka Labs (2022-2026)\nRiviera Home Furnishings (2020-2022)',
  contact: (fx) => {
    fx.goToSection('contact');
    return 'Opening contact section...';
  },
  resume: (fx) => {
    fx.openResumeWizard();
    return 'Opening the resume installer...';
  },
  github: (fx) => {
    fx.openUrl(PROFILE.links.github);
    return 'Opening GitHub...';
  },
  linkedin: (fx) => {
    fx.openUrl(PROFILE.links.linkedin);
    return 'Opening LinkedIn...';
  },
  date: () => new Date().toString(),
  ver: () => 'Shubham OS 3.0',
  clear: () => ({ clear: true }),
  exit: (fx) => {
    fx.closeTerminal();
    return null;
  },
};

/** Parses one line of input. The echoed prompt line is always the first appended line. */
export function runTerminalCommand(raw: string, fx: TerminalEffects): TerminalResult {
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
  if (lower.startsWith('echo ')) return { kind: 'append', lines: [echo, cmd.slice(5)] };

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

/** Appends lines newline-separated, with no leading blank line. */
export function appendTerminalLines(current: string, lines: string[]): string {
  return lines.reduce((out, line) => out + (out ? '\n' : '') + line, current);
}
