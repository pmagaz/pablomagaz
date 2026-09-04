import type { ReactNode } from 'react';
import SocialIcon from '~/components/common/SocialIcon/SocialIcon';
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
        {/* No visible wordmark, but keep a home link for keyboard and
            screen-reader users — the nav has no other route back to /. */}
        <a className="pm-sr-only" href="/">
          {site.name} &mdash; home
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

          <span className="pm-header__divider" aria-hidden="true" />

          {site.social.map((link) => (
            <a
              key={link.href}
              className="pm-header__social"
              href={link.href}
              rel="me noopener"
              target="_blank"
              aria-label={link.label}
              title={link.label}
            >
              <SocialIcon name={link.icon} />
            </a>
          ))}
        </nav>

        {children}
      </div>
    </header>
  );
}
