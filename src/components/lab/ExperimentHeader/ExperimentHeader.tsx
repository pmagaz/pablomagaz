import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import type { Experiment } from '~/data/experiments';
import { formatDateLong, toISODate } from '~/lib/format';
import './ExperimentHeader.css';

export interface ExperimentHeaderProps {
  experiment: Experiment;
}

/**
 * Title block for an experiment page. Everything here is server-rendered,
 * which is what keeps the page crawlable even though the canvas below it is
 * a client-only island.
 */
export default function ExperimentHeader({ experiment }: ExperimentHeaderProps) {
  const date = new Date(experiment.date);

  return (
    <header className="pm-experiment-header">
      <div className="pm-container pm-experiment-header__inner" data-reveal-group>
        <a className="pm-experiment-header__back" href="/lab">
          &larr; Back to the lab
        </a>

        <Eyebrow dot tone="red" text={experiment.category} />

        <h1 className="pm-experiment-header__title">{experiment.title}</h1>

        {experiment.description && (
          <p className="pm-experiment-header__description">{experiment.description}</p>
        )}

        <div className="pm-experiment-header__meta">
          <time dateTime={toISODate(date)}>{formatDateLong(date)}</time>
          <span>Drag the canvas · three parameters</span>
        </div>
      </div>
    </header>
  );
}
