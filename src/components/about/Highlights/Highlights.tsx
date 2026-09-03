import { about } from '~/data/about';
import './Highlights.css';

/** Closing band: What I work on · Speaking · Also. */
export default function Highlights() {
  return (
    <section className="pm-highlights pm-band">
      <div className="pm-container pm-highlights__inner" data-reveal-group>
        {about.highlights.map((highlight) => (
          <div className="pm-highlights__item" key={highlight.label}>
            <h3 className="pm-highlights__label">{highlight.label}</h3>
            <p className="pm-highlights__text">{highlight.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
