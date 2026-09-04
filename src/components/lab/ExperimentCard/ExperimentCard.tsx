import { experimentHref, type Experiment } from '~/data/experiments';
import './ExperimentCard.css';

export interface ExperimentCardProps {
  experiment: Experiment;
}

/**
 * Grid card. Planned experiments render as a static article rather than a
 * link, so nothing navigates to a page that does not exist yet.
 */
export default function ExperimentCard({ experiment }: ExperimentCardProps) {
  const planned = experiment.status === 'planned';

  const body = (
    <>
      <span className="pm-experiment-card__category">{experiment.category}</span>
      <span className="pm-experiment-card__title">{experiment.title}</span>
      <span className="pm-experiment-card__excerpt">{experiment.excerpt}</span>
      <span className="pm-experiment-card__meta">
        {planned ? 'In progress' : 'Interactive'}
      </span>
    </>
  );

  if (planned) {
    return <article className="pm-experiment-card is-planned">{body}</article>;
  }

  return (
    <a className="pm-experiment-card" href={experimentHref(experiment.slug)}>
      {body}
    </a>
  );
}
