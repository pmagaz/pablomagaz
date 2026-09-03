import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import Headline from '~/components/common/Headline/Headline';
import { contact } from '~/data/contact';
import { site } from '~/data/site';
import './ContactInfo.css';

/**
 * Left column: copy at the top, email and social pinned to the bottom above
 * a hairline. The contact block is not shown on the mobile screen.
 */
export default function ContactInfo() {
  return (
    <div className="pm-contact-info">
      <div className="pm-contact-info__copy">
        <Eyebrow dot text={contact.eyebrow} />

        <Headline
          lines={contact.headline}
          className="pm-contact-info__title pm-headline--wrap-mobile"
        />

        <p className="pm-contact-info__intro">{contact.intro}</p>
      </div>

      <div className="pm-contact-info__block">
        <hr className="pm-hairline" />

        <div className="pm-contact-info__details">
          <div className="pm-contact-info__detail">
            <span className="pm-contact-info__detail-label">Email</span>
            <a className="pm-contact-info__detail-value" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </div>

          <div className="pm-contact-info__detail">
            <span className="pm-contact-info__detail-label">Elsewhere</span>
            <span className="pm-contact-info__detail-value">
              {site.social.map((link, index) => (
                <span key={link.href}>
                  {index > 0 && <span aria-hidden="true"> &middot; </span>}
                  <a className="pm-contact-info__social" href={link.href} rel="me noopener" target="_blank">
                    {link.label}
                  </a>
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
