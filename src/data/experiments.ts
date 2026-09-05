/**
 * Lab experiments.
 *
 * A typed registry rather than a content collection: unlike a blog post, an
 * experiment is inseparable from its code module, so there is no prose file
 * to be the source of truth. The metadata here drives the /lab index cards
 * and each experiment's page head.
 */

export type ExperimentStatus = 'live' | 'planned';

export interface Experiment {
  readonly slug: string;
  readonly title: string;
  /** Card and meta description. */
  readonly excerpt: string;
  /** Uppercase label on the card, e.g. "Fluids". */
  readonly category: string;
  /** ISO date, shown on the card. */
  readonly date: string;
  /** `planned` renders a non-interactive card and generates no page. */
  readonly status: ExperimentStatus;
  /** Longer copy, server-rendered above the canvas. */
  readonly description?: string;
}

export const experiments: readonly Experiment[] = [
  {
    slug: 'balls',
    title: 'Two hundred balls and one cursor',
    excerpt:
      'Rigid-body circles under gravity. Sweep the cursor through the pile to shove them around.',
    // Kept under ~76 characters so it holds one line inside the 720px measure.
    description: 'Rigid bodies under gravity, with collisions resolved against a spatial grid.',
    category: 'Physics',
    date: '2026-09-04',
    status: 'live',
  },
  {
    slug: 'galaxy',
    title: 'A flight through the galaxy',
    excerpt:
      'Steer with the pointer, hold to accelerate, and pass suns with planets turning on their orbits.',
    description: 'Stars projected in three dimensions, streaming past as you steer through them.',
    category: 'Space',
    date: '2026-09-05',
    status: 'live',
  },
  {
    slug: 'fluid',
    title: 'Stable fluid, solved every frame',
    excerpt:
      'An incompressible Navier-Stokes solver running on the GPU. Drag to push dye through the velocity field.',
    description: 'A semi-Lagrangian solver that keeps the velocity field incompressible.',
    category: 'Fluids',
    date: '2026-09-04',
    status: 'live',
  },
  {
    slug: 'attractor',
    title: 'A strange attractor that will not sit still',
    excerpt:
      'Two equations, four constants, and a shape with fractional dimension. Move the cursor to reshape it.',
    description: 'Two trigonometric maps, iterated: it never escapes, repeats, or settles.',
    category: 'Fractals',
    date: '2026-09-04',
    status: 'live',
  },
];

export function liveExperiments(): readonly Experiment[] {
  return experiments.filter((experiment) => experiment.status === 'live');
}

export function findExperiment(slug: string): Experiment | undefined {
  return experiments.find((experiment) => experiment.slug === slug);
}

export function experimentHref(slug: string): string {
  return `/lab/${slug}`;
}
