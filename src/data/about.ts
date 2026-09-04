import type { HeadlineLines } from '~/lib/headline';

export interface CareerRow {
  /** A stage label, not a date — "Now", "Previously", "Earlier". */
  readonly stage: string;
  readonly role: string;
  readonly summary: string;
  /** City, right-aligned on desktop. */
  readonly location: string;
}

export interface Highlight {
  readonly label: string;
  readonly text: string;
}

/** About page content. */
export const about = {
  eyebrow: 'About',
  // One line — it wraps naturally inside its measure, as drawn in the design.
  headline: [
    [
      { text: 'Twenty years turning strategy into ' },
      { text: 'working', accent: true },
      { text: ' software.' },
    ],
  ] as const satisfies HeadlineLines,
  lede: 'Chief Technology & AI Officer with a strong technical background and 10+ years in senior leadership roles spanning fast-paced startups and large organizations across multiple countries and international environments, with deep experience delivering platforms in regulated financial and critical-infrastructure environments.',
  paragraphs: [
    'Specializes in building engineering teams that deliver and guiding organizations through the transition to the Agentic AI era to unlock efficiency and growth.',
    'Draws on experience leading distributed, cross-cultural teams, balancing long-term technology vision with delivery through efficient resource management.',
  ],
  career: [
    {
      stage: 'Now',
      role: 'Chief Technology & AI Officer',
      summary: 'MIO Group — SaaS, AI, media and CX',
      location: 'Madrid',
    },
    {
      stage: 'Previously',
      role: 'Chief Technology Officer',
      summary: 'Stealth mode — AI fintech',
      location: 'Zurich',
    },
    {
      stage: 'Earlier',
      role: 'Chief Technology Officer',
      summary: 'OneLog — SaaS identity management',
      location: 'Zurich',
    },
  ] as const satisfies readonly CareerRow[],
  highlights: [
    {
      label: 'What I work on',
      text: 'Agentic AI solutions for a new era of software — from strategy through to production, and the engineering organisation that sustains them',
    },
    {
      label: 'Speaking',
      text: 'Multiple talks at events across Europe, in Spanish and English',
    },
    {
      label: 'Also',
      text: 'Advisory work for companies of every size, from a first engineering hire to an established platform team',
    },
  ] as const satisfies readonly Highlight[],
} as const;
