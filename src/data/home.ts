import type { HeadlineLines } from '~/lib/headline';

/**
 * Home page content.
 *
 * TODO(content): this is the approved design copy, which the handoff flags as
 * placeholder. Replace with Pablo's real headline and strapline.
 */
export const home = {
  headline: [
    [{ text: 'Technology' }],
    [{ text: 'that ' }, { text: 'earns', accent: true }],
    [{ text: 'its place.' }],
  ] as const satisfies HeadlineLines,
  actions: [
    { label: 'About me', href: '/about', variant: 'primary' },
    { label: 'Read the blog', href: '/blog', variant: 'secondary' },
  ] as const,
  portraitAlt: 'Pablo Magaz speaking at a conference',
} as const;
