import PostCard from '~/components/blog/PostCard/PostCard';
import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import type { PostSummary } from '~/lib/posts';
import './KeepReading.css';

export interface KeepReadingProps {
  posts: PostSummary[];
}

/** Grey band closing a post with up to three further reads. */
export default function KeepReading({ posts }: KeepReadingProps) {
  if (posts.length === 0) return null;

  return (
    <aside className="pm-keep-reading pm-band">
      <div className="pm-container pm-keep-reading__inner">
        <Eyebrow text="Keep reading" />

        <div className="pm-keep-reading__grid">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </aside>
  );
}
