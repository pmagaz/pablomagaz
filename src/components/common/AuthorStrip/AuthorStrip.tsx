import Button from '~/components/common/Button/Button';
import { site } from '~/data/site';
import type { ResponsiveImage } from '~/lib/images';
import './AuthorStrip.css';

export interface AuthorStripProps {
  /** The portrait, cropped circular by css. */
  avatar: ResponsiveImage;
}

/** Author byline closing an article, with a "get in touch" CTA. */
export default function AuthorStrip({ avatar }: AuthorStripProps) {
  return (
    <div className="pm-author-strip">
      <div className="pm-container pm-author-strip__inner">
        <div className="pm-author-strip__identity">
          <span className="pm-author-strip__avatar">
            <img src={avatar.src} width={avatar.width} height={avatar.height} alt="" aria-hidden="true" />
          </span>

          <span className="pm-author-strip__text">
            <span className="pm-author-strip__name">{site.name}</span>
            <span className="pm-author-strip__role">{site.authorBio}</span>
          </span>
        </div>

        <Button href="/contact" className="pm-author-strip__cta">
          Get in touch
        </Button>
      </div>
    </div>
  );
}
