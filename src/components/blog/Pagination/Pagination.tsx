import Button from '~/components/common/Button/Button';
import type { PageInfo } from '~/lib/posts';
import './Pagination.css';

export interface PaginationProps {
  pageInfo: PageInfo;
}

/**
 * Footer of the archive: the range summary and page links.
 * Server-side page links, not infinite scroll — every page is a static URL.
 */
export default function Pagination({ pageInfo }: PaginationProps) {
  const { from, to, count, newerHref, olderHref } = pageInfo;
  const label = count === 1 ? 'post' : 'posts';

  return (
    <div className="pm-pagination">
      <span className="pm-pagination__count pm-tnum">
        {from}&ndash;{to} of {count} {label}
      </span>

      {(newerHref || olderHref) && (
        <div className="pm-pagination__links">
          {newerHref && (
            <Button href={newerHref} variant="secondary" rel="prev">
              &larr; Newer posts
            </Button>
          )}
          {olderHref && (
            <Button href={olderHref} variant="secondary" rel="next">
              Older posts &rarr;
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
