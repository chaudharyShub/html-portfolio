/** One of the user's own profiles (not a project link). */
export interface ProfileLink {
  label: string;
  /** Short text shown under the name in the link lists (a handle or a hint). */
  detail: string;
  href: string;
}

export type ProfileLinkId = 'github' | 'linkedin' | 'devto' | 'hashnode' | 'instagram';

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
  /** Every profile link, in display order. Add new ones here; the card, menu, Terminal and SEO data follow. */
  links: {
    github: {
      label: 'GitHub',
      detail: '@chaudharyShub',
      href: 'https://github.com/chaudharyShub',
    },
    linkedin: {
      label: 'LinkedIn',
      detail: 'Shubham Chaudhary',
      href: 'https://www.linkedin.com/in/shubham-chaudhary-4398bba8',
    },
    devto: {
      label: 'dev.to',
      detail: '@shubham_works',
      href: 'https://dev.to/shubham_works',
    },
    hashnode: {
      label: 'Hashnode',
      detail: '@shubhamworks',
      href: 'https://shubham-works.hashnode.dev',
    },
    instagram: {
      label: 'Instagram',
      detail: '@_shubham_chaudhary_',
      href: 'https://www.instagram.com/_shubham_chaudhary_/',
    },
  } satisfies Record<ProfileLinkId, ProfileLink>,
} as const;

/** The profile links as a list, in display order, each with its id. */
export const PROFILE_LINKS = (Object.keys(PROFILE.links) as ProfileLinkId[]).map((id) => ({ id, ...PROFILE.links[id] }));
