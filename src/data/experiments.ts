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
    slug: 'fluid',
    title: 'Stable fluid, solved every frame',
    excerpt:
      'An incompressible Navier-Stokes solver running on the GPU. Drag to push dye through the velocity field.',
    description:
      'A semi-Lagrangian fluid solver: advect the velocity field through itself, compute its divergence, solve for the pressure that cancels it with twenty Jacobi iterations, then subtract the pressure gradient to make the field incompressible again. Dye is carried along for the ride. All of it runs in fragment shaders against ping-ponged floating-point framebuffers, which is why it holds sixty frames a second.',
    category: 'Fluids',
    date: '2026-09-04',
    status: 'live',
  },
  {
    slug: 'mandelbrot',
    title: 'Perturbation orbits in the Mandelbrot set',
    excerpt:
      'Deep zooming past the limits of double precision using series approximation.',
    category: 'Fractals',
    date: '2026-09-04',
    status: 'planned',
  },
  {
    slug: 'curl-noise',
    title: 'A million particles in a curl-noise field',
    excerpt: 'Divergence-free flow from the curl of a noise field, integrated on the GPU.',
    category: 'Flow',
    date: '2026-09-04',
    status: 'planned',
  },
  {
    slug: 'reaction-diffusion',
    title: 'Gray-Scott reaction diffusion',
    excerpt: 'Two chemicals, four constants, and most of the patterns in nature.',
    category: 'Systems',
    date: '2026-09-04',
    status: 'planned',
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
