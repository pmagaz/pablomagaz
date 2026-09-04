/**
 * Site-wide content and configuration.
 *
 * TODO(content): email, social links and the role strapline are placeholders
 * from the design handoff. Replace with Pablo's real details before launch.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
  /**
   * Set when the item points at a section of the one-page home route.
   * Scroll position drives the active state for these; path drives the rest.
   */
  readonly sectionId?: string;
}

export type SocialIconName = 'linkedin' | 'github';

export interface SocialLink {
  readonly label: string;
  readonly href: string;
  readonly icon: SocialIconName;
}

/**
 * Explicitly typed rather than `as const`, so `sectionId` is readable on
 * every item instead of only the ones that declare it.
 */
const nav: readonly NavItem[] = [
  { label: 'About', href: '/#about', sectionId: 'about' },
  { label: 'Contact', href: '/#contact', sectionId: 'contact' },
  { label: 'Blog', href: '/blog' },
  { label: 'Lab', href: '/lab' },
];

const social: readonly SocialLink[] = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/pablo-magaz', icon: 'linkedin' },
  { label: 'GitHub', href: 'https://github.com/pmagaz', icon: 'github' },
];

export const site = {
  name: 'Pablo Magaz',
  role: 'Chief Technology & AI Officer',
  /** Used in <title> on the home page and as the OG site name. */
  title: 'Pablo Magaz — Chief Technology & AI Officer',
  description:
    'Pablo Magaz is a Chief Technology & AI Officer building engineering teams that deliver and guiding organizations through the transition to the Agentic AI era.',
  email: 'hola@pablomagaz.com',
  authorBio: 'Chief Technology & AI Officer',
  /** GA4 measurement id. Only loaded in production builds. */
  analyticsId: 'G-1WMZ9FNRR3',
  nav,
  social,
} as const;

export type Site = typeof site;
