import type { HeadlineLines } from '~/lib/headline';

export interface CareerRow {
  /** A stage label, not a date — "Now", "Previously", "Earlier". */
  readonly stage: string;
  readonly role: string;
  readonly summary: string;
  /** City, right-aligned on desktop. */
  readonly location: string;
}

export interface AboutBlock {
  readonly label: string;
  readonly paragraphs: readonly string[];
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
  blocks: [
    {
      label: 'Professionally',
      paragraphs: [
        'Chief Technology & AI Officer with a strong technical background and 10+ years in senior leadership roles spanning fast-paced startups and large organizations across multiple countries and international environments, with deep experience delivering platforms in regulated financial and critical-infrastructure environments.',
        'Specializes in building and scaling top talented, distributed and cross-cultural engineering teams of all sizes, fostering a culture of high standards, and guiding organizations through the transition to the Agentic AI era under solid governance to turn innovation into growth.',
      ],
    },
    {
      label: 'Personally',
      paragraphs: [
        'I\u2019m a curious person who loves to learn. Ever since I was a kid I\u2019ve been fascinated by the world around me \u2014 especially technology. I\u2019ve always needed to understand how things work, and that curiosity is what has driven me forward.',
        'When it comes to technology, I won\u2019t pretend otherwise \u2014 I\u2019m a geek at heart. Linux, Rust and Kubernetes are where I feel at home.',
        'Outside of work, I\u2019m an active investor and trader \u2014 an activity built on principles like risk management, probability, discipline and long-term thinking, all of which shape how I make decisions at work.',
      ],
    },
  ] as const satisfies readonly AboutBlock[],
  /** Only the three most recent roles are listed, hence "recent". */
  careerEyebrow: 'Recent career',
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
      summary: 'Stealth mode startup — AI fintech',
      location: 'Zurich',
    },
    {
      stage: 'Earlier',
      role: 'Chief Technology Officer',
      summary: 'One Log — SaaS identity management',
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
