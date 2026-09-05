/**
 * Clifford attractor, drawn as an accumulated density field.
 *
 *   x' = sin(a·y) + c·cos(a·x)
 *   y' = sin(b·x) + d·cos(b·y)
 *
 * A strange attractor is a still shape for fixed constants, so the motion
 * here comes from letting c and d drift on two slow, incommensurate sines:
 * the form folds and reopens and never quite repeats. Set drift to zero and
 * it freezes into a single figure you can study.
 *
 * Many walkers are advanced a few steps per frame rather than one walker
 * being advanced many, so the whole attractor is covered immediately instead
 * of being traced out. The density buffer decays every frame, which is what
 * lets the picture follow the drift instead of smearing into an average.
 *
 * Deliberately CPU: it is plain arithmetic over a typed array, no shaders.
 */

import { readBrand, type Rgb } from '~/lib/palette';

export interface AttractorParams {
  /** The `a` constant — the dominant fold. */
  formA: number;
  /** The `b` constant. */
  formB: number
  /** How fast c and d wander. Zero freezes the figure. */
  drift: number;
}

export interface AttractorHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  reseed(): void;
}

/** Independent orbits, so coverage is immediate. */
const WALKERS = 900;
/** Steps each walker takes per frame — WALKERS × STEPS points per frame. */
const STEPS = 70;
/** Iterations discarded when a walker is seeded, to skip its transient. */
const BURN_IN = 30;
/** Cap the accumulation buffer so the per-pixel passes stay cheap. */
const MAX_PIXELS = 900_000;
/** Per-frame retention. Lower follows the drift faster but looks thinner. */
const DECAY = 0.93;
/** Brightness of the density → colour curve. */
const GAIN = 26;

export function createAttractorSim(
  canvas: HTMLCanvasElement,
  params: AttractorParams,
): AttractorHandle | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  // Colours come from the design tokens, so tokens.css stays the only
  // place any colour is declared.
  const brand = readBrand();

  /* ---------------------------------------------------- colour lookup */

  // 256-entry ramp, built once. Per-pixel mixing would dominate the frame.
  const LUT = new Uint8ClampedArray(256 * 3);

  function ramp(t: number): Rgb {
    const lerp = (a: Rgb, b: Rgb, k: number): Rgb => [
      a[0] + (b[0] - a[0]) * k,
      a[1] + (b[1] - a[1]) * k,
      a[2] + (b[2] - a[2]) * k,
    ];
    if (t < 0.34) return lerp(brand.stage, brand.red, t / 0.34);
    if (t < 0.67) return lerp(brand.red, brand.ember, (t - 0.34) / 0.33);
    return lerp(brand.ember, brand.tint, (t - 0.67) / 0.33);
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

    // Render at CSS pixels, scaled down if that would be too many. The
    // filaments are soft, so a mild upscale by the compositor is invisible.
    let nextWidth = cssWidth;
    let nextHeight = cssHeight;
    const pixels = cssWidth * cssHeight;
    if (pixels > MAX_PIXELS) {
      const scale = Math.sqrt(MAX_PIXELS / pixels);
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

  /* ------------------------------------------------------------ walkers */

  const walkers = new Float64Array(WALKERS * 2);

  function seedWalker(index: number, a: number, b: number, c: number, d: number): void {
    let x = (Math.random() - 0.5) * 2;
    let y = (Math.random() - 0.5) * 2;
    // Skip the transient so the walker starts on the attractor itself.
    for (let i = 0; i < BURN_IN; i += 1) {
      const nx = Math.sin(a * y) + c * Math.cos(a * x);
      const ny = Math.sin(b * x) + d * Math.cos(b * y);
      x = nx;
      y = ny;
    }
    walkers[index * 2] = x;
    walkers[index * 2 + 1] = y;
  }

  function seedAll(): void {
    const { a, b, c, d } = constants(0);
    for (let i = 0; i < WALKERS; i += 1) seedWalker(i, a, b, c, d);
  }

  /* ---------------------------------------------------------- constants */

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Pointer nudges c and d a little, so moving the cursor morphs the figure
  // without desynchronising the sliders.
  const pointer = { x: 0, y: 0, active: false };

  function constants(time: number): { a: number; b: number; c: number; d: number } {
    const drift = reducedMotion ? 0 : params.drift;
    // Two incommensurate periods, so the pair never cycles.
    const c = 1.0 + 0.6 * Math.sin(time * 0.11 * drift) + (pointer.active ? pointer.x * 0.35 : 0);
    const d =
      0.7 + 0.5 * Math.sin(time * 0.07 * drift + 1.3) + (pointer.active ? pointer.y * 0.3 : 0);
    return { a: params.formA, b: params.formB, c, d };
  }

  /* ------------------------------------------------------------- render */

  function accumulate(time: number): void {
    const { a, b, c, d } = constants(time);

    // Clifford is bounded by 1+|c| and 1+|d|; fit that box to the canvas.
    const halfX = 1 + Math.abs(c);
    const halfY = 1 + Math.abs(d);
    const scale = Math.min(width / (halfX * 2), height / (halfY * 2)) * 0.94;
    const centreX = width / 2;
    const centreY = height / 2;

    for (let w = 0; w < WALKERS; w += 1) {
      let x = walkers[w * 2]!;
      let y = walkers[w * 2 + 1]!;

      for (let s = 0; s < STEPS; s += 1) {
        const nx = Math.sin(a * y) + c * Math.cos(a * x);
        const ny = Math.sin(b * x) + d * Math.cos(b * y);
        x = nx;
        y = ny;

        const px = (centreX + x * scale) | 0;
        const py = (centreY + y * scale) | 0;
        if (px >= 0 && px < width && py >= 0 && py < height) {
          density[py * width + px]! += 1;
        }
      }

      if (Number.isFinite(x) && Number.isFinite(y)) {
        walkers[w * 2] = x;
        walkers[w * 2 + 1] = y;
      } else {
        seedWalker(w, a, b, c, d);
      }
    }
  }

  const logGain = Math.log(1 + GAIN);

  function paint(): void {
    if (!image) return;
    const pixels = image.data;

    for (let i = 0, p = 0; i < density.length; i += 1, p += 4) {
      const value = density[i]!;
      // Log curve: without it a handful of dense cells swamp everything.
      const t = value > 0 ? Math.log(1 + value * GAIN) / logGain : 0;
      const index = (t > 1 ? 255 : (t * 255) | 0) * 3;
      pixels[p] = LUT[index]!;
      pixels[p + 1] = LUT[index + 1]!;
      pixels[p + 2] = LUT[index + 2]!;
      pixels[p + 3] = 255;

      density[i] = value * DECAY;
    }

    ctx!.putImageData(image, 0, 0);
  }

  /* ------------------------------------------------------------ pointer */

  function onPointerMove(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    // -1 to 1 across the canvas.
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    pointer.active = true;
  }

  function onPointerLeave(): void {
    pointer.active = false;
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', onPointerLeave);

  /* --------------------------------------------------------------- loop */

  resize();
  seedAll();

  let frame = 0;
  let elapsed = 0;
  let last = performance.now();
  let paused = false;
  let destroyed = false;

  function tick(now: number): void {
    if (destroyed) return;

    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;

    if (!paused) {
      if (resize()) seedAll();
      elapsed += dt;
      accumulate(elapsed);
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
    setPaused(next: boolean) {
      paused = next;
      if (!next) last = performance.now();
    },
    reseed() {
      density.fill(0);
      seedAll();
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointercancel', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
