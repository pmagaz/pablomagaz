import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import type { PostSummary } from '~/lib/posts';
import './FeaturedPost.css';

export interface FeaturedPostProps {
  post: PostSummary;
}

/**
 * The lead post on page one: ink top rule, hairline bottom rule, meta and
 * "read the post" pinned right on desktop.
 */
export default function FeaturedPost({ post }: FeaturedPostProps) {
  return (
    <a className="pm-featured" href={post.href}>
      <div className="pm-featured__main">
        <Eyebrow dot tone="red" text={`Latest · ${post.topicLabel}`} />

        <h2 className="pm-featured__title">{post.title}</h2>
        <p className="pm-featured__excerpt">{post.excerpt}</p>
      </div>

      <div className="pm-featured__meta">
        <time dateTime={post.publishedAtISO}>{post.dateLong}</time>
        <span>{post.readingTime} min read</span>
        <span className="pm-featured__cta">Read the post &rarr;</span>
      </div>
    </a>
  );
}
