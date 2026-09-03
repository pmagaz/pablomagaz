import { getCollection, type CollectionEntry } from 'astro:content';
import { POSTS_PER_PAGE, topicLabel } from '~/data/topics';
import { formatDateLong, formatDateShort, readingMinutes, toISODate } from './format';

export type PostEntry = CollectionEntry<'blog'>;

/** A post flattened to plain data for the React components. */
export interface PostSummary {
  slug: string;
  href: string;
  title: string;
  excerpt: string;
  description: string;
  topic: string;
  topicLabel: string;
  category: string;
  publishedAtISO: string;
  dateLong: string;
  dateShort: string;
  readingTime: number;
}

/** Newest first, drafts dropped from production builds. */
export async function getSortedPosts(): Promise<PostEntry[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
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
    description: data.description ?? data.excerpt,
    topic: data.topic,
    topicLabel: topicLabel(data.topic),
    category: data.category ?? topicLabel(data.topic),
    publishedAtISO: toISODate(data.publishedAt),
    dateLong: formatDateLong(data.publishedAt),
    dateShort: formatDateShort(data.publishedAt),
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

/** `/blog`, `/blog/page/2`, `/blog/topic/ai`, `/blog/topic/ai/page/2`. */
export function blogListHref(topic: string | undefined, page: number): string {
  const base = topic ? `/blog/topic/${topic}` : '/blog';
  return page <= 1 ? base : `${base}/page/${page}`;
}

export function totalPages(count: number): number {
  return Math.max(1, Math.ceil(count / POSTS_PER_PAGE));
}

/** Slices posts for one page and builds the footer/pagination model. */
export function paginate(
  posts: PostEntry[],
  page: number,
  topic?: string,
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
      olderHref: current < total ? blogListHref(topic, current + 1) : undefined,
      newerHref: current > 1 ? blogListHref(topic, current - 1) : undefined,
    },
  };
}

/** Up to three other posts for the "keep reading" band, same topic first. */
export function relatedPosts(all: PostEntry[], current: PostEntry, limit = 3): PostEntry[] {
  const others = all.filter((post) => post.id !== current.id);
  const sameTopic = others.filter((post) => post.data.topic === current.data.topic);
  const rest = others.filter((post) => post.data.topic !== current.data.topic);
  return [...sameTopic, ...rest].slice(0, limit);
}
