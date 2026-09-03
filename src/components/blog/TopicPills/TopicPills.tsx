import { topics } from '~/data/topics';
import { blogListHref } from '~/lib/posts';
import './TopicPills.css';

export interface TopicPillsProps {
  /** Undefined means the "All" pill is active. */
  activeTopic?: string;
  /** Topic slugs that actually have posts — empty topics are not shown. */
  availableTopics: string[];
}

/**
 * Topic filter. Server-rendered page links, not a client-side filter, so
 * every combination is a real static URL.
 */
export default function TopicPills({ activeTopic, availableTopics }: TopicPillsProps) {
  const shown = topics.filter((topic) => availableTopics.includes(topic.slug));

  return (
    <nav className="pm-topic-pills" aria-label="Filter posts by topic">
      <a
        className={`pm-topic-pills__pill${activeTopic ? '' : ' is-active'}`}
        href={blogListHref(undefined, 1)}
        aria-current={activeTopic ? undefined : 'page'}
      >
        All
      </a>

      {shown.map((topic) => {
        const active = topic.slug === activeTopic;
        return (
          <a
            key={topic.slug}
            className={`pm-topic-pills__pill${active ? ' is-active' : ''}`}
            href={blogListHref(topic.slug, 1)}
            aria-current={active ? 'page' : undefined}
          >
            {topic.label}
          </a>
        );
      })}
    </nav>
  );
}
