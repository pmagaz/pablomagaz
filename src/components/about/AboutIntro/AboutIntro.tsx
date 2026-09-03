import Button from '~/components/common/Button/Button';
import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import Headline from '~/components/common/Headline/Headline';
import { about } from '~/data/about';
import type { ResponsiveImage } from '~/lib/images';
import './AboutIntro.css';

export interface AboutIntroProps {
  portrait: ResponsiveImage;
  /** h2 on the one-page home route, where the hero already owns the h1. */
  headingLevel?: 'h1' | 'h2';
}

/**
 * Narrative bio beside a surface-tinted photo panel.
 * Prose comes first in the DOM; css moves the panel above it on mobile.
 */
export default function AboutIntro({ portrait, headingLevel = 'h2' }: AboutIntroProps) {
  return (
    <section className="pm-about-intro">
      <div className="pm-about-intro__prose" data-reveal-group>
        <Eyebrow dot text={about.eyebrow} />

        <Headline
          as={headingLevel}
          lines={about.headline}
          className="pm-about-intro__title"
        />

        <p className="pm-about-intro__lede">{about.lede}</p>

        {about.paragraphs.map((paragraph, index) => (
          <p
            className={`pm-about-intro__body${index > 0 ? ' pm-about-intro__body--secondary' : ''}`}
            key={index}
          >
            {paragraph}
          </p>
        ))}

        <Button href="/contact" className="pm-about-intro__cta">
          Get in touch
        </Button>
      </div>

      <div className="pm-about-intro__panel" data-reveal>
        <img
          src={portrait.src}
          srcSet={portrait.srcSet}
          sizes="(max-width: 768px) 100vw, 460px"
          width={portrait.width}
          height={portrait.height}
          alt={portrait.alt}
          decoding="async"
        />
      </div>
    </section>
  );
}
