import type { HeadlineLines } from '~/lib/headline';

/**
 * Contact page content.
 *
 * TODO(content): confirm the reassurance line and the response promise.
 */
export const contact = {
  eyebrow: 'Contact',
  headline: [
    [{ text: "Let's talk about" }],
    [{ text: 'the ' }, { text: 'hard', accent: true }, { text: ' part.' }],
  ] as const satisfies HeadlineLines,
  intro:
    "Advisory, speaking, board work or a technology decision you want a second opinion on. Write a few lines and I'll come back to you personally.",
  success: {
    title: 'Thanks — message received.',
    body: "I'll come back to you personally.",
  },
  /** Netlify Forms picks the form up from the built HTML by this name. */
  formName: 'contact',
} as const;
