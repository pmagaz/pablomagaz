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
        {/* Same component as the hero byline, so the style is identical */}
        <a className="pm-header__brand" href="/">
          <Eyebrow dot text={`${site.name} — ${site.role}`} />
        </a>

        <nav className="pm-header__nav" aria-label="Main">
          {site.nav.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <a
                key={item.href}
                className={`pm-header__link${current ? ' is-current' : ''}`}
                href={item.href}
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
