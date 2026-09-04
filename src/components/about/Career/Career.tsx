import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import { about } from '~/data/about';
import './Career.css';

/**
 * Career as a hairline timeline. The first column is a stage label
 * (Now / Previously / Earlier), not a date — "Now" carries the red accent.
 */
export default function Career() {
  return (
    <section className="pm-career">
      <div className="pm-container pm-career__inner">
        <Eyebrow text={about.careerEyebrow} />

        <ol className="pm-career__rows" data-reveal-group>
          {about.career.map((row, index) => (
            <li className="pm-career__row" key={row.stage}>
              <span
                className={`pm-career__stage${index === 0 ? ' pm-career__stage--now' : ''}`}
              >
                {row.stage}
              </span>

              <div className="pm-career__detail">
                <span className="pm-career__role">{row.role}</span>
                <span className="pm-career__summary">{row.summary}</span>
              </div>

              <span className="pm-career__location">{row.location}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
