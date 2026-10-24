export interface SocialLinks {
  github: string;
  linkedin: string;
  instagram: string;
}

export const PROFILE = {
  name: 'Shubham Chaudhary',
  role: 'Full Stack Engineer',
  email: 'sc07807cs@gmail.com',
  /** Start of the IT career; drives the live "uptime" and years-of-experience counters. */
  careerStart: '2022-09-01T00:00:00',
  careerStartLabel: 'Sept 2022',
  /** Square profile photo (cropped from the user's own picture). */
  photo: '/profile.jpg',
  resume: {
    href: '/Shubham_resume.pdf',
    fileName: 'Shubham_resume.pdf',
  },
  links: {
    github: 'https://github.com/chaudharyShub',
    linkedin: 'https://www.linkedin.com/in/shubham-chaudhary-4398bba8',
    instagram: 'https://www.instagram.com/_shubham_chaudhary_/',
  } satisfies SocialLinks,
} as const;
