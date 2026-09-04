/**
 * Fades the wordmark into the header once the hero has scrolled away, and
 * back out on return to the top. Only the home route opts in — everywhere
 * else the wordmark is shown from the start, since there is no hero byline
 * for it to take over from.
 *
 * Progressive enhancement: without JS the wordmark simply stays visible.
 */

import { SCROLL_REVEAL_AT } from '~/lib/scroll';

function setup(): void {
  const brand = document.querySelector<HTMLElement>('[data-header-brand="reveal"]');
  if (!brand) return;

  let frame = 0;

  function measure(): void {
    brand!.classList.toggle('is-visible', window.scrollY > SCROLL_REVEAL_AT);
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
