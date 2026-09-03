import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import Headline from '~/components/common/Headline/Headline';
import { contact } from '~/data/contact';
import './ContactInfo.css';

/** Left column of the contact page: eyebrow, headline and intro copy. */
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
    </div>
  );
}
