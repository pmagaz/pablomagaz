/**
 * The solar system, actually integrated rather than drawn on rails.
 *
 * Physics runs in astronomical units, years and solar masses, where G = 4π² —
 * the units that make Earth's orbit come out at exactly one year. Each planet
 * is accelerated by the Sun alone (planet-planet pulls are four orders of
 * magnitude smaller) and advanced with velocity Verlet, in substeps derived
 * from the simulated interval so the orbits stay closed at any speed.
 *
 * Because it is a real integration, changing gravity does what it should:
 * raise it and the planets are moving too slowly for the pull, so they spiral
 * inward; lower it and they carry too much speed and swing wide.
 *
 * The view is an orrery seen from a shallow angle rather than from straight
 * above: the orbital plane is foreshortened by cos(tilt), which turns the
 * circles into ellipses and gives the system a horizon. Bodies are painted
 * back to front so nearer ones overlap the Sun, and Saturn's rings are drawn
 * in two halves either side of the planet so it sits inside them.
 *
 * Distance is compressed as √r for display only — it fits Neptune on screen
 * beside Mercury and, being radial, still maps circles to circles.
 */

import { css, mix, readBrand } from '~/lib/palette';

export interface SolarParams {
  /** Multiplies G. 1 is our own solar system. */
  gravity: number;
  /** Years of simulation per second of real time. */
  speed: number;
  /** Viewing angle above the orbital plane, in degrees. 0 is straight down. */
  tilt: number;
}

export interface SolarHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  reseed(): void;
  focus(index: number): void;
  onFocusChange(listener: (name: string) => void): void;
}

/** G in AU³ / (solar mass · year²). */
const G = 4 * Math.PI * Math.PI;

/**
 * Target integration step, in years. Substeps derive from this rather than
 * being fixed, because the simulated interval scales with the speed slider.
 */
const TARGET_STEP = 0.002;
const MIN_SUBSTEPS = 4;
const MAX_SUBSTEPS = 64;

const TRAIL_POINTS = 200;
const SUN_RADIUS = 0.05;
const ESCAPE = 90;

const MIN_ZOOM = 1;
const MAX_ZOOM = 16;
/** How quickly the view eases toward the pointer's zoom. */
const ZOOM_EASE = 3.2;

interface Moon {
  name: string;
  /** Orbit radius, in multiples of the parent's drawn radius. */
  orbit: number;
  /** Radians per simulated year. */
  rate: number;
  size: number;
  angle: number;
}

interface Planet {
  name: string;
  /** Semi-major axis, AU. */
  a: number;
  /** Equatorial radius relative to Earth. */
  size: number;
  rings?: { inner: number; outer: number };
  /** Faint horizontal banding, for the gas giants. */
  banded?: boolean;
  moons: Moon[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  trail: Float32Array;
  trailAt: number;
  trailLen: number;
  color: string;
  ringColor: string;
}

function moon(name: string, orbit: number, rate: number, size: number): Moon {
  return { name, orbit, rate, size, angle: Math.random() * Math.PI * 2 };
}

/**
 * Explicitly typed rather than `as const`: that narrows every literal, and
 * then `rings` and `banded` are unreadable on the planets that omit them.
 */
interface PlanetData {
  readonly name: string;
  readonly a: number;
  readonly size: number;
  readonly rings?: { readonly inner: number; readonly outer: number };
  readonly banded?: boolean;
  readonly moons: readonly Moon[];
}

const DATA: readonly PlanetData[] = [
  { name: 'Mercury', a: 0.387, size: 0.383, moons: [] },
  { name: 'Venus', a: 0.723, size: 0.949, moons: [] },
  { name: 'Earth', a: 1.0, size: 1.0, moons: [moon('Moon', 2.6, 84, 0.27)] },
  {
    name: 'Mars',
    a: 1.524,
    size: 0.532,
    moons: [moon('Phobos', 2.0, 800, 0.12), moon('Deimos', 3.0, 200, 0.1)],
  },
  {
    name: 'Jupiter',
    a: 5.203,
    size: 10.97,
    banded: true,
    moons: [
      moon('Io', 1.9, 129, 0.29),
      moon('Europa', 2.5, 64, 0.25),
      moon('Ganymede', 3.2, 32, 0.41),
      moon('Callisto', 4.2, 14, 0.38),
    ],
  },
  {
    name: 'Saturn',
    a: 9.537,
    size: 9.14,
    banded: true,
    rings: { inner: 1.5, outer: 2.4 },
    moons: [moon('Titan', 3.4, 23, 0.4)],
  },
  { name: 'Uranus', a: 19.191, size: 3.98, rings: { inner: 1.6, outer: 2.0 }, moons: [] },
  { name: 'Neptune', a: 30.07, size: 3.86, moons: [moon('Triton', 2.8, -62, 0.21)] },
];

export function createSolarSim(
  canvas: HTMLCanvasElement,
  params: SolarParams,
): SolarHandle | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  const brand = readBrand();
  const groundFill = css(brand.stage);
  const sunFill = css(brand.tint);
  const sunHalo = css(brand.tint, 0.14);
  const labelFill = css(brand.onInk, 0.5);
  const orbitStroke = css(brand.onInk, 0.09);
  const focusStroke = css(brand.tint, 0.5);
  const moonFill = css(brand.onInk, 0.75);
  const moonOrbit = css(brand.onInk, 0.14);
  const bandStroke = css(brand.stage, 0.35);

