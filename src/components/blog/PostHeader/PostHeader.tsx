import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import { site } from '~/data/site';
import type { PostSummary } from '~/lib/posts';
import './PostHeader.css';

export interface PostHeaderProps {
  post: PostSummary;
}

/** Title block: back link, category eyebrow, wide title, meta row. */
export default function PostHeader({ post }: PostHeaderProps) {
  return (
    <header className="pm-post-header">
      <div className="pm-container pm-post-header__inner">
        <a className="pm-post-header__back" href="/blog">
          &larr; Back to all posts
        </a>

        <Eyebrow dot tone="red" text={post.category} />

        <h1 className="pm-post-header__title">{post.title}</h1>

        <div className="pm-post-header__meta">
          <time dateTime={post.publishedAtISO}>{post.dateLong}</time>
          <span>{post.readingTime} min read</span>
          <span className="pm-post-header__author">{site.name}</span>
        </div>
      </div>
    </header>
  );
}
