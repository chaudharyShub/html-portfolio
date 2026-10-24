export const SECTION_IDS = ['about', 'skills', 'projects', 'experience', 'contact'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const TAB_IDS = ['home', 'about', 'projects', 'contact'] as const;
export type TabId = (typeof TAB_IDS)[number];

export const TAB_LABELS: Record<TabId, string> = {
  home: 'Home',
  about: 'About',
  projects: 'Projects',
  contact: 'Contact',
};

/** Which sections each tab shows, in display order (the Projects tab lists Projects before Skills). */
export const TAB_SECTIONS: Record<TabId, readonly SectionId[]> = {
  home: ['about', 'skills', 'projects', 'experience', 'contact'],
  about: ['about', 'experience'],
  projects: ['projects', 'skills'],
  contact: ['contact'],
};

/** Tab that contains a given section (used by the logo menu and Terminal shortcuts). */
export const SECTION_TO_TAB: Record<SectionId, TabId> = {
  about: 'about',
  experience: 'about',
  skills: 'projects',
  projects: 'projects',
  contact: 'contact',
};

/** Section order for a tab: visible sections first in tab order, then the hidden ones. */
export function sectionOrder(tab: TabId): SectionId[] {
  const visible = TAB_SECTIONS[tab];
  return [...visible, ...SECTION_IDS.filter((id) => !visible.includes(id))];
}
