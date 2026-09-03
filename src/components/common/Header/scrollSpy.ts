/**
 * Highlights the nav item for the section currently in view on the one-page
 * home route. Progressive enhancement only: the nav is already correct HTML,
 * this just toggles a class as you scroll.
 *
 * Runs against every `[data-nav-section]` link, so the header nav and the
 * mobile menu stay in sync.
 */

type Link = HTMLAnchorElement;

function setup(): void {
  const links = Array.from(document.querySelectorAll<Link>('[data-nav-section]'));
  if (links.length === 0) return;

  const targets = links
    .map((link) => {
      const id = link.dataset.navSection;
      const section = id ? document.getElementById(id) : null;
      return section ? { id: section.id, section } : null;
    })
    .filter((entry): entry is { id: string; section: HTMLElement } => entry !== null);

  // Not the one-pager (e.g. a blog page) — nothing to track.
  if (targets.length === 0) return;

  let frame = 0;

  function apply(activeId: string | null): void {
    for (const link of links) {
      const on = link.dataset.navSection === activeId;
      link.classList.toggle('is-current', on);
      if (on) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  function measure(): void {
    // Probe a third of the way down the viewport: a section becomes active
    // once it has genuinely taken over the screen.
    const probe = window.scrollY + window.innerHeight * 0.34;
    let activeId: string | null = null;

    for (const { id, section } of targets) {
      if (section.offsetTop <= probe) activeId = id;
    }

    // At the very bottom the last section always wins, even if it is short.
    const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;
    if (atBottom) activeId = targets[targets.length - 1]?.id ?? activeId;

    apply(activeId);
  }

  function onScroll(): void {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  measure();
}

setup();

export {};
