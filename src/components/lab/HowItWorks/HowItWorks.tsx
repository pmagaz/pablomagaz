import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import './HowItWorks.css';

export interface HowItWorksProps {
  /** Four or five short paragraphs. Plain language; name the equation if there is one. */
  paragraphs: readonly string[];
}

/**
 * A short plain-language explanation under an experiment's canvas. Server
 * rendered from the experiment registry, so it is real content on the page
 * rather than something the island draws.
 */
export default function HowItWorks({ paragraphs }: HowItWorksProps) {
  return (
    <section className="pm-how" data-reveal-group>
      <Eyebrow text="How it works" />

      <div className="pm-how__body">
        {paragraphs.map((paragraph, index) => (
          <p className="pm-how__paragraph" key={index}>
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
