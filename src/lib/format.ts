/** Date and reading-time formatting. All output uses tabular numerals in CSS. */

const LONG = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const SHORT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "12 March 2026" — post detail and the featured lead post. */
export function formatDateLong(date: Date): string {
  return LONG.format(date);
}

/** "12 Mar 2026" — archive rows and cards. */
export function formatDateShort(date: Date): string {
  return SHORT.format(date);
}

/** "2026-03-12" for <time datetime>. */
export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const WORDS_PER_MINUTE = 200;

/**
 * Minutes to read a body of markdown, rounded up and never zero.
 * Frontmatter `readingTime` overrides this when set.
 */
export function readingMinutes(body: string | undefined): number {
  if (!body) return 1;
  const words = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
