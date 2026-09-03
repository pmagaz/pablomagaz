import FeaturedPost from '~/components/blog/FeaturedPost/FeaturedPost';
import Pagination from '~/components/blog/Pagination/Pagination';
import PostRow from '~/components/blog/PostRow/PostRow';
import TopicPills from '~/components/blog/TopicPills/TopicPills';
import type { PageInfo, PostSummary } from '~/lib/posts';
import './BlogList.css';

export interface BlogListProps {
  posts: PostSummary[];
  pageInfo: PageInfo;
  activeTopic?: string;
  availableTopics: string[];
  /** Only the first page of the unfiltered list leads with a featured post. */
  showFeatured: boolean;
}

/**
 * Blog index: title with topic pills, an optional featured lead post, then
 * the archive as hairline index rows, then the pagination footer.
 */
export default function BlogList({
  posts,
  pageInfo,
  activeTopic,
  availableTopics,
  showFeatured,
}: BlogListProps) {
  const [lead, ...rest] = posts;
  const featured = showFeatured ? lead : undefined;
  const rows = featured ? rest : posts;

  return (
    <section className="pm-blog-list">
      <div className="pm-container pm-blog-list__inner">
        <div className="pm-blog-list__head">
          <h1 className="pm-blog-list__title">Blog</h1>
          <TopicPills activeTopic={activeTopic} availableTopics={availableTopics} />
        </div>

        {featured && <FeaturedPost post={featured} />}

        {rows.length > 0 && (
          <div className="pm-blog-list__archive">
            {rows.map((post) => (
              <PostRow key={post.slug} post={post} />
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <p className="pm-blog-list__empty">No posts here yet.</p>
        )}

        {pageInfo.count > 0 && <Pagination pageInfo={pageInfo} />}
      </div>
    </section>
  );
}
