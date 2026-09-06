/**
 * The solar system, actually integrated rather than drawn on rails.
 *
 * Physics runs in astronomical units, years and solar masses, where
 * G = 4π² — the units that make Earth's orbit come out at exactly one year.
 * Each planet is accelerated by the Sun alone (planet-planet pulls are four
 * orders of magnitude smaller and would only add drift), and positions are
 * advanced with velocity Verlet in substeps so the orbits stay closed even
 * when time is running fast.
 *
 * Because it is a real integration, changing gravity does what it should:
 * raise it and the planets are moving too slowly for the pull, so they spiral
 * inward; lower it and they carry too much speed and swing out into long
 * ellipses, or leave entirely.
 *
 * Distance is compressed as √r for display only. That keeps Neptune on screen
 * beside Mercury, and because the transform is radial it maps circles to
 * circles — the orbits still look like orbits.
 */

import { css, mix, readBrand } from '~/lib/palette';

export interface SolarParams {
  /** Multiplies G. 1 is our own solar system. */
  gravity: number;
  /** Years of simulation per second of real time. */
  speed: number;
  /** Magnification about the focused body. */
  zoom: number;
}

export interface SolarHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  /** Puts every planet back on a circular orbit. */
  reseed(): void;
  /** -1 is the Sun / whole system. */
  focus(index: number): void;
  onFocusChange(listener: (name: string) => void): void;
  readonly names: readonly string[];
}

/** G in AU³ / (solar mass · year²). */
const G = 4 * Math.PI * Math.PI;
/**
 * Target integration step, in years. Substeps are derived from this rather
 * than fixed, because the simulated interval scales with the speed slider —
 * a fixed count would leave Mercury with only a handful of steps per orbit at
 * 12 yr/s and visibly break its orbit.
 */
const TARGET_STEP = 0.002;
const MIN_SUBSTEPS = 4;
const MAX_SUBSTEPS = 64;
const TRAIL_POINTS = 220;
/** Swallowed by the Sun below this, in AU. */
const SUN_RADIUS = 0.05;
/** Considered lost beyond this, in AU. */
const ESCAPE = 90;

interface Body {
  name: string;
  /** Semi-major axis, AU. */
  a: number;
  /** Equatorial radius relative to Earth. */
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  /** Ring buffer of past positions, in AU. */
  trail: Float32Array;
  trailAt: number;
  trailLen: number;
  color: string;
}

