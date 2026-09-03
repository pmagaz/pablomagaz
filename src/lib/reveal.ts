/**
 * Reveals content as it scrolls into view.
 *
 * The hidden starting state lives behind `html.pm-js` (set by a tiny inline
 * script in the head, so there is no flash), and each element is unhidden
 * once and then left alone — no animation on the way back out.
 */

declare global {
  interface Window {
    /** Timer set by the inline head script; cleared once this module runs. */
    __pmRevealFailsafe?: ReturnType<typeof setTimeout>;
  }
}

const SELECTOR = '[data-reveal], [data-reveal-group]';

/**
 * Cancels the "unhide everything" failsafe. Without this the timer would fire
 * mid-scroll and reveal the whole page at once.
 */
function cancelFailsafe(): void {
  if (window.__pmRevealFailsafe !== undefined) {
    clearTimeout(window.__pmRevealFailsafe);
    window.__pmRevealFailsafe = undefined;
  }
}

function setup(): void {
  cancelFailsafe();

  const elements = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
  if (elements.length === 0) return;

  // No IntersectionObserver — show everything rather than hide it.
  if (!('IntersectionObserver' in window)) {
    document.documentElement.classList.add('pm-reveal-all');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        // Once revealed it stays revealed.
        observer.unobserve(entry.target);
      }
    },
    {
      // Trigger a little before the element reaches the bottom edge.
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.05,
    },
  );

  const onScreen: HTMLElement[] = [];

  for (const element of elements) {
    const box = element.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.9) {
      onScreen.push(element);
      continue;
    }
    observer.observe(element);
  }

  // Anything already visible at load still animates, but the hidden state has
  // to be painted first — adding the class in this same task would make the
  // browser skip straight to the end and show no transition at all.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      for (const element of onScreen) element.classList.add('is-visible');
    });
  });
}

try {
  setup();
} catch {
  // Never leave content hidden because of a scripting error.
  document.documentElement.classList.add('pm-reveal-all');
}

export {};
