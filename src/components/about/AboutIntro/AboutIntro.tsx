import Button from '~/components/common/Button/Button';
import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import Headline from '~/components/common/Headline/Headline';
import { about } from '~/data/about';
import './AboutIntro.css';

export interface AboutIntroProps {
  /** h2 on the one-page home route, where the hero already owns the h1. */
  headingLevel?: 'h1' | 'h2';
}

/**
 * Narrative bio in two blocks — the professional record and the person —
 * side by side on desktop, stacked on a phone.
 */
export default function AboutIntro({ headingLevel = 'h2' }: AboutIntroProps) {
  return (
    <section className="pm-about-intro">
      <div className="pm-about-intro__prose" data-reveal-group>
        <Eyebrow dot text={about.eyebrow} />

        {/* Slides in from the left so it reads differently to the rest */}
        <Headline
          as={headingLevel}
          lines={about.headline}
          className="pm-about-intro__title"
          data-reveal-from="left"
        />

        <div className="pm-about-intro__blocks">
          {about.blocks.map((block) => (
            <div className="pm-about-intro__block" key={block.label}>
              <h3 className="pm-about-intro__block-label">{block.label}</h3>

              {block.paragraphs.map((paragraph, index) => (
                <p
                  className={`pm-about-intro__body${index === 0 ? ' pm-about-intro__body--lead' : ''}`}
                  key={index}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>

        <Button href="/#contact" className="pm-about-intro__cta">
          Get in touch
        </Button>
      </div>
    </section>
  );
}
