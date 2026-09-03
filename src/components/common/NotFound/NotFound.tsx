import Button from '~/components/common/Button/Button';
import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import Headline from '~/components/common/Headline/Headline';
import './NotFound.css';

const HEADLINE = [
  [{ text: 'That page has ' }, { text: 'moved on', accent: true }, { text: '.' }],
] as const;

/** 404 — not in the design handoff, built in the same hairline language. */
export default function NotFound() {
  return (
    <section className="pm-not-found">
      <div className="pm-container pm-not-found__inner">
        <Eyebrow dot text="Error 404" />

        <Headline lines={HEADLINE} className="pm-not-found__title" />

        <p className="pm-not-found__body">
          The link is broken or the page no longer exists. The writing is all still here.
        </p>

        <div className="pm-not-found__actions">
          <Button href="/">Back home</Button>
          <Button href="/blog" variant="secondary">
            Read the blog
          </Button>
        </div>
      </div>
    </section>
  );
}
