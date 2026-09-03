import { getCollection, type CollectionEntry } from 'astro:content';
import { POSTS_PER_PAGE, categoryLabel } from '~/data/categories';
import { formatDateLong, formatDateShort, readingMinutes, toISODate } from './format';

export type PostEntry = CollectionEntry<'blog'>;

/** A post flattened to plain data for the React components. */
export interface PostSummary {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  categoryLabel: string;
  keywords: string[];
  publishedAtISO: string;
  dateLong: string;
  dateShort: string;
  readingTime: number;
}

/** Newest first, drafts dropped from production builds. */
export async function getSortedPosts(): Promise<PostEntry[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function postHref(slug: string): string {
  return `/blog/${slug}`;
}

export function toSummary(entry: PostEntry): PostSummary {
  const { data } = entry;

  return {
    slug: entry.id,
    href: postHref(entry.id),
    title: data.title,
    excerpt: data.excerpt,
    author: data.author,
    category: data.category,
    categoryLabel: categoryLabel(data.category),
    keywords: data.keywords,
    publishedAtISO: toISODate(data.date),
    dateLong: formatDateLong(data.date),
    dateShort: formatDateShort(data.date),
    readingTime: data.readingTime ?? readingMinutes(entry.body),
  };
}

/* ---------- Pagination ---------- */

export interface PageInfo {
  current: number;
  total: number;
  /** 1-based range of posts shown, for "1–6 of 24 posts". */
  from: number;
  to: number;
  count: number;
  /** Older posts — the next page. */
  olderHref?: string;
  /** Newer posts — the previous page. */
  newerHref?: string;
}

/** `/blog`, `/blog/page/2`, `/blog/category/ai`, `/blog/category/ai/page/2`. */
export function blogListHref(category: string | undefined, page: number): string {
  const base = category ? `/blog/category/${category}` : '/blog';
  return page <= 1 ? base : `${base}/page/${page}`;
}

export function totalPages(count: number): number {
  return Math.max(1, Math.ceil(count / POSTS_PER_PAGE));
}

/** Slices posts for one page and builds the footer/pagination model. */
export function paginate(
  posts: PostEntry[],
  page: number,
  category?: string,
): { posts: PostEntry[]; pageInfo: PageInfo } {
  const total = totalPages(posts.length);
  const current = Math.min(Math.max(1, page), total);
  const start = (current - 1) * POSTS_PER_PAGE;
  const slice = posts.slice(start, start + POSTS_PER_PAGE);

  return {
    posts: slice,
    pageInfo: {
      current,
      total,
      from: posts.length === 0 ? 0 : start + 1,
      to: start + slice.length,
      count: posts.length,
      olderHref: current < total ? blogListHref(category, current + 1) : undefined,
      newerHref: current > 1 ? blogListHref(category, current - 1) : undefined,
    },
  };
}

/** Up to three other posts for the "keep reading" band, same category first. */
export function relatedPosts(all: PostEntry[], current: PostEntry, limit = 3): PostEntry[] {
  const others = all.filter((post) => post.id !== current.id);
  const same = others.filter((post) => post.data.category === current.data.category);
  const rest = others.filter((post) => post.data.category !== current.data.category);
  return [...same, ...rest].slice(0, limit);
}
