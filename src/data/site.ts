/**
 * Site-wide content and configuration.
 *
 * TODO(content): email, social links and the role strapline are placeholders
 * from the design handoff. Replace with Pablo's real details before launch.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export interface SocialLink {
  readonly label: string;
  readonly href: string;
}

export const site = {
  name: 'Pablo Magaz',
  role: 'Senior Executive CTO',
  /** Used in <title> on the home page and as the OG site name. */
  title: 'Pablo Magaz — Senior Executive CTO',
  description:
    'Pablo Magaz is a Senior Executive CTO working on platform strategy, AI in production and engineering organisation design.',
  email: 'hola@pablomagaz.com',
  authorBio: 'Senior Executive CTO — platforms, AI, org design',
  nav: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ] as const satisfies readonly NavItem[],
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/pablomagaz/' },
    { label: 'X', href: 'https://x.com/pablomagaz' },
  ] as const satisfies readonly SocialLink[],
} as const;

export type Site = typeof site;
