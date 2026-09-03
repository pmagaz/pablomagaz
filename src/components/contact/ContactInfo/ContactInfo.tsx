import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import Headline from '~/components/common/Headline/Headline';
import { contact } from '~/data/contact';
import './ContactInfo.css';

export interface ContactInfoProps {
  /** h2 on the one-page home route, where the hero already owns the h1. */
  headingLevel?: 'h1' | 'h2';
}

/** Left column of the contact section: eyebrow, headline and intro copy. */
export default function ContactInfo({ headingLevel = 'h2' }: ContactInfoProps) {
  return (
    <div className="pm-contact-info">
      <div className="pm-contact-info__copy" data-reveal-group>
        <Eyebrow dot text={contact.eyebrow} />

        <Headline
          as={headingLevel}
          lines={contact.headline}
          className="pm-contact-info__title pm-headline--wrap-mobile"
        />

        <p className="pm-contact-info__intro">{contact.intro}</p>
      </div>
    </div>
  );
}
