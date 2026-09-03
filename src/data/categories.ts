/**
 * Blog categories. Slugs are used in URLs (/blog/category/ai) and in each
 * post's `category` frontmatter field; labels are the display casing.
 */
export interface Category {
  readonly slug: string;
  readonly label: string;
}

export const categories = [
  { slug: 'leadership', label: 'Leadership' },
  { slug: 'me', label: 'Me' },
  { slug: 'technology', label: 'Technology' },
  { slug: 'ai', label: 'AI' },
  { slug: 'mentoring', label: 'Mentoring' },
] as const satisfies readonly Category[];

export const categorySlugs = categories.map((category) => category.slug);

export function categoryLabel(slug: string): string {
  return categories.find((category) => category.slug === slug)?.label ?? slug;
}

/** Posts per page on the blog list, matching the design's "1–6 of N". */
export const POSTS_PER_PAGE = 6;
