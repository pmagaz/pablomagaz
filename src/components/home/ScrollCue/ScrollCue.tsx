import './ScrollCue.css';

/**
 * Scroll hint at the bottom of the hero.
 *
 * Only rendered inside the hero, so it exists on the home route alone, and
 * hideOnScroll.ts fades it out as soon as the page moves. It is a real link to
 * the next section, so clicking or tabbing to it does something useful.
 */
export default function ScrollCue() {
  return (
    <a className="pm-scroll-cue" href="/#about" data-scroll-cue aria-label="Scroll to About">
      <svg
        className="pm-scroll-cue__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 4v15" />
        <path d="m18.5 12.5-6.5 6.5-6.5-6.5" />
      </svg>
    </a>
  );
}
