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

export interface SocialLink {
  readonly label: string;
  readonly href: string;
}

/**
 * Explicitly typed rather than `as const`, so `sectionId` is readable on
 * every item instead of only the ones that declare it.
 */
const nav: readonly NavItem[] = [
  { label: 'About', href: '/#about', sectionId: 'about' },
  { label: 'Contact', href: '/#contact', sectionId: 'contact' },
  { label: 'Blog', href: '/blog' },
];

export const site = {
  name: 'Pablo Magaz',
  role: 'Chief Technical Officer',
  /** Used in <title> on the home page and as the OG site name. */
  title: 'Pablo Magaz — Chief Technical Officer',
  description:
    'Pablo Magaz is a Chief Technical Officer working on platform strategy, AI in production and engineering organisation design.',
  email: 'hola@pablomagaz.com',
  authorBio: 'Chief Technical Officer — platforms, AI, org design',
  /** GA4 measurement id. Only loaded in production builds. */
  analyticsId: 'G-1WMZ9FNRR3',
  nav,
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/pablomagaz/' },
    { label: 'X', href: 'https://x.com/pablomagaz' },
  ] as const satisfies readonly SocialLink[],
} as const;

export type Site = typeof site;
