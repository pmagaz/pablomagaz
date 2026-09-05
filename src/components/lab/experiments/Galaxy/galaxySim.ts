/**
 * A flight through a galaxy.
 *
 * Stars are points in 3D that stream past the camera; the pointer steers,
 * and because screen position is `(x - camera) * focal / z`, near stars swing
 * further than far ones — that parallax is what sells the depth. Scattered
 * through the field are star systems with planets on real circular orbits,
 * which grow as you approach and are recycled once they pass behind you.
 *
 * Drawn with plain canvas fills rather than a per-pixel buffer: the previous
 * version paid for a full-canvas read-modify-write every frame, which is the
 * expensive part on a phone. Trails come from compositing a translucent ink
 * rectangle instead, which the compositor does for free.
 */

import { EMBER, INK, RED, TINT, type Rgb } from '~/lib/palette';

export interface GalaxyParams {
  /** How fast the camera travels forward. */
  speed: number;
  /** Number of background stars. */
  stars: number;
  /** How many planetary systems are seeded through the field. */
  systems: number;
}

export interface GalaxyHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  reseed(): void;
  /** Sensible star count for this device. */
  readonly suggestedStars: number;
}

const FOCAL = 640;
const NEAR = 24;
const FAR = 1400;
/** Half-width of the volume stars are seeded into, in world units. */
const SPREAD = 900;
const MAX_STARS = 4000;
const MAX_SYSTEMS = 8;

/** World units the camera can slide laterally at full pointer deflection. */
const STEER_RANGE = 300;
const STEER_DAMPING = 2.4;
const BASE_SPEED = 190;

