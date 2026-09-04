import Eyebrow from '~/components/common/Eyebrow/Eyebrow';
import ExperimentCard from '~/components/lab/ExperimentCard/ExperimentCard';
import type { Experiment } from '~/data/experiments';
import './LabIndex.css';

export interface LabIndexProps {
  experiments: readonly Experiment[];
}

/**
 * Lab index: title, intro, and every experiment as a card. Unlike the blog
 * there is no featured lead — each experiment is equally a thing to open.
 */
export default function LabIndex({ experiments }: LabIndexProps) {
  return (
    <section className="pm-lab">
      <div className="pm-container pm-lab__inner">
        <div className="pm-lab__head" data-reveal-group>
          {/* Same eyebrow treatment as the contact section */}
          <Eyebrow dot text="Lab" />

          <h1 className="pm-lab__title">A space for experiments</h1>
          <p className="pm-lab__intro">
            Things I build to understand how they work. Each one is interactive
            and open to being pushed around.
          </p>
        </div>

        <div className="pm-lab__grid" data-reveal-group>
          {experiments.map((experiment) => (
            <ExperimentCard key={experiment.slug} experiment={experiment} />
          ))}
        </div>
      </div>
    </section>
  );
}
