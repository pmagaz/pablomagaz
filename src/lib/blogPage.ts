import type { BlogListProps } from '~/components/blog/BlogList/BlogList';
import { getSortedPosts, paginate, toSummary, totalPages } from './posts';

/** Builds every prop the blog index needs for one page of results. */
export async function buildBlogPage(page: number, category?: string): Promise<BlogListProps> {
  const all = await getSortedPosts();
  const availableCategories = [...new Set(all.map((post) => post.data.category))];
  const filtered = category ? all.filter((post) => post.data.category === category) : all;
  const { posts, pageInfo } = paginate(filtered, page, category);

  return {
    posts: posts.map(toSummary),
    pageInfo,
    activeCategory: category,
    availableCategories,
    // Only the unfiltered first page leads with the featured post.
    showFeatured: !category && pageInfo.current === 1,
  };
}

/** Category slugs that actually have posts. */
export async function usedCategories(): Promise<string[]> {
  const all = await getSortedPosts();
  return [...new Set(all.map((post) => post.data.category))];
}

/** Page numbers beyond the first, for getStaticPaths. */
export async function extraPageNumbers(category?: string): Promise<number[]> {
  const all = await getSortedPosts();
  const filtered = category ? all.filter((post) => post.data.category === category) : all;
  const total = totalPages(filtered.length);
  return Array.from({ length: Math.max(0, total - 1) }, (_, index) => index + 2);
}
