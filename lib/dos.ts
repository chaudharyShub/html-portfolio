import { PROFILE } from '@/data/profile';
import type { SectionId } from './sections';

export const DOS_PROMPT = 'C:\\Users\\Shubham>';

export const DOS_BANNER =
  "Shubham OS [Version 3.0]\n(C) Shubham Chaudhary. All rights reserved.\nType 'help' to see available commands.\n";

/** Side effects a command may trigger in the rest of the desktop. */
export interface DosEffects {
  goToSection: (id: SectionId) => void;
  openResumeWizard: () => void;
  closeDos: () => void;
  openUrl: (url: string) => void;
}

export type DosResult = { kind: 'append'; lines: string[] } | { kind: 'clear' };

type CommandOutput = string | null | { clear: true };
type Command = (fx: DosEffects) => CommandOutput;

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
    return 'Launching Resume Setup Wizard...';
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
  ver: () => 'Shubham OS [Version 3.0]',
  clear: () => ({ clear: true }),
  exit: (fx) => {
    fx.closeDos();
    return null;
  },
};

/** Parses one line of input. The echoed prompt line is always the first appended line. */
export function runDosCommand(raw: string, fx: DosEffects): DosResult {
  const cmd = raw.trim();
  const echo = `${DOS_PROMPT} ${cmd}`;
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
      lines: [echo, `'${cmd}' is not recognized as an internal or external command.\nType 'help' for a list of available commands.`],
    };
  }
  const output = command(fx);
  if (output !== null && typeof output === 'object') return { kind: 'clear' };
  return { kind: 'append', lines: output ? [echo, output] : [echo] };
}

/** Appends lines the way the original console did: newline-separated, no leading blank line. */
export function appendDosLines(current: string, lines: string[]): string {
  return lines.reduce((out, line) => out + (out ? '\n' : '') + line, current);
}
