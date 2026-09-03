/**
 * Headlines are stored as lines of tokens so the red accent word stays in the
 * content layer rather than being hardcoded as markup in a component.
 */

export interface HeadlineToken {
  readonly text: string;
  /** Renders in MIO red dark — one word per headline, per the design. */
  readonly accent?: boolean;
}

export type HeadlineLine = readonly HeadlineToken[];
export type HeadlineLines = readonly HeadlineLine[];

/** Flattens a headline to plain text for <title>, meta and aria labels. */
export function headlineToText(lines: HeadlineLines): string {
  return lines
    .map((line) => line.map((token) => token.text).join(''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
