import type { ButtonVariant } from '~/components/common/Button/Button';
import type { HeadlineLines } from '~/lib/headline';

export interface HeroAction {
  readonly label: string;
  readonly href: string;
  readonly variant: ButtonVariant;
}

/**
 * Home page content.
 *
 * TODO(content): this is the approved design copy, which the handoff flags as
 * placeholder. Replace with Pablo's real headline and strapline.
 */
const actions: readonly HeroAction[] = [
  { label: 'About me', href: '/#about', variant: 'primary' },
  { label: 'Read the blog', href: '/blog', variant: 'secondary' },
];

export const home = {
  headline: [
    [{ text: 'Technology' }],
    [{ text: 'that ' }, { text: 'earns', accent: true }],
    [{ text: 'its place.' }],
  ] as const satisfies HeadlineLines,
  actions,
  portraitAlt: 'Pablo Magaz speaking at a conference',
} as const;
