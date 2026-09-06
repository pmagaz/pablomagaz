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
  /** Four or five plain-language paragraphs, server-rendered below the canvas. */
  readonly howItWorks?: readonly string[];
}

export const experiments: readonly Experiment[] = [
  {
    slug: 'balls',
    title: 'Two hundred balls and one cursor',
    excerpt:
      'Rigid-body circles under gravity. Sweep the cursor through the pile to shove them around.',
    // Kept under ~76 characters so it holds one line inside the 720px measure.
    description: 'Rigid bodies under gravity, with collisions resolved against a spatial grid.',
    howItWorks: [
      'Each ball carries only a position and a speed. Gravity adds a little downward speed every frame and the speed moves the ball, which is the whole of the falling. The interesting part is what happens when two of them meet: they are pushed apart and swap speed along the line joining their centres, the same conservation of momentum that decides a snooker break.',
      'Heavier balls give up less of that speed than lighter ones, which is why the big ones shoulder the small ones aside instead of bouncing off them. Every contact is resolved several times per frame until the overlaps are gone, and that repetition is what lets a pile settle into a stable heap rather than jittering forever.',
      'Checking every pair would mean forty thousand comparisons a frame at this count, so the balls are sorted into a grid of cells and each one only consults its nine neighbours. Your cursor is not a pointer but an obstacle with a radius: balls inside it are pushed out and pick up whatever speed it is carrying, so a fast sweep throws them and a slow one just parts the pile.',
    ],
    category: 'Physics',
    date: '2026-09-04',
    status: 'live',
  },
  {
    slug: 'solar-system',
    title: 'The solar system, off its rails',
    excerpt:
      'Eight planets on integrated orbits, with rings and moons. Bend gravity to pull them off course, and click any of them to follow it.',
    description: 'Eight planets, integrated rather than drawn on rails.',
    howItWorks: [
      'Every planet is pulled toward the Sun by Newton\u2019s law of gravitation, F = G\u00b7M\u00b7m / r\u00b2. The part worth keeping is the r\u00b2: the pull falls away with the square of the distance, which is why Mercury is whipped around in a matter of weeks while Neptune takes longer than a human lifetime to get round even once.',
      'Nothing here follows a drawn path. Sixty times a second the simulation asks how hard the Sun is pulling on each planet, nudges its speed by that much, and moves it along. An orbit is never programmed in \u2014 it is simply what falling forever and continually missing happens to look like.',
      'Because the orbits emerge rather than being scripted, the gravity slider genuinely breaks them. Turn it up and the planets are suddenly moving too slowly for the pull, so they spiral inward; turn it down and they carry too much speed and swing out into long ellipses. The faint circles show where each one began, and the brighter trail shows where it has actually been.',
    ],
    category: 'Space',
    date: '2026-09-06',
    status: 'live',
  },
  {
    slug: 'fluid',
    title: 'Stable fluid, solved every frame',
    excerpt:
      'An incompressible Navier-Stokes solver running on the GPU. Drag to push dye through the velocity field.',
    description: 'A semi-Lagrangian solver that keeps the velocity field incompressible.',
    howItWorks: [
      'This solves the Navier\u2013Stokes equations, the same ones behind weather forecasts and aircraft design. The canvas holds two invisible grids: one of velocity, saying which way the fluid is moving at every point, and one of dye, which contributes nothing to the physics and exists only so that the motion is visible. Dragging injects a push into the first and a splash into the second.',
      'Each frame the fluid is carried along by itself. To work out what a point holds now, the solver traces backwards along the velocity to where that stuff must have come from a moment ago, and samples there. Working backwards rather than forwards is what keeps it stable, because nothing can accumulate in a place that was never traced from.',
      'Then comes the step that makes it read as liquid rather than smoke. Real fluid cannot be compressed, so anywhere the flow is piling up has to be cancelled out: the solver measures that pile-up, solves for a pressure that exactly opposes it over twenty passes, and subtracts it back out. All of it runs as one small program per pixel on the graphics card, thousands at a time.',
    ],
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
    howItWorks: [
      'Take a point, run it through a pair of sine and cosine formulas to get another point, and repeat forever. That is the entire rule. The point never flies off to infinity, never lands back exactly where it has already been, and never settles anywhere \u2014 it endlessly wanders a shape it cannot leave, which is what the word attractor means here.',
      'That shape has a fractional dimension: more than a line, less than a surface. Nobody draws it and it is not stored anywhere, it is simply the set of places a wandering point is permitted to go. Nine hundred points wander at once and the canvas counts how often each pixel is visited, so brightness is really dwell time \u2014 the bright filaments are where the system lingers longest.',
      'For any fixed set of constants the figure is a still image, which is why two of the four drift on slow waves of different lengths. Because those lengths never come back into step, the form folds and reopens without ever quite repeating itself. Set drift to zero and it freezes into a single figure you can sit and study.',
    ],
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
