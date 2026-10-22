export type SkillLevel = 'Advanced' | 'Proficient' | 'Intermediate';

export interface Skill {
  name: string;
  level: SkillLevel;
  /** 0-100, drives the progress bar width. */
  percent: number;
}

export interface SkillGroup {
  title: string;
  skills: Skill[];
}

export const SKILL_GROUPS: SkillGroup[] = [
  {
    title: 'Frontend',
    skills: [
      { name: 'React.js', level: 'Advanced', percent: 95 },
      { name: 'Next.js', level: 'Advanced', percent: 88 },
      { name: 'TypeScript', level: 'Advanced', percent: 90 },
      { name: 'JavaScript', level: 'Advanced', percent: 95 },
      { name: 'Tailwind CSS', level: 'Advanced', percent: 92 },
      { name: 'MUI', level: 'Proficient', percent: 85 },
      { name: 'HTML5', level: 'Advanced', percent: 95 },
      { name: 'CSS3', level: 'Advanced', percent: 92 },
      { name: 'Redux', level: 'Advanced', percent: 90 },
      { name: 'RTK Query', level: 'Advanced', percent: 90 },
      { name: 'Electron.js', level: 'Advanced', percent: 90 },
    ],
  },
  {
    title: 'Backend',
    skills: [
      { name: 'Node.js', level: 'Advanced', percent: 90 },
      { name: 'Express.js', level: 'Proficient', percent: 70 },
      { name: 'PostgreSQL', level: 'Proficient', percent: 70 },
    ],
  },
  {
    title: 'Tools & DevOps',
    skills: [
      { name: 'Git', level: 'Advanced', percent: 90 },
      { name: 'Docker', level: 'Proficient', percent: 80 },
      { name: 'CI/CD', level: 'Intermediate', percent: 55 },
      { name: 'Nginx', level: 'Intermediate', percent: 50 },
      { name: 'AWS', level: 'Intermediate', percent: 50 },
    ],
  },
  {
    title: 'AI Tools & Workflows',
    skills: [
      { name: 'Cursor AI', level: 'Advanced', percent: 90 },
      { name: 'Claude Code', level: 'Advanced', percent: 88 },
      { name: 'Prompt Engineering', level: 'Proficient', percent: 85 },
    ],
  },
];
