import { site } from '~/data/site';
import './Footer.css';

export interface FooterProps {
  /** Rendered at build time, so the year is the year of the last deploy. */
  year: number;
}

/**
 * The footer was not part of the design handoff. This keeps the same
 * hairline language: one rule, muted 13px meta, no shadows.
 */
export default function Footer({ year }: FooterProps) {
  return (
    <footer className="pm-footer">
      <div className="pm-container pm-footer__inner">
        <div className="pm-footer__identity">
          <span className="pm-footer__name">{site.name}</span>
          <span className="pm-footer__role">{site.role}</span>
        </div>

        <nav className="pm-footer__links" aria-label="Footer">
          {site.nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          {site.social.map((link) => (
            <a key={link.href} href={link.href} rel="me noopener" target="_blank">
              {link.label}
            </a>
          ))}
        </nav>

        <span className="pm-footer__copy pm-tnum">&copy; {year}</span>
      </div>
    </footer>
  );
}
