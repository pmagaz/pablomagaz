/**
 * A galaxy as a restricted N-body problem.
 *
 * A supermassive core and two orbiting companions carry all the mass and pull
 * on each other; the stars are massless test particles that fall through the
 * field they create. The cursor is a fourth mass you steer.
 *
 * The alternative — every star attracting every other — is O(n²), or O(n log n)
 * with a Barnes-Hut tree, and neither survives a phone. Here each star costs
 * four force evaluations regardless of how many stars there are, so the whole
 * step is linear and thousands of stars run at sixty frames a second. The
 * honest cost of that: arms are stirred up by the companions rather than
 * emerging from the disk's own self-gravity.
 *
 * Positions are held in flat typed arrays, structure-of-arrays, and nothing is
 * allocated inside the frame loop.
 */

import { EMBER, INK, RED, TINT, type Rgb } from '~/lib/palette';

export interface GalaxyParams {
  /** Scales the mass of every body. Low unwinds the disk, high collapses it. */
  gravity: number;
  /** Number of test stars. */
  stars: number;
  /** Mass of the cursor, as a fraction of the core. */
  pull: number;
}

export interface GalaxyHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  reseed(): void;
  /** Sensible star count for this device — the component seeds the slider. */
  readonly suggestedStars: number;
}

/** Orbital speed at REFERENCE_RADIUS, which sets the core's mass. */
const REFERENCE_SPEED = 62;
const REFERENCE_RADIUS = 190;
const CORE_GM = REFERENCE_SPEED * REFERENCE_SPEED * REFERENCE_RADIUS;

/** Softening lengths: gravity is capped inside these, so nothing blows up. */
const CORE_SOFTENING = 26;
const CURSOR_SOFTENING = 34;

const COMPANION_MASS = 0.055;
const DISK_RADIUS = 300;
/** Stars beyond this are recycled back into the disk to keep it populated. */
const ESCAPE_RADIUS = 1180;

const TRAIL_DECAY = 0.88;
const GAIN = 20;

const MAX_STARS = 6000;

