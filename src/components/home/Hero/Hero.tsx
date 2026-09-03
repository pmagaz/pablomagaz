import Button from '~/components/common/Button/Button';
import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import Headline from '~/components/common/Headline/Headline';
import { home } from '~/data/home';
import { site } from '~/data/site';
import type { ResponsiveImage } from '~/lib/images';
import './Hero.css';

export interface HeroProps {
  /** Cutout portrait, optimized at build time by the page. */
  portrait: ResponsiveImage;
}

/**
 * Home hero — headline with a red accent word, byline with the brand dot,
 * two CTAs, and the cutout portrait bleeding off the right edge behind the
 * text on desktop. On mobile the portrait drops below the buttons.
 */
export default function Hero({ portrait }: HeroProps) {
  return (
    <section className="pm-hero">
      <div className="pm-container pm-hero__inner">
        <div className="pm-hero__content" data-reveal-hero>
          <Headline lines={home.headline} className="pm-hero__title" />

          <Eyebrow dot text={`${site.name} — ${site.role}`} />

          <div className="pm-hero__actions">
            {home.actions.map((action) => (
              <Button key={action.href} href={action.href} variant={action.variant}>
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="pm-hero__photo" data-reveal>
          <img
            src={portrait.src}
            srcSet={portrait.srcSet}
            sizes="(max-width: 768px) 100vw, 40vw"
            width={portrait.width}
            height={portrait.height}
            alt={portrait.alt}
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
