import type { PostSummary } from '~/lib/posts';
import './PostCard.css';

export interface PostCardProps {
  post: PostSummary;
}

/** White card used in the "keep reading" band. Meta pinned to the bottom. */
export default function PostCard({ post }: PostCardProps) {
  return (
    <a className="pm-post-card" href={post.href}>
      <span className="pm-post-card__category">{post.categoryLabel}</span>
      <span className="pm-post-card__title">{post.title}</span>
      <span className="pm-post-card__meta pm-tnum">
        {post.dateShort} &middot; {post.readingTime} min
      </span>
    </a>
  );
}