const PLANETS: ReadonlyArray<{ name: string; a: number; size: number }> = [
  { name: 'Mercury', a: 0.387, size: 0.383 },
  { name: 'Venus', a: 0.723, size: 0.949 },
  { name: 'Earth', a: 1.0, size: 1.0 },
  { name: 'Mars', a: 1.524, size: 0.532 },
  { name: 'Jupiter', a: 5.203, size: 10.97 },
  { name: 'Saturn', a: 9.537, size: 9.14 },
  { name: 'Uranus', a: 19.191, size: 3.98 },
  { name: 'Neptune', a: 30.07, size: 3.86 },
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
  const sunHalo = css(brand.tint, 0.16);
  const labelFill = css(brand.onInk, 0.55);
  const orbitStroke = css(brand.onInk, 0.1);
  const focusStroke = css(brand.tint, 0.5);

  /* -------------------------------------------------------------- bodies */

  const bodies: Body[] = PLANETS.map((planet, index) => ({
    name: planet.name,
    a: planet.a,
    size: planet.size,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    alive: true,
    trail: new Float32Array(TRAIL_POINTS * 2),
    trailAt: 0,
    trailLen: 0,
    // Stepped through the brand ramp so the inner planets read warm and the
    // outer ones light.
    color: css(
      index < PLANETS.length / 2
        ? mix(brand.red, brand.ember, index / (PLANETS.length / 2))
        : mix(brand.ember, brand.tint, (index - PLANETS.length / 2) / (PLANETS.length / 2)),
    ),
  }));

  function reseed(): void {
    for (const body of bodies) {
      const angle = Math.random() * Math.PI * 2;
      // Circular orbit: v² = GM/r, perpendicular to the radius.
      const speed = Math.sqrt(G / body.a);
      body.x = Math.cos(angle) * body.a;
      body.y = Math.sin(angle) * body.a;
      body.vx = -Math.sin(angle) * speed;
      body.vy = Math.cos(angle) * speed;
      body.alive = true;
      body.trailAt = 0;
      body.trailLen = 0;
    }
  }

  reseed();

  /* --------------------------------------------------------------- focus */

  let focusIndex = -1;
  let focusListener: ((name: string) => void) | null = null;

  function setFocus(index: number): void {
    focusIndex = index;
    focusListener?.(index < 0 ? 'The system' : bodies[index]!.name);
  }

  /* -------------------------------------------------------------- canvas */

  let width = 0;
  let height = 0;

  function resize(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.floor(canvas.clientWidth));
    const nextHeight = Math.max(1, Math.floor(canvas.clientHeight));
    if (nextWidth === width && nextHeight === height) return false;
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  /* ---------------------------------------------------------- projection */

  /** √r compression: fits Neptune beside Mercury, and keeps circles circular. */
  function compress(r: number): number {
    return Math.sqrt(r);
  }

  function baseScale(): number {
    // Neptune's compressed orbit just inside the shorter axis.
    return (Math.min(width, height) / 2 / compress(PLANETS[PLANETS.length - 1]!.a)) * 0.88;
  }

  function project(x: number, y: number): { x: number; y: number } {
    const r = Math.hypot(x, y);
    const k = r > 1e-6 ? compress(r) / r : 0;
    return { x: x * k, y: y * k };
  }

  function focusPoint(): { x: number; y: number } {
    if (focusIndex < 0) return { x: 0, y: 0 };
    const body = bodies[focusIndex]!;
    return project(body.x, body.y);
  }

  /* ---------------------------------------------------------------- step */

  function step(dt: number): void {
    const gm = G * params.gravity;
    const span = dt * params.speed;
    const substeps = Math.min(
      MAX_SUBSTEPS,
      Math.max(MIN_SUBSTEPS, Math.ceil(span / TARGET_STEP)),
    );
    const h = span / substeps;

    for (let s = 0; s < substeps; s += 1) {
      for (const body of bodies) {
        if (!body.alive) continue;

        // Velocity Verlet: half-kick, drift, half-kick.
        let r2 = body.x * body.x + body.y * body.y;
        let inv = gm / (r2 * Math.sqrt(r2));
        const ax0 = -body.x * inv;
        const ay0 = -body.y * inv;

        body.vx += ax0 * h * 0.5;
        body.vy += ay0 * h * 0.5;
        body.x += body.vx * h;
        body.y += body.vy * h;

        r2 = body.x * body.x + body.y * body.y;
        inv = gm / (r2 * Math.sqrt(r2));
        body.vx += -body.x * inv * h * 0.5;
        body.vy += -body.y * inv * h * 0.5;

        const r = Math.sqrt(r2);
        if (r < SUN_RADIUS || r > ESCAPE) body.alive = false;
      }
    }

    for (const body of bodies) {
      if (!body.alive) continue;
      body.trail[body.trailAt * 2] = body.x;
      body.trail[body.trailAt * 2 + 1] = body.y;
      body.trailAt = (body.trailAt + 1) % TRAIL_POINTS;
      if (body.trailLen < TRAIL_POINTS) body.trailLen += 1;
    }
  }

  /* -------------------------------------------------------------- render */

  function render(): void {
    ctx!.fillStyle = groundFill;
    ctx!.fillRect(0, 0, width, height);

    const scale = baseScale() * params.zoom;
    const focus = focusPoint();
    const cx = width / 2;
    const cy = height / 2;

    const toScreen = (x: number, y: number) => {
      const p = project(x, y);
      return { sx: cx + (p.x - focus.x) * scale, sy: cy + (p.y - focus.y) * scale };
    };

    // Reference circles at each planet's starting orbit.
    ctx!.strokeStyle = orbitStroke;
    ctx!.lineWidth = 1;
    for (const body of bodies) {
      const radius = compress(body.a) * scale;
      const sun = toScreen(0, 0);
      if (radius < 2 || radius > Math.max(width, height) * 6) continue;
      ctx!.beginPath();
      ctx!.arc(sun.sx, sun.sy, radius, 0, Math.PI * 2);
      ctx!.stroke();
    }

    // The Sun.
    const sun = toScreen(0, 0);
    const sunRadius = Math.max(3, 9 * Math.sqrt(Math.min(params.zoom, 6)));
    ctx!.fillStyle = sunHalo;
    ctx!.beginPath();
    ctx!.arc(sun.sx, sun.sy, sunRadius * 2.8, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.fillStyle = sunFill;
    ctx!.beginPath();
    ctx!.arc(sun.sx, sun.sy, sunRadius, 0, Math.PI * 2);
    ctx!.fill();

    ctx!.font = '11px Outfit, system-ui, sans-serif';
    ctx!.textAlign = 'center';

    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i]!;
      if (!body.alive) continue;

      // The path it has actually taken, which diverges from the circle as
      // soon as gravity is changed.
      if (body.trailLen > 2) {
        ctx!.strokeStyle = body.color;
        ctx!.globalAlpha = 0.45;
        ctx!.beginPath();
        for (let n = 0; n < body.trailLen; n += 1) {
          const idx = (body.trailAt - body.trailLen + n + TRAIL_POINTS * 2) % TRAIL_POINTS;
          const p = toScreen(body.trail[idx * 2]!, body.trail[idx * 2 + 1]!);
          if (n === 0) ctx!.moveTo(p.sx, p.sy);
          else ctx!.lineTo(p.sx, p.sy);
        }
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      const { sx, sy } = toScreen(body.x, body.y);
      const radius = Math.max(
        1.8,
        Math.pow(body.size, 0.4) * 3.2 * Math.sqrt(Math.min(params.zoom, 8)),
      );

      if (i === focusIndex) {
        ctx!.strokeStyle = focusStroke;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.arc(sx, sy, radius + 6, 0, Math.PI * 2);
        ctx!.stroke();
      }

      ctx!.fillStyle = body.color;
      ctx!.beginPath();
      ctx!.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx!.fill();

      if (sx > -60 && sx < width + 60 && sy > -40 && sy < height + 40) {
        ctx!.fillStyle = labelFill;
        ctx!.fillText(body.name, sx, sy - radius - 7);
      }
    }
  }

  /* ------------------------------------------------------------- pointer */

  function onPointerDown(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const scale = baseScale() * params.zoom;
    const focus = focusPoint();
    const cx = width / 2;
    const cy = height / 2;

    let nearest = -1;
    let best = 34 * 34;
    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i]!;
      if (!body.alive) continue;
      const p = project(body.x, body.y);
      const sx = cx + (p.x - focus.x) * scale;
      const sy = cy + (p.y - focus.y) * scale;
      const d2 = (sx - mx) * (sx - mx) + (sy - my) * (sy - my);
      if (d2 < best) {
        best = d2;
        nearest = i;
      }
    }

    // Clicking away from any planet returns to the whole system.
    setFocus(nearest);
  }

  canvas.addEventListener('pointerdown', onPointerDown);

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
    names: PLANETS.map((planet) => planet.name),
    focus: setFocus,
    onFocusChange(listener) {
      focusListener = listener;
    },
    setPaused(next) {
      paused = next;
      if (!next) last = performance.now();
    },
    reseed() {
      reseed();
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
