import type { ReactNode } from 'react';
import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import SocialIcon from '~/components/common/SocialIcon/SocialIcon';
import { site } from '~/data/site';
import './Header.css';

export interface HeaderProps {
  /** Current pathname — passed down because React components have no Astro.url. */
  pathname: string;
  /**
   * On the home route the wordmark starts hidden and fades in once the hero
   * byline has scrolled away. Everywhere else it shows from the start.
   */
  revealBrandOnScroll?: boolean;
  /** The mobile menu island, hydrated by the layout. */
  children?: ReactNode;
}

/** Marks a nav item current for `/blog` and every `/blog/...` page below it. */
export function isCurrent(pathname: string, href: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return path === href || path.startsWith(`${href}/`);
}

export default function Header({
  pathname,
  revealBrandOnScroll = false,
  children,
}: HeaderProps) {
  return (
    <header className="pm-header">
      <div className="pm-container pm-header__inner">
        {/* Same eyebrow treatment as the hero byline it takes over from */}
        <a
          className={`pm-header__brand${revealBrandOnScroll ? '' : ' is-visible'}`}
          href="/"
          aria-label={`${site.name} — home`}
          data-header-brand={revealBrandOnScroll ? 'reveal' : undefined}
        >
          {/* No dot here — that belongs to the hero byline */}
          <Eyebrow text={site.name} />
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
