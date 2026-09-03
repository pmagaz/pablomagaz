import type { BlogListProps } from '~/components/blog/BlogList/BlogList';
import { getSortedPosts, paginate, toSummary, totalPages } from './posts';

/** Builds every prop the blog index needs for one page of results. */
export async function buildBlogPage(page: number, topic?: string): Promise<BlogListProps> {
  const all = await getSortedPosts();
  const availableTopics = [...new Set(all.map((post) => post.data.topic))];
  const filtered = topic ? all.filter((post) => post.data.topic === topic) : all;
  const { posts, pageInfo } = paginate(filtered, page, topic);

  return {
    posts: posts.map(toSummary),
    pageInfo,
    activeTopic: topic,
    availableTopics,
    // Only the unfiltered first page leads with the featured post.
    showFeatured: !topic && pageInfo.current === 1,
  };
}

/** Page numbers beyond the first, for getStaticPaths. */
export async function extraPageNumbers(topic?: string): Promise<number[]> {
  const all = await getSortedPosts();
  const filtered = topic ? all.filter((post) => post.data.topic === topic) : all;
  const total = totalPages(filtered.length);
  return Array.from({ length: Math.max(0, total - 1) }, (_, index) => index + 2);
}