  const planets: Planet[] = DATA.map((data, index) => {
    const t = index / (DATA.length - 1);
    const base = t < 0.5 ? mix(brand.red, brand.ember, t * 2) : mix(brand.ember, brand.tint, (t - 0.5) * 2);
    return {
      name: data.name,
      a: data.a,
      size: data.size,
      rings: data.rings ? { ...data.rings } : undefined,
      banded: Boolean(data.banded),
      moons: data.moons.map((m) => ({ ...m })),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      alive: true,
      trail: new Float32Array(TRAIL_POINTS * 2),
      trailAt: 0,
      trailLen: 0,
      color: css(base),
      ringColor: css(base, 0.55),
    };
  });

  function reseed(): void {
    for (const planet of planets) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.sqrt(G / planet.a);
      planet.x = Math.cos(angle) * planet.a;
      planet.y = Math.sin(angle) * planet.a;
      planet.vx = -Math.sin(angle) * speed;
      planet.vy = Math.cos(angle) * speed;
      planet.alive = true;
      planet.trailAt = 0;
      planet.trailLen = 0;
    }
  }

  reseed();

  /* --------------------------------------------------------------- focus */

  let focusIndex = -1;
  let focusListener: ((name: string) => void) | null = null;

  function setFocus(index: number): void {
    focusIndex = index;
    focusListener?.(index < 0 ? 'The system' : planets[index]!.name);
  }

  /* -------------------------------------------------------------- canvas */

  let width = 0;
  let height = 0;

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.floor(canvas.clientWidth));
    const nextHeight = Math.max(1, Math.floor(canvas.clientHeight));
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ------------------------------------------------------- pointer, zoom */

  // Zoom follows the pointer's height: up is closer. Eased, so it glides
  // rather than snapping about as the cursor moves.
  let zoom = MIN_ZOOM;
  let zoomTarget = MIN_ZOOM;

  function onPointerMove(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    const t = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    zoomTarget = MIN_ZOOM + Math.pow(t, 1.6) * (MAX_ZOOM - MIN_ZOOM);
  }

  function onPointerDown(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    let nearest = -1;
    let best = 36 * 36;
    for (let i = 0; i < planets.length; i += 1) {
      const planet = planets[i]!;
      if (!planet.alive) continue;
      const p = toScreen(planet.x, planet.y);
      const d2 = (p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my);
      if (d2 < best) {
        best = d2;
        nearest = i;
      }
    }
    setFocus(nearest);
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);

  /* ---------------------------------------------------------- projection */

  function compress(r: number): number {
    return Math.sqrt(r);
  }

  function cosTilt(): number {
    // Never fully edge-on: below this the orbits collapse to a line.
    return Math.max(0.12, Math.cos((params.tilt * Math.PI) / 180));
  }

  function baseScale(): number {
    return (Math.min(width, height) / 2 / compress(DATA[DATA.length - 1]!.a)) * 0.9;
  }

  /** Radial compression, in the orbital plane. */
  function plane(x: number, y: number): { x: number; y: number } {
    const r = Math.hypot(x, y);
    const k = r > 1e-6 ? compress(r) / r : 0;
    return { x: x * k, y: y * k };
  }

  function focusPoint(): { x: number; y: number } {
    if (focusIndex < 0) return { x: 0, y: 0 };
    const planet = planets[focusIndex]!;
    return plane(planet.x, planet.y);
  }

  function toScreen(x: number, y: number): { x: number; y: number; depth: number } {
    const p = plane(x, y);
    const focus = focusPoint();
    const scale = baseScale() * zoom;
    return {
      x: width / 2 + (p.x - focus.x) * scale,
      // Foreshortened: this is what turns the plane into a horizon.
      y: height / 2 + (p.y - focus.y) * cosTilt() * scale,
      depth: p.y,
    };
  }

  /* ---------------------------------------------------------------- step */

  function step(dt: number): void {
    const gm = G * params.gravity;
    const span = dt * params.speed;
    const substeps = Math.min(MAX_SUBSTEPS, Math.max(MIN_SUBSTEPS, Math.ceil(span / TARGET_STEP)));
    const h = span / substeps;

    for (let s = 0; s < substeps; s += 1) {
      for (const planet of planets) {
        if (!planet.alive) continue;

        // Velocity Verlet: half-kick, drift, half-kick.
        let r2 = planet.x * planet.x + planet.y * planet.y;
        let inv = gm / (r2 * Math.sqrt(r2));
        planet.vx += -planet.x * inv * h * 0.5;
        planet.vy += -planet.y * inv * h * 0.5;
        planet.x += planet.vx * h;
        planet.y += planet.vy * h;
        r2 = planet.x * planet.x + planet.y * planet.y;
        inv = gm / (r2 * Math.sqrt(r2));
        planet.vx += -planet.x * inv * h * 0.5;
        planet.vy += -planet.y * inv * h * 0.5;

        const r = Math.sqrt(r2);
        if (r < SUN_RADIUS || r > ESCAPE) planet.alive = false;
      }
    }

    for (const planet of planets) {
      if (!planet.alive) continue;
      planet.trail[planet.trailAt * 2] = planet.x;
      planet.trail[planet.trailAt * 2 + 1] = planet.y;
      planet.trailAt = (planet.trailAt + 1) % TRAIL_POINTS;
      if (planet.trailLen < TRAIL_POINTS) planet.trailLen += 1;
      for (const m of planet.moons) m.angle += m.rate * span;
    }
  }

  /* -------------------------------------------------------------- render */

  function drawPlanet(planet: Planet, index: number): void {
    const p = toScreen(planet.x, planet.y);
    const k = cosTilt();
    const zoomBoost = Math.sqrt(Math.min(zoom, 10));
    const radius = Math.max(1.8, Math.pow(planet.size, 0.4) * 3.1 * zoomBoost);

    // Rings are drawn in two halves so the planet sits inside them.
    const ring = planet.rings
      ? { rx: radius * planet.rings.outer, ry: radius * planet.rings.outer * k, inner: planet.rings.inner }
      : null;

    if (ring) {
      ctx!.strokeStyle = planet.ringColor;
      ctx!.lineWidth = Math.max(1, radius * (planet.rings!.outer - ring.inner) * 0.9);
      ctx!.beginPath();
      // Back half: canvas angles π..2π sweep the upper side.
      ctx!.ellipse(p.x, p.y, ring.rx, Math.max(0.5, ring.ry), 0, Math.PI, Math.PI * 2);
      ctx!.stroke();
    }

    if (index === focusIndex) {
      ctx!.strokeStyle = focusStroke;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, radius + 7, 0, Math.PI * 2);
      ctx!.stroke();
    }

    ctx!.fillStyle = planet.color;
    ctx!.beginPath();
    ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx!.fill();

    // A couple of darker bands across the gas giants, once big enough to see.
    if (planet.banded && radius > 6) {
      ctx!.strokeStyle = bandStroke;
      ctx!.lineWidth = Math.max(1, radius * 0.16);
      for (const offset of [-0.38, 0.05, 0.42]) {
        const yy = p.y + radius * offset;
        const half = Math.sqrt(Math.max(0, radius * radius - (radius * offset) ** 2)) * 0.92;
        ctx!.beginPath();
        ctx!.moveTo(p.x - half, yy);
        ctx!.lineTo(p.x + half, yy);
        ctx!.stroke();
      }
    }

    if (ring) {
      ctx!.strokeStyle = planet.ringColor;
      ctx!.lineWidth = Math.max(1, radius * (planet.rings!.outer - ring.inner) * 0.9);
      ctx!.beginPath();
      // Front half.
      ctx!.ellipse(p.x, p.y, ring.rx, Math.max(0.5, ring.ry), 0, 0, Math.PI);
      ctx!.stroke();
    }

    // Moons, once the planet is drawn large enough for them to read.
    if (radius > 5) {
      for (const m of planet.moons) {
        const orbit = radius * m.orbit;
        ctx!.strokeStyle = moonOrbit;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.ellipse(p.x, p.y, orbit, Math.max(0.5, orbit * k), 0, 0, Math.PI * 2);
        ctx!.stroke();

        const mx = p.x + Math.cos(m.angle) * orbit;
        const my = p.y + Math.sin(m.angle) * orbit * k;
        ctx!.fillStyle = moonFill;
        ctx!.beginPath();
        ctx!.arc(mx, my, Math.max(1, radius * m.size * 0.5), 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    if (p.x > -60 && p.x < width + 60 && p.y > -40 && p.y < height + 40) {
      ctx!.fillStyle = labelFill;
      ctx!.fillText(planet.name, p.x, p.y - radius - 8 - (planet.rings ? radius * 0.6 : 0));
    }
  }

  function render(): void {
    ctx!.fillStyle = groundFill;
    ctx!.fillRect(0, 0, width, height);

    const k = cosTilt();
    const scale = baseScale() * zoom;
    const sun = toScreen(0, 0);

    // Reference orbits, as ellipses under the tilt.
    ctx!.strokeStyle = orbitStroke;
    ctx!.lineWidth = 1;
    for (const planet of planets) {
      const radius = compress(planet.a) * scale;
      if (radius < 2 || radius > Math.max(width, height) * 8) continue;
      ctx!.beginPath();
      ctx!.ellipse(sun.x, sun.y, radius, Math.max(0.5, radius * k), 0, 0, Math.PI * 2);
      ctx!.stroke();
    }

    // Paths actually taken, which peel away from the circles once gravity moves.
    for (const planet of planets) {
      if (!planet.alive || planet.trailLen < 3) continue;
      ctx!.strokeStyle = planet.color;
      ctx!.globalAlpha = 0.4;
      ctx!.beginPath();
      for (let n = 0; n < planet.trailLen; n += 1) {
        const idx = (planet.trailAt - planet.trailLen + n + TRAIL_POINTS * 2) % TRAIL_POINTS;
        const p = toScreen(planet.trail[idx * 2]!, planet.trail[idx * 2 + 1]!);
        if (n === 0) ctx!.moveTo(p.x, p.y);
        else ctx!.lineTo(p.x, p.y);
      }
      ctx!.stroke();
      ctx!.globalAlpha = 1;
    }

    ctx!.font = '11px Outfit, system-ui, sans-serif';
    ctx!.textAlign = 'center';

    // Painter's algorithm: draw far to near, so nearer bodies overlap.
    const order = planets
      .map((planet, index) => ({ planet, index, depth: plane(planet.x, planet.y).y }))
      .filter((entry) => entry.planet.alive)
      .sort((a, b) => a.depth - b.depth);

    let sunDrawn = false;
    const drawSun = () => {
      const radius = Math.max(4, 9 * Math.sqrt(Math.min(zoom, 6)));
      ctx!.fillStyle = sunHalo;
      ctx!.beginPath();
      ctx!.arc(sun.x, sun.y, radius * 3, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle = sunFill;
      ctx!.beginPath();
      ctx!.arc(sun.x, sun.y, radius, 0, Math.PI * 2);
      ctx!.fill();
      sunDrawn = true;
    };

    for (const entry of order) {
      // The Sun sits at depth 0; anything nearer is drawn over it.
      if (!sunDrawn && entry.depth > 0) drawSun();
      drawPlanet(entry.planet, entry.index);
    }
    if (!sunDrawn) drawSun();
  }

  /* ---------------------------------------------------------------- loop */

  resize();

  let frame = 0;
  let last = performance.now();
  let paused = false;
  let destroyed = false;

  function tick(now: number): void {
    if (destroyed) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    if (!paused) {
      resize();
      zoom += (zoomTarget - zoom) * Math.min(1, ZOOM_EASE * dt);
      step(dt);
      render();
    }

    frame = window.requestAnimationFrame(tick);
  }

  frame = window.requestAnimationFrame(tick);

  function onVisibility(): void {
    paused = document.hidden;
    if (!paused) last = performance.now();
  }

  document.addEventListener('visibilitychange', onVisibility);

  return {
    focus: setFocus,
    onFocusChange(listener) {
      focusListener = listener;
    },
    setPaused(next) {
      paused = next;
      if (!next) last = performance.now();
    },
    reseed,
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
