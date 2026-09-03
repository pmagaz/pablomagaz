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
  lede: 'I am a Senior Executive CTO. I lead engineering organisations through the moments where the technology decision and the business decision are the same decision.',
  paragraphs: [
    'My work sits in three places: the platform a company builds on, the AI it puts in front of customers, and the organisation that has to maintain both once the launch is over. I have done this as a founder, as a consultancy CTO and inside companies mid-transformation — which is mostly a lesson in how differently the same problem looks from each chair.',
    'I speak regularly at industry conferences, mentor technical leaders, and write here about the parts of the job nobody puts in the job description.',
  ],
  portraitAlt: 'Pablo Magaz',
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
