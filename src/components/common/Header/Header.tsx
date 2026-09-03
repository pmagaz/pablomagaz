import type { ReactNode } from 'react';
import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import { site } from '~/data/site';
import './Header.css';

export interface HeaderProps {
  /** Current pathname — passed down because React components have no Astro.url. */
  pathname: string;
  /** The mobile menu island, hydrated by the layout. */
  children?: ReactNode;
}

/** Marks a nav item current for `/blog` and every `/blog/...` page below it. */
export function isCurrent(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return path === href || path.startsWith(`${href}/`);
}

export default function Header({ pathname, children }: HeaderProps) {
  return (
    <header className="pm-header">
      <div className="pm-container pm-header__inner">
        {/* Same treatment as the hero byline */}
        <a className="pm-header__brand" href="/">
          <Eyebrow dot text={site.name} />
        </a>

        <nav className="pm-header__nav" aria-label="Main">
          {site.nav.map((item) => {
            // Section links get their active state from scroll position.
            const current = item.sectionId ? false : isCurrent(pathname, item.href);
            return (
              <a
                key={item.href}
                className={`pm-header__link${current ? ' is-current' : ''}`}
                href={item.href}
                data-nav-section={item.sectionId}
                aria-current={current ? 'page' : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {children}
      </div>
    </header>
  );
}
