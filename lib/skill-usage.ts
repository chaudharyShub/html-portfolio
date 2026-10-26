import { VISIBLE_EXPERIENCE, type ExperienceEntry } from '@/data/experience';
import { VISIBLE_PROJECTS, type Project } from '@/data/projects';
import { SKILL_GROUPS, type Skill } from '@/data/skills';

/** Skills, job tags and project tech name some tools differently ("MUI" / "Material UI"). */
const ALIASES: Record<string, string> = {
  mui: 'material ui',
  'tailwind css': 'tailwind',
  'cursor ai': 'cursor',
  'claude code': 'claude',
};

function key(name: string): string {
  const k = name.toLowerCase().replace(/\.js$/, '').trim();
  return ALIASES[k] ?? k;
}

export interface SkillUsage {
  jobs: ExperienceEntry[];
  projects: Project[];
}

/** The visible jobs and projects that list a skill. */
export function skillUsage(skill: string): SkillUsage {
  const k = key(skill);
  return {
    jobs: VISIBLE_EXPERIENCE.filter((e) => e.tags.some((t) => key(t) === k)),
    projects: VISIBLE_PROJECTS.filter((p) => p.tech.some((t) => key(t) === k)),
  };
}

export interface SkillProcess extends Skill {
  group: string;
  /** A stable, made-up process id. */
  pid: number;
}

export const SKILL_PROCESSES: SkillProcess[] = SKILL_GROUPS.flatMap((g, gi) =>
  g.skills.map((s, si) => ({ ...s, group: g.title, pid: 301 + gi * 100 + si * 7 })),
);
