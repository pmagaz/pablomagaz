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

/**
 * Real rotation is far too fast to watch: Jupiter turns 890 times a year, so
 * at any usable orbit speed it would strobe. Scaling all spins by the same
 * factor keeps the relative rates honest — Jupiter fastest, Venus nearly
 * still and backwards — while staying legible.
 */
const SPIN_SCALE = 1 / 220;

/** The fitted view: Neptune's orbit just inside the frame. */
const SYSTEM_ZOOM = 1;
const FOCUS_ZOOM_MIN = 3;
const FOCUS_ZOOM_ON_SELECT = 7;
const FOCUS_ZOOM_MAX = 18;
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

interface Mark {
  /** Longitude and latitude on the sphere, radians. */
  lon: number;
  lat: number;
  size: number;
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
  /** Radians of axial rotation per simulated year, already scaled. */
  spin: number;
  spinAngle: number;
  marks: Mark[];
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
  /** Sidereal rotation period in Earth days; negative is retrograde. */
  readonly day: number;
  readonly marks?: readonly Mark[];
  readonly rings?: { readonly inner: number; readonly outer: number };
  readonly banded?: boolean;
  readonly moons: readonly Moon[];
}

const DATA: readonly PlanetData[] = [
  { name: 'Mercury', a: 0.387, size: 0.383, day: 58.6, moons: [] },
  { name: 'Venus', a: 0.723, size: 0.949, day: -243, moons: [] },
  {
    name: 'Earth',
    a: 1.0,
    size: 1.0,
    day: 1,
    marks: [{ lon: 0, lat: 0.2, size: 0.42 }, { lon: 2.4, lat: -0.3, size: 0.3 }],
    moons: [moon('Moon', 2.6, 84, 0.27)],
  },
  {
    name: 'Mars',
    a: 1.524,
    size: 0.532,
    day: 1.03,
    marks: [{ lon: 1.0, lat: -0.1, size: 0.34 }],
    moons: [moon('Phobos', 2.0, 800, 0.12), moon('Deimos', 3.0, 200, 0.1)],
  },
  {
    name: 'Jupiter',
    a: 5.203,
    size: 10.97,
    day: 0.41,
    banded: true,
    // The Great Red Spot, which is what makes the rotation legible.
    marks: [{ lon: 0, lat: -0.28, size: 0.3 }],
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
    day: 0.445,
    banded: true,
    marks: [{ lon: 1.6, lat: 0.25, size: 0.22 }],
    rings: { inner: 1.5, outer: 2.4 },
    moons: [moon('Titan', 3.4, 23, 0.4)],
  },
  { name: 'Uranus', a: 19.191, size: 3.98, day: -0.72, rings: { inner: 1.6, outer: 2.0 }, moons: [] },
  { name: 'Neptune', a: 30.07, size: 3.86, day: 0.67, moons: [moon('Triton', 2.8, -62, 0.21)] },
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
      // days -> radians per year, then scaled to something watchable.
      spin: ((Math.PI * 2) / (data.day / 365.25)) * SPIN_SCALE,
      spinAngle: Math.random() * Math.PI * 2,
      marks: (data.marks ?? []).map((m) => ({ ...m })),
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
    if (index === focusIndex) return;
    focusIndex = index;
    // Nudge the zoom so selecting something visibly does something, without
    // taking ownership of it away from the pinch gesture.
    if (index >= 0) {
      if (zoomTarget < FOCUS_ZOOM_MIN) zoomTarget = FOCUS_ZOOM_ON_SELECT;
    } else {
      zoomTarget = SYSTEM_ZOOM;
    }
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

  // Zoom is user-owned: pinch with two fingers, pinch on a trackpad, or
  // ctrl-scroll. Clicking a planet also zooms in, as a shortcut for a mouse
  // with no gesture available.
  let zoom = SYSTEM_ZOOM;
  let zoomTarget = SYSTEM_ZOOM;
  /** Where the view is centred, in plane coords. Eased toward its target. */
  const camera = { x: 0, y: 0 };

  /** Live pointers, so two of them can be recognised as a pinch. */
  const active = new Map<number, { x: number; y: number }>();
  /** Set while a pinch is in progress, to suppress the tap it would trigger. */
  let pinch: { distance: number; zoom: number } | null = null;
  let press: { x: number; y: number; moved: boolean } | null = null;

  function local(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function pinchDistance(): number {
    const points = [...active.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y);
  }

  function setZoom(next: number): void {
    zoomTarget = Math.min(FOCUS_ZOOM_MAX, Math.max(SYSTEM_ZOOM, next));
  }

  function onPointerDown(event: PointerEvent): void {
    const point = local(event);
    active.set(event.pointerId, point);

    if (active.size === 2) {
      pinch = { distance: pinchDistance(), zoom: zoomTarget };
      press = null;
    } else if (active.size === 1) {
      press = { x: point.x, y: point.y, moved: false };
    }
  }

  function onPointerMove(event: PointerEvent): void {
    const point = local(event);
    if (active.has(event.pointerId)) active.set(event.pointerId, point);

    if (pinch && active.size >= 2) {
      const distance = pinchDistance();
      if (pinch.distance > 8 && distance > 8) {
        setZoom(pinch.zoom * (distance / pinch.distance));
      }
      return;
    }

    // A drag is not a tap.
    if (press && Math.hypot(point.x - press.x, point.y - press.y) > 10) {
      press.moved = true;
    }
  }

  function onPointerUp(event: PointerEvent): void {
    const point = active.get(event.pointerId) ?? local(event);
    active.delete(event.pointerId);
    if (active.size < 2) pinch = null;

    if (!press || press.moved) {
      press = null;
      return;
    }
    press = null;

    // A clean tap: focus whatever is nearest, or release if that is nothing.
    let nearest = -1;
    // Generous, because a planet at system zoom is only a few pixels across.
    let best = 44 * 44;
    for (let i = 0; i < planets.length; i += 1) {
      const planet = planets[i]!;
      if (!planet.alive) continue;
      const p = toScreen(planet.x, planet.y);
      const d2 = (p.x - point.x) * (p.x - point.x) + (p.y - point.y) * (p.y - point.y);
      if (d2 < best) {
        best = d2;
        nearest = i;
      }
    }
    setFocus(nearest);
  }

  function onPointerCancel(event: PointerEvent): void {
    active.delete(event.pointerId);
    if (active.size < 2) pinch = null;
    press = null;
  }

  /**
   * Only a mouse leaving the canvas returns to the system view. A touch
   * pointer fires pointerleave the instant the finger lifts, which used to
   * undo the tap that had just selected a planet.
   */
  function onPointerLeave(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && active.size === 0) setFocus(-1);
  }

  /**
   * Trackpad pinch and ctrl-scroll arrive as a wheel event with ctrlKey set.
   * A plain wheel is left alone so the page still scrolls over the canvas.
   */
  function onWheel(event: WheelEvent): void {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom(zoomTarget * Math.exp(-event.deltaY * 0.01));
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  /* ---------------------------------------------------------- projection */

  function compress(r: number): number {
    return Math.sqrt(r);
  }

  function cosTilt(): number {
    // Never fully edge-on: below this the orbits collapse to a line.
    return Math.max(0.12, Math.cos((params.tilt * Math.PI) / 180));
  }

  /**
   * The largest scale that still fits Neptune's orbit inside the frame.
   * Both axes are checked, because the tilt foreshortens the vertical one —
   * fitting to the shorter side alone would waste most of the width.
   */
  function baseScale(): number {
    const outer = compress(DATA[DATA.length - 1]!.a);
    const byWidth = width / 2 / outer;
    const byHeight = height / 2 / (outer * cosTilt());
    return Math.min(byWidth, byHeight) * 0.92;
  }

  /** Radial compression, in the orbital plane. */
  function plane(x: number, y: number): { x: number; y: number } {
    const r = Math.hypot(x, y);
    const k = r > 1e-6 ? compress(r) / r : 0;
    return { x: x * k, y: y * k };
  }

  /** The view always renders from the eased camera, never from the target. */
  function focusPoint(): { x: number; y: number } {
    return camera;
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
      planet.spinAngle += planet.spin * span;
    }
  }

  /* -------------------------------------------------------------- render */

  function drawPlanet(planet: Planet, index: number): void {
    const p = toScreen(planet.x, planet.y);
    const k = cosTilt();
    const zoomBoost = Math.sqrt(Math.min(zoom, 12));
    // A focused planet is drawn larger than its share, so that its moons,
    // rings and surface are actually inspectable rather than a few pixels.
    const focusBoost = index === focusIndex ? 1.9 : 1;
    const radius = Math.max(1.8, Math.pow(planet.size, 0.4) * 3.1 * zoomBoost * focusBoost);

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

    // Surface marks, projected onto a sphere: a mark is only drawn while it
    // faces us, and flattens toward the limb. This is what makes the axial
    // rotation readable — without it a spinning disc looks identical to a
    // still one.
    if (radius > 4 && planet.marks.length > 0) {
      ctx!.fillStyle = bandStroke;
      for (const m of planet.marks) {
        const lon = m.lon + planet.spinAngle;
        const cosLat = Math.cos(m.lat);
        const front = Math.cos(lon) * cosLat;
        if (front <= 0.06) continue; // round the back
        const sx = p.x + Math.sin(lon) * cosLat * radius;
        const sy = p.y - Math.sin(m.lat) * radius;
        ctx!.beginPath();
        // Squashed horizontally as it approaches the edge of the disc.
        ctx!.ellipse(sx, sy, radius * m.size * 0.5 * front, radius * m.size * 0.5, 0, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    // Moons, once the planet is drawn large enough for them to read.
    if (radius > 4) {
      for (const m of planet.moons) {
        const orbit = radius * m.orbit;
        ctx!.strokeStyle = moonOrbit;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.ellipse(p.x, p.y, orbit, Math.max(0.5, orbit * k), 0, 0, Math.PI * 2);
        ctx!.stroke();

        const mx = p.x + Math.cos(m.angle) * orbit;
        const my = p.y + Math.sin(m.angle) * orbit * k;
        const moonRadius = Math.max(1.7, radius * m.size * 0.62);
        ctx!.fillStyle = moonFill;
        ctx!.beginPath();
        ctx!.arc(mx, my, moonRadius, 0, Math.PI * 2);
        ctx!.fill();

        // Named once there is room, so the Moon and the Galileans are findable.
        if (radius > 13) {
          ctx!.fillStyle = labelFill;
          ctx!.font = '9px Outfit, system-ui, sans-serif';
          ctx!.fillText(m.name, mx, my - moonRadius - 4);
          ctx!.font = '11px Outfit, system-ui, sans-serif';
        }
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

  /**
   * Eases the camera and zoom toward the focused planet, or back to the whole
   * system when nothing is focused. While focused, pointer height gives fine
   * control over how close you get.
   */
  function ease(dt: number): void {
    let targetX = 0;
    let targetY = 0;

    if (focusIndex >= 0 && planets[focusIndex]!.alive) {
      const target = plane(planets[focusIndex]!.x, planets[focusIndex]!.y);
      targetX = target.x;
      targetY = target.y;
    }

    const k = Math.min(1, ZOOM_EASE * dt);
    zoom += (zoomTarget - zoom) * k;
    camera.x += (targetX - camera.x) * k;
    camera.y += (targetY - camera.y) * k;
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
      ease(dt);
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
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