export function createGalaxySim(
  canvas: HTMLCanvasElement,
  params: GalaxyParams,
): GalaxyHandle | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  const small = window.matchMedia('(max-width: 768px)').matches;
  // Phones get a smaller accumulation buffer and fewer stars; both passes are
  // per-pixel, so buffer size dominates the frame more than star count does.
  const maxPixels = small ? 360_000 : 820_000;
  const suggestedStars = small ? 1400 : 3200;

  /* ---------------------------------------------------- colour lookup */

  const LUT = new Uint8ClampedArray(256 * 3);

  function ramp(t: number): Rgb {
    const lerp = (a: Rgb, b: Rgb, k: number): Rgb => [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k,
      a[2] + (b[2] - a[2]) * k,
    ];
    if (t < 0.36) return lerp(INK, RED, t / 0.36);
    if (t < 0.7) return lerp(RED, EMBER, (t - 0.36) / 0.34);
    return lerp(EMBER, TINT, (t - 0.7) / 0.3);
  }

  for (let i = 0; i < 256; i += 1) {
    const [r, g, b] = ramp(i / 255);
    LUT[i * 3] = r * 255;
    LUT[i * 3 + 1] = g * 255;
    LUT[i * 3 + 2] = b * 255;
  }

  /* ------------------------------------------------------------ buffers */

  let width = 0;
  let height = 0;
  let density = new Float32Array(0);
  let image: ImageData | null = null;

  function resize(): boolean {
    const cssWidth = Math.max(1, Math.floor(canvas.clientWidth));
    const cssHeight = Math.max(1, Math.floor(canvas.clientHeight));

    let nextWidth = cssWidth;
    let nextHeight = cssHeight;
    const pixels = cssWidth * cssHeight;
    if (pixels > maxPixels) {
      const scale = Math.sqrt(maxPixels / pixels);
      nextWidth = Math.max(1, Math.floor(cssWidth * scale));
      nextHeight = Math.max(1, Math.floor(cssHeight * scale));
    }

    if (nextWidth === width && nextHeight === height) return false;

    width = nextWidth;
    height = nextHeight;
    canvas.width = width;
    canvas.height = height;
    density = new Float32Array(width * height);
    image = ctx!.createImageData(width, height);
    return true;
  }

  /* -------------------------------------------------------------- state */

  // Structure of arrays: one contiguous read per component per star.
  const sx = new Float32Array(MAX_STARS);
  const sy = new Float32Array(MAX_STARS);
  const svx = new Float32Array(MAX_STARS);
  const svy = new Float32Array(MAX_STARS);
  let starCount = 0;

  // The massive bodies: core plus two companions.
  const bx = new Float64Array(3);
  const by = new Float64Array(3);
  const bvx = new Float64Array(3);
  const bvy = new Float64Array(3);
  const bm = new Float64Array(3);

  function seedStar(i: number): void {
    // sqrt gives a uniform areal density; the extra power pulls stars inward
    // so the core reads bright and the disk thins out.
    const t = Math.random();
    const radius = DISK_RADIUS * Math.pow(t, 0.62) + 18;
    const angle = Math.random() * Math.PI * 2;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    // Circular orbit speed for the enclosed mass, perpendicular to the radius.
    const speed = Math.sqrt(CORE_GM / radius) * (0.94 + Math.random() * 0.12);

    sx[i] = x;
    sy[i] = y;
    svx[i] = (-y / radius) * speed;
    svy[i] = (x / radius) * speed;
  }

  function seedBodies(): void {
    bx[0] = 0;
    by[0] = 0;
    bvx[0] = 0;
    bvy[0] = 0;
    bm[0] = CORE_GM;

    for (let i = 1; i < 3; i += 1) {
      const radius = 250 + i * 130;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.sqrt(CORE_GM / radius) * 0.98;
      bx[i] = Math.cos(angle) * radius;
      by[i] = Math.sin(angle) * radius;
      bvx[i] = (-Math.sin(angle)) * speed;
      bvy[i] = Math.cos(angle) * speed;
      bm[i] = CORE_GM * COMPANION_MASS;
    }
  }

  function seedAll(): void {
    seedBodies();
    starCount = Math.min(MAX_STARS, Math.round(params.stars));
    for (let i = 0; i < starCount; i += 1) seedStar(i);
    density.fill(0);
  }

  function syncCount(): void {
    const target = Math.min(MAX_STARS, Math.round(params.stars));
    if (target === starCount) return;
    // Growing seeds only the new stars, so the existing disk is undisturbed.
    for (let i = starCount; i < target; i += 1) seedStar(i);
    starCount = target;
  }

  /* ------------------------------------------------------------ pointer */

  const pointer = { x: 0, y: 0, active: false, held: false };

  function toWorld(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scale = viewScale();
    return {
      x: (event.clientX - rect.left - rect.width / 2) / scale,
      y: (event.clientY - rect.top - rect.height / 2) / scale,
    };
  }

  function onPointerMove(event: PointerEvent): void {
    const { x, y } = toWorld(event);
    pointer.x = x;
    pointer.y = y;
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

  function viewScale(): number {
    // Fit roughly two disk radii into the shorter axis.
    return Math.min(width, height) / (DISK_RADIUS * 2.35);
  }

  function step(dt: number): void {
    const g = params.gravity;
    const cursorMass = pointer.active ? CORE_GM * params.pull * (pointer.held ? 2.4 : 1) : 0;

    // The massive bodies pull on each other first.
    for (let i = 1; i < 3; i += 1) {
      let ax = 0;
      let ay = 0;
      for (let j = 0; j < 3; j += 1) {
        if (i === j) continue;
        const dx = bx[j]! - bx[i]!;
        const dy = by[j]! - by[i]!;
        const d2 = dx * dx + dy * dy + CORE_SOFTENING * CORE_SOFTENING;
        const inv = (bm[j]! * g) / (d2 * Math.sqrt(d2));
        ax += dx * inv;
        ay += dy * inv;
      }
      bvx[i] += ax * dt;
      bvy[i] += ay * dt;
    }
    for (let i = 1; i < 3; i += 1) {
      bx[i] += bvx[i]! * dt;
      by[i] += bvy[i]! * dt;
    }

    const escape2 = ESCAPE_RADIUS * ESCAPE_RADIUS;
    const soft2 = CORE_SOFTENING * CORE_SOFTENING;
    const cursorSoft2 = CURSOR_SOFTENING * CURSOR_SOFTENING;

    for (let i = 0; i < starCount; i += 1) {
      const x = sx[i]!;
      const y = sy[i]!;
      let ax = 0;
      let ay = 0;

      // Three massive bodies — unrolled by the loop being length 3.
      for (let b = 0; b < 3; b += 1) {
        const dx = bx[b]! - x;
        const dy = by[b]! - y;
        const d2 = dx * dx + dy * dy + soft2;
        const inv = (bm[b]! * g) / (d2 * Math.sqrt(d2));
        ax += dx * inv;
        ay += dy * inv;
      }

      // ...and the cursor.
      if (cursorMass > 0) {
        const dx = pointer.x - x;
        const dy = pointer.y - y;
        const d2 = dx * dx + dy * dy + cursorSoft2;
        const inv = (cursorMass * g) / (d2 * Math.sqrt(d2));
        ax += dx * inv;
        ay += dy * inv;
      }

      const vx = svx[i]! + ax * dt;
      const vy = svy[i]! + ay * dt;
      const nx = x + vx * dt;
      const ny = y + vy * dt;

      if (nx * nx + ny * ny > escape2) {
        // Thrown clear — recycle it rather than tracking a star nobody sees.
        seedStar(i);
      } else {
        svx[i] = vx;
        svy[i] = vy;
        sx[i] = nx;
        sy[i] = ny;
      }
    }
  }

  /* ------------------------------------------------------------- render */

  function accumulate(): void {
    const scale = viewScale();
    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < starCount; i += 1) {
      const px = (cx + sx[i]! * scale) | 0;
      const py = (cy + sy[i]! * scale) | 0;
      if (px >= 0 && px < width && py >= 0 && py < height) {
        density[py * width + px]! += 1;
      }
    }

    // The bodies themselves, drawn heavy so the core burns bright.
    for (let b = 0; b < 3; b += 1) {
      const px = (cx + bx[b]! * scale) | 0;
      const py = (cy + by[b]! * scale) | 0;
      const weight = b === 0 ? 26 : 10;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const qx = px + ox;
          const qy = py + oy;
          if (qx >= 0 && qx < width && qy >= 0 && qy < height) {
            density[qy * width + qx]! += weight;
          }
        }
      }
    }
  }

  const logGain = Math.log(1 + GAIN);

  function paint(): void {
    if (!image) return;
    const pixels = image.data;

    for (let i = 0, p = 0; i < density.length; i += 1, p += 4) {
      const value = density[i]!;
      const t = value > 0 ? Math.log(1 + value * GAIN) / logGain : 0;
      const index = (t > 1 ? 255 : (t * 255) | 0) * 3;
      pixels[p] = LUT[index]!;
      pixels[p + 1] = LUT[index + 1]!;
      pixels[p + 2] = LUT[index + 2]!;
      pixels[p + 3] = 255;

      // Decay leaves orbital trails rather than bare points.
      density[i] = value * TRAIL_DECAY;
    }

    ctx!.putImageData(image, 0, 0);
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
      if (resize()) seedAll();
      syncCount();
      step(dt);
      accumulate();
      paint();
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
