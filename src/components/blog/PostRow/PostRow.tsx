import type { PostSummary } from '~/lib/posts';
import './PostRow.css';

export interface PostRowProps {
  post: PostSummary;
}

/**
 * One archive row. The whole row is the link.
 * Desktop: date · title + excerpt · topic · read time on a 4-column grid.
 * Mobile: topic · title · date and read time, excerpt dropped.
 */
export default function PostRow({ post }: PostRowProps) {
  return (
    <a className="pm-post-row" href={post.href}>
      <time className="pm-post-row__date" dateTime={post.publishedAtISO}>
        {post.dateShort}
      </time>

      <div className="pm-post-row__main">
        <h3 className="pm-post-row__title">{post.title}</h3>
        <p className="pm-post-row__excerpt">{post.excerpt}</p>
      </div>

      <span className="pm-post-row__topic">{post.topicLabel}</span>

      <span className="pm-post-row__read">{post.readingTime} min</span>
    </a>
  );
}