export function createGalaxySim(
  canvas: HTMLCanvasElement,
  params: GalaxyParams,
): GalaxyHandle | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  const small = window.matchMedia('(max-width: 768px)').matches;
  const suggestedStars = small ? 900 : 2200;
  const maxDpr = small ? 1.5 : 2;

  /* ------------------------------------------------- precomputed colours */

  // Brightness is quantised into buckets so no colour strings are built
  // inside the frame loop.
  const BUCKETS = 12;
  const starColors: string[] = [];

  function ramp(t: number): Rgb {
    const lerp = (a: Rgb, b: Rgb, k: number): Rgb => [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k,
      a[2] + (b[2] - a[2]) * k,
    ];
    if (t < 0.45) return lerp(RED, EMBER, t / 0.45);
    return lerp(EMBER, TINT, (t - 0.45) / 0.55);
  }

  for (let i = 0; i < BUCKETS; i += 1) {
    const [r, g, b] = ramp(i / (BUCKETS - 1));
    starColors.push(
      `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`,
    );
  }

  const fadeFill = `rgb(${Math.round(INK[0] * 255)} ${Math.round(INK[1] * 255)} ${Math.round(
    INK[2] * 255,
  )} / 0.34)`;
  const inkFill = `rgb(${Math.round(INK[0] * 255)} ${Math.round(INK[1] * 255)} ${Math.round(
    INK[2] * 255,
  )})`;

  /* ------------------------------------------------------------- canvas */

  let width = 0;
  let height = 0;

  function resize(): boolean {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const nextWidth = Math.max(1, Math.floor(canvas.clientWidth));
    const nextHeight = Math.max(1, Math.floor(canvas.clientHeight));
    if (nextWidth === width && nextHeight === height) return false;

    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.fillStyle = inkFill;
    ctx!.fillRect(0, 0, width, height);
    return true;
  }

  /* -------------------------------------------------------------- stars */

  const px = new Float32Array(MAX_STARS);
  const py = new Float32Array(MAX_STARS);
  const pz = new Float32Array(MAX_STARS);
  let starCount = 0;

  function seedStar(i: number, z?: number): void {
    px[i] = (Math.random() * 2 - 1) * SPREAD;
    py[i] = (Math.random() * 2 - 1) * SPREAD;
    pz[i] = z ?? NEAR + Math.random() * (FAR - NEAR);
  }

  /* ------------------------------------------------------------ systems */

  interface Planet {
    orbit: number;
    angle: number;
    rate: number;
    size: number;
  }

  interface System {
    x: number;
    y: number;
    z: number;
    sun: number;
    planets: Planet[];
  }

  const systems: System[] = [];

  function makeSystem(z?: number): System {
    const planetCount = 2 + Math.floor(Math.random() * 3);
    const planets: Planet[] = [];
    for (let i = 0; i < planetCount; i += 1) {
      const orbit = 34 + i * (20 + Math.random() * 18);
      planets.push({
        orbit,
        angle: Math.random() * Math.PI * 2,
        // Closer orbits sweep faster, as they should.
        rate: (1.4 / Math.sqrt(orbit)) * (Math.random() * 0.4 + 0.8),
        size: 1.6 + Math.random() * 2.2,
      });
    }
    return {
      x: (Math.random() * 2 - 1) * SPREAD * 0.75,
      y: (Math.random() * 2 - 1) * SPREAD * 0.75,
      z: z ?? NEAR + Math.random() * (FAR - NEAR),
      sun: 3.4 + Math.random() * 2.6,
      planets,
    };
  }

  function syncSystems(): void {
    const target = Math.min(MAX_SYSTEMS, Math.round(params.systems));
    while (systems.length < target) systems.push(makeSystem());
    if (systems.length > target) systems.length = target;
  }

  function seedAll(): void {
    starCount = Math.min(MAX_STARS, Math.round(params.stars));
    for (let i = 0; i < starCount; i += 1) seedStar(i);
    systems.length = 0;
    syncSystems();
  }

  function syncCount(): void {
    const target = Math.min(MAX_STARS, Math.round(params.stars));
    if (target === starCount) return;
    for (let i = starCount; i < target; i += 1) seedStar(i);
    starCount = target;
  }

  /* ------------------------------------------------------------ pointer */

  const pointer = { nx: 0, ny: 0, active: false, held: false };
  // Camera offset, eased toward the pointer rather than snapping to it.
  const camera = { x: 0, y: 0 };

  function onPointerMove(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    pointer.nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    pointer.active = true;
  }

  function onPointerDown(event: PointerEvent): void {
    onPointerMove(event);
    pointer.held = true;
  }

  function onPointerUp(): void {
    pointer.held = false;
  }

  function onPointerLeave(): void {
    pointer.active = false;
    pointer.held = false;
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerLeave);
  canvas.addEventListener('pointerleave', onPointerLeave);

  /* --------------------------------------------------------------- step */

  function frameStep(dt: number): void {
    // Hold to accelerate — the one control that is pure fun.
    const speed = BASE_SPEED * params.speed * (pointer.held ? 2.6 : 1);

    const targetX = pointer.active ? pointer.nx * STEER_RANGE : 0;
    const targetY = pointer.active ? pointer.ny * STEER_RANGE : 0;
    const ease = Math.min(1, STEER_DAMPING * dt);
    camera.x += (targetX - camera.x) * ease;
    camera.y += (targetY - camera.y) * ease;

    for (let i = 0; i < starCount; i += 1) {
      const z = pz[i]! - speed * dt;
      if (z <= NEAR) {
        seedStar(i, FAR);
      } else {
        pz[i] = z;
      }
    }

    for (const system of systems) {
      system.z -= speed * dt;
      if (system.z <= NEAR) {
        Object.assign(system, makeSystem(FAR));
      }
      for (const planet of system.planets) {
        planet.angle += planet.rate * dt;
      }
    }
  }

  /* ------------------------------------------------------------- render */

  function render(): void {
    // Translucent wash instead of a clear: leaves motion trails, and costs a
    // single composited rectangle rather than a per-pixel pass.
    ctx!.fillStyle = fadeFill;
    ctx!.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < starCount; i += 1) {
      const z = pz[i]!;
      const scale = FOCAL / z;
      const x = cx + (px[i]! - camera.x) * scale;
      const y = cy + (py[i]! - camera.y) * scale;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      // Depth drives both size and colour, which is the whole depth cue.
      const near = 1 - z / FAR;
      const size = near * near * 2.4 + 0.5;
      const bucket = (near * (BUCKETS - 1)) | 0;
      ctx!.fillStyle = starColors[bucket < 0 ? 0 : bucket]!;
      ctx!.fillRect(x, y, size, size);
    }

    for (const system of systems) {
      const scale = FOCAL / system.z;
      const x = cx + (system.x - camera.x) * scale;
      const y = cy + (system.y - camera.y) * scale;
      const sunRadius = system.sun * scale;
      // Skip anything whose whole system is off screen.
      if (x < -200 || x > width + 200 || y < -200 || y > height + 200) continue;

      const near = 1 - system.z / FAR;

      for (const planet of system.planets) {
        const orbit = planet.orbit * scale;
        if (orbit > 1.5) {
          ctx!.strokeStyle = `rgb(250 250 250 / ${(near * 0.16).toFixed(3)})`;
          ctx!.lineWidth = 1;
          ctx!.beginPath();
          // Tilted, so an orbit reads as a disc seen at an angle.
          ctx!.ellipse(x, y, orbit, orbit * 0.42, 0, 0, Math.PI * 2);
          ctx!.stroke();
        }

        const planetX = x + Math.cos(planet.angle) * orbit;
        const planetY = y + Math.sin(planet.angle) * orbit * 0.42;
        const planetRadius = Math.max(0.6, planet.size * scale);
        ctx!.fillStyle = starColors[Math.min(BUCKETS - 1, ((near * 8) | 0) + 2)]!;
        ctx!.beginPath();
        ctx!.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Sun: a soft halo under a bright core.
      ctx!.fillStyle = `rgb(249 138 157 / ${(near * 0.22).toFixed(3)})`;
      ctx!.beginPath();
      ctx!.arc(x, y, Math.max(1, sunRadius * 2.6), 0, Math.PI * 2);
      ctx!.fill();

      ctx!.fillStyle = starColors[BUCKETS - 1]!;
      ctx!.beginPath();
      ctx!.arc(x, y, Math.max(0.8, sunRadius), 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  /* --------------------------------------------------------------- loop */

  resize();
  seedAll();

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
      syncCount();
      syncSystems();
      frameStep(dt);
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
    suggestedStars,
    setPaused(next: boolean) {
      paused = next;
      if (!next) last = performance.now();
    },
    reseed() {
      seedAll();
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerLeave);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
