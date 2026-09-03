import { categories } from '~/data/categories';
import { blogListHref } from '~/lib/posts';
import './CategoryPills.css';

export interface CategoryPillsProps {
  /** Undefined means the "All" pill is active. */
  activeCategory?: string;
  /** Category slugs that actually have posts — empty ones are not shown. */
  availableCategories: string[];
}

/**
 * Category filter. Server-rendered page links, not a client-side filter, so
 * every combination is a real static URL.
 */
export default function CategoryPills({
  activeCategory,
  availableCategories,
}: CategoryPillsProps) {
  const shown = categories.filter((category) => availableCategories.includes(category.slug));

  return (
    <nav className="pm-category-pills" aria-label="Filter posts by category">
      <a
        className={`pm-category-pills__pill${activeCategory ? '' : ' is-active'}`}
        href={blogListHref(undefined, 1)}
        aria-current={activeCategory ? undefined : 'page'}
      >
        All
      </a>

      {shown.map((category) => {
        const active = category.slug === activeCategory;
        return (
          <a
            key={category.slug}
            className={`pm-category-pills__pill${active ? ' is-active' : ''}`}
            href={blogListHref(category.slug, 1)}
            aria-current={active ? 'page' : undefined}
          >
            {category.label}
          </a>
        );
      })}
    </nav>
  );
}
