import type { HeadlineLines } from '~/lib/headline';

export interface CareerRow {
  /** A stage label, not a date — "Now", "Previously", "Earlier". */
  readonly stage: string;
  readonly role: string;
  readonly summary: string;
  /** A short supporting fact, right-aligned on desktop. */
  readonly fact: string;
}

export interface Highlight {
  readonly label: string;
  readonly text: string;
}

/**
 * About page content.
 *
 * TODO(content): every string here is placeholder copy from the design
 * handoff — company names, headcounts, the "20+ years" and "40+ talks"
 * metrics. Replace with Pablo's real bio and career facts before launch.
 */
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
      role: 'Chief Technology Officer',
      summary: 'Company name — platform, data and AI across five markets',
      fact: '120 engineers · 4 countries',
    },
    {
      stage: 'Previously',
      role: 'VP of Engineering',
      summary: 'Company name — rebuilt delivery from project to product',
      fact: '40 engineers',
    },
    {
      stage: 'Earlier',
      role: 'Co-founder & CTO',
      summary: 'Company name — from first commit to acquisition',
      fact: 'Acquired',
    },
  ] as const satisfies readonly CareerRow[],
  highlights: [
    {
      label: 'What I work on',
      text: 'Platform strategy · AI in production · Engineering org design · Technical due diligence',
    },
    {
      label: 'Speaking',
      text: '40+ talks and keynotes on engineering leadership and applied AI, in Spanish and English',
    },
    {
      label: 'Also',
      text: 'Advisor to two early-stage teams · Mentor for first-time CTOs',
    },
  ] as const satisfies readonly Highlight[],
} as const;
