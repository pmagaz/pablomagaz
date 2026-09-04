import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import type { Experiment } from '~/data/experiments';
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
  return (
    <header className="pm-experiment-header">
      <div className="pm-container pm-experiment-header__inner" data-reveal-group>
        {/* Category and back link share one line, back link to the right */}
        <div className="pm-experiment-header__top">
          <Eyebrow dot tone="red" text={experiment.category} />

          <a className="pm-experiment-header__back" href="/lab" aria-label="Back to the lab">
            {/* Chevron rather than a full arrow — &larr; sets much wider */}
            <span className="pm-experiment-header__chevron" aria-hidden="true">
              &lsaquo;
            </span>
            Back
          </a>
        </div>

        <h1 className="pm-experiment-header__title">{experiment.title}</h1>

        {experiment.description && (
          <p className="pm-experiment-header__description">{experiment.description}</p>
        )}
      </div>
    </header>
  );
}
