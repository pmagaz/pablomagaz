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
    description:
      'Semi-implicit Euler integration with pairwise collisions resolved against a uniform spatial grid, so the cost stays close to linear in the number of balls instead of quadratic. Impulses are exchanged only along the collision normal and shared by mass, which is what makes the big ones shoulder the small ones aside. The cursor is a moving obstacle: balls inside its radius are pushed out and pick up its velocity.',
    category: 'Physics',
    date: '2026-09-04',
    status: 'live',
  },
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
    slug: 'fractal',
    title: 'The edge of the Mandelbrot set',
    excerpt: 'Escape-time iteration in a single fragment shader. Drag to travel.',
    description:
      'Every pixel is a point on the complex plane, iterated under z → z² + c until it escapes a radius of sixteen. The iteration count becomes the colour, smoothed to a fractional value so the bands blend rather than step. One full-screen shader pass per frame, which is why panning stays fluid at two hundred iterations a pixel.',
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
