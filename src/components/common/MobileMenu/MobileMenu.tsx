import { useCallback, useEffect, useRef, useState } from 'react';
import { site } from '~/data/site';
import { isCurrent } from '~/components/common/Header/Header';
import './MobileMenu.css';

export interface MobileMenuProps {
  /** Current pathname, used to mark the active link. */
  pathname: string;
}

const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * Full-screen ink overlay.
 *
 * The panel was not in the design handoff; this implements the documented
 * intended behaviour (ink overlay, three links at 28–32px) plus the
 * accessibility basics: Escape to close, focus trap, scroll lock.
 *
 * This is the only interactive part of the header, so it is the only piece
 * hydrated on the client — the nav links themselves are static HTML.
 */
export default function MobileMenu({ pathname }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Scroll lock while the overlay covers the page.
  useEffect(() => {
    document.documentElement.classList.toggle('pm-scroll-locked', open);
    return () => document.documentElement.classList.remove('pm-scroll-locked');
  }, [open]);

  // Move focus into the panel on open, back to the toggle on close.
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }
  }, [open]);

  // Escape closes; Tab is trapped inside the panel.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  // The panel is desktop-irrelevant — drop it if the viewport grows.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 769px)');
    function onChange(event: MediaQueryListEvent) {
      if (event.matches) close();
    }
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [close]);

  return (
    <div className="pm-mobile-menu">
      <button
        ref={toggleRef}
        className="pm-mobile-menu__toggle"
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="pm-mobile-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="pm-mobile-menu__bars" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      <div
        ref={panelRef}
        className="pm-mobile-menu__panel"
        id="pm-mobile-menu-panel"
        hidden={!open}
      >
        <div className="pm-mobile-menu__panel-head">
          <span className="pm-mobile-menu__panel-brand">{site.name}</span>
          <button
            className="pm-mobile-menu__close"
            type="button"
            aria-label="Close menu"
            onClick={() => {
              close();
              toggleRef.current?.focus();
            }}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <nav className="pm-mobile-menu__nav" aria-label="Main">
          {site.nav.map((item) => (
            <a
              key={item.href}
              className={`pm-mobile-menu__link${isCurrent(pathname, item.href) ? ' is-current' : ''}`}
              href={item.href}
              onClick={close}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a className="pm-mobile-menu__email" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </div>
    </div>
  );
}
