/**
 * Hides the hero's scroll hint once the page has moved.
 *
 * Progressive enhancement: without JS the arrow simply stays put, which is
 * still correct — it links to the next section.
 */

import { SCROLL_REVEAL_AT } from '~/lib/scroll';

function setup(): void {
  const cue = document.querySelector<HTMLElement>('[data-scroll-cue]');
  if (!cue) return;

  let frame = 0;

  function measure(): void {
    cue!.classList.toggle('is-hidden', window.scrollY > SCROLL_REVEAL_AT);
  }

  function onScroll(): void {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      measure();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // Covers a reload partway down the page.
  measure();
}

setup();

export {};
