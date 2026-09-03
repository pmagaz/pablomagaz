/**
 * Topic taxonomy. Slugs are used in URLs (/blog/topic/ai), labels are the
 * display casing shown in pills and category labels.
 *
 * TODO(content): confirm the real taxonomy with Pablo.
 */
export interface Topic {
  readonly slug: string;
  readonly label: string;
}

export const topics = [
  { slug: 'leadership', label: 'Leadership' },
  { slug: 'ai', label: 'AI' },
  { slug: 'platforms', label: 'Platforms' },
  { slug: 'org-design', label: 'Org design' },
] as const satisfies readonly Topic[];

export function topicLabel(slug: string): string {
  return topics.find((topic) => topic.slug === slug)?.label ?? slug;
}

/** Posts per page on the blog list, matching the design's "1–6 of N". */
export const POSTS_PER_PAGE = 6;
