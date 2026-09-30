/**
 * An image broken into particles on a 2D canvas.
 *
 * The image is sampled on a coarse grid and every cell becomes a particle
 * that remembers where it belongs. Each frame a spring pulls it home, friction
 * bleeds off its speed, and the cursor shoves it away. The same pixels feed a
 * median-cut quantiser, which reduces the image to a six-colour palette.
 */

import { css, mix, readBrand, type Brand, type Rgb } from '~/lib/palette';

export interface ShatterParams {
  /** Side of one particle in CSS pixels; smaller means more particles. */
  grain: number;
  /** Radius of the blast under a pressed cursor, in CSS pixels. */
  radius: number;
  /** Spring stiffness pulling each particle home. Zero leaves them where they land. */
  spring: number;
}

export interface Swatch {
  hex: string;
  /** Share of the sampled pixels that fell in this colour's bucket, 0-100. */
  share: number;
}

export interface ShatterHandle {
  destroy(): void;
  setPaused(paused: boolean): void;
  /** Swaps the source image and flies the new particles in from the edges. */
  load(image: HTMLImageElement | HTMLCanvasElement): void;
  /** Throws the current particles back to the edges to reassemble. */
  shatter(): void;
}

const PALETTE_SIZE = 6;
const MAX_PARTICLES = 24000;
/** Share of the canvas the image may cover on each axis. */
const FIT = 0.82;
const HOVER_FORCE = 0.9;
const BLAST_FORCE = 9;

export function createShatterSim(
  canvas: HTMLCanvasElement,
  params: ShatterParams,
  onPalette: (palette: Swatch[]) => void,
): ShatterHandle | null {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return null;

  let width = 0;
  let height = 0;
  let dpr = 1;

  const brand = readBrand();
  const stageFill = css(brand.stage);

  let source: HTMLImageElement | HTMLCanvasElement = makeScene(brand);
  let builtGrain = 0;

  /* ------------------------------------------------------- particles */

  let count = 0;
  let x = new Float32Array(0);
  let y = new Float32Array(0);
  let vx = new Float32Array(0);
  let vy = new Float32Array(0);
  let homeX = new Float32Array(0);
  let homeY = new Float32Array(0);
  /** Per-particle multipliers, so the image does not reassemble in lockstep. */
  let stiffness = new Float32Array(0);
  let friction = new Float32Array(0);
  let phase = new Float32Array(0);
  let colorIndex = new Uint16Array(0);
  let colors: string[] = [];
  let cell = 4;

  /**
   * Resamples the source into particles. `from` decides where they start:
   * `edges` flies them in, `home` drops them straight into place.
   */
  function build(from: 'edges' | 'home'): void {
    builtGrain = params.grain;
    const scale = Math.min((width * FIT) / source.width, (height * FIT) / source.height);
    const drawW = Math.max(1, Math.floor(source.width * scale));
    const drawH = Math.max(1, Math.floor(source.height * scale));
    const offsetX = (width - drawW) / 2;
    const offsetY = (height - drawH) / 2;

    // Never more than the budget, however small the grain asks to go.
    cell = Math.max(params.grain, Math.sqrt((drawW * drawH) / MAX_PARTICLES));
    const cols = Math.max(1, Math.floor(drawW / cell));
    const rows = Math.max(1, Math.floor(drawH / cell));

    // One source pixel per particle: the browser's downscale does the averaging.
    const sample = document.createElement('canvas');
    sample.width = cols;
    sample.height = rows;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    if (!sctx) return;
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(source, 0, 0, cols, rows);
    const data = sctx.getImageData(0, 0, cols, rows).data;

    const total = cols * rows;
    x = new Float32Array(total);
    y = new Float32Array(total);
    vx = new Float32Array(total);
    vy = new Float32Array(total);
    homeX = new Float32Array(total);
    homeY = new Float32Array(total);
    stiffness = new Float32Array(total);
    friction = new Float32Array(total);
    phase = new Float32Array(total);
    colorIndex = new Uint16Array(total);

    // Quantise to 5 bits a channel so identical fills share one string.
    const lookup = new Map<number, number>();
    colors = [];
    count = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const p = (row * cols + col) * 4;
        if (data[p + 3]! < 128) continue;

        const key = ((data[p]! >> 3) << 10) | ((data[p + 1]! >> 3) << 5) | (data[p + 2]! >> 3);
        let index = lookup.get(key);
        if (index === undefined) {
          index = colors.length;
          lookup.set(key, index);
          colors.push(`rgb(${data[p]} ${data[p + 1]} ${data[p + 2]})`);
        }

        const i = count++;
        homeX[i] = offsetX + (col + 0.5) * cell;
        homeY[i] = offsetY + (row + 0.5) * cell;
        stiffness[i] = 0.7 + Math.random() * 0.6;
        friction[i] = 0.9 + Math.random() * 0.05;
        phase[i] = Math.random() * Math.PI * 2;
        colorIndex[i] = index;
        x[i] = homeX[i]!;
        y[i] = homeY[i]!;
      }
    }

    if (from === 'edges') throwToEdges();
    onPalette(extractPalette(data));
  }

  function throwToEdges(): void {
    for (let i = 0; i < count; i++) {
      const edge = Math.random();
      const along = Math.random();
      const sx = edge < 0.5 ? along * width : edge < 0.75 ? -20 : width + 20;
      const sy = edge < 0.25 ? -20 : edge < 0.5 ? height + 20 : along * height;
      x[i] = sx;
      y[i] = sy;
      vx[i] = (Math.random() - 0.5) * 4;
      vy[i] = (Math.random() - 0.5) * 4;
    }
  }

  function resize(): boolean {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.floor(canvas.clientWidth));
    const nextHeight = Math.max(1, Math.floor(canvas.clientHeight));
    if (nextWidth === width && nextHeight === height) return false;

    const hadSize = width > 0;
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    build(hadSize ? 'home' : 'edges');
    return true;
  }

  resize();

  /* ---------------------------------------------------------- pointer */

  const pointer = { x: 0, y: 0, over: false, down: false };

  function toLocal(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  }

  function onPointerMove(event: PointerEvent): void {
    toLocal(event);
    pointer.over = true;
  }

  function onPointerDown(event: PointerEvent): void {
    toLocal(event);
    pointer.over = true;
    pointer.down = true;
  }

  function onPointerUp(): void {
    pointer.down = false;
  }

  function onPointerLeave(): void {
    pointer.over = false;
    pointer.down = false;
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointercancel', onPointerLeave);

  /* ---------------------------------------------------------- physics */

  let time = 0;

  /** `k` is the frame length in sixtieths of a second, so tuning is per 60 Hz frame. */
  function step(k: number): void {
    if (params.grain !== builtGrain) build('home');
    time += k;

    const spring = params.spring;
    const blast = pointer.down;
    const radius = blast ? params.radius : params.radius * 0.45;
    const force = blast ? BLAST_FORCE : HOVER_FORCE;
    const reach = pointer.over ? radius * radius : 0;

    for (let i = 0; i < count; i++) {
      let ax = (homeX[i]! - x[i]!) * spring * stiffness[i]!;
      let ay = (homeY[i]! - y[i]!) * spring * stiffness[i]!;

      // A slow wobble, so a settled image still breathes.
      const angle = phase[i]! + time * 0.03;
      ax += Math.cos(angle) * 0.006;
      ay += Math.sin(angle) * 0.006;

      if (reach > 0) {
        const dx = x[i]! - pointer.x;
        const dy = y[i]! - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < reach && d2 > 0) {
          const d = Math.sqrt(d2);
          const falloff = 1 - d / radius;
          const push = falloff * falloff * force;
          ax += (dx / d) * push;
          ay += (dy / d) * push;
        }
      }

      const drag = Math.pow(friction[i]!, k);
      vx[i] = (vx[i]! + ax * k) * drag;
      vy[i] = (vy[i]! + ay * k) * drag;
      x[i] = x[i]! + vx[i]! * k;
      y[i] = y[i]! + vy[i]! * k;
    }
  }

  function render(): void {
    ctx!.fillStyle = stageFill;
    ctx!.fillRect(0, 0, width, height);

    // A hair smaller than the cell, so the grid shows once it settles.
    const size = Math.max(1, cell * 0.9);
    const half = size / 2;
    let current = -1;

    for (let i = 0; i < count; i++) {
      const index = colorIndex[i]!;
      if (index !== current) {
        ctx!.fillStyle = colors[index]!;
        current = index;
      }
      ctx!.fillRect(x[i]! - half, y[i]! - half, size, size);
    }
  }

  /* ------------------------------------------------------------- loop */

  let frame = 0;
  let last = performance.now();
  let paused = false;
  let destroyed = false;

  function tick(now: number): void {
    if (destroyed) return;

    const k = Math.min((now - last) / (1000 / 60), 2);
    last = now;

    if (!paused) {
      resize();
      step(k);
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
    setPaused(next: boolean) {
      paused = next;
      if (!next) last = performance.now();
    },
    load(image) {
      source = image;
      build('edges');
    },
    shatter() {
      throwToEdges();
    },
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointercancel', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}

/* ------------------------------------------------------------ palette */

type Pixel = [number, number, number];

/**
 * Median cut: split the pixels along whichever channel spans the widest
 * range, at the median, and repeat until there are enough buckets. Each
 * bucket's average is one palette colour.
 */
function extractPalette(data: Uint8ClampedArray): Swatch[] {
  const pixels: Pixel[] = [];
  for (let p = 0; p < data.length; p += 4) {
    if (data[p + 3]! < 128) continue;
    pixels.push([data[p]!, data[p + 1]!, data[p + 2]!]);
  }
  if (pixels.length === 0) return [];

  let buckets: Pixel[][] = [pixels];
  while (buckets.length < PALETTE_SIZE) {
    // Always split the bucket with the widest spread, not simply the next one.
    let widest = -1;
    let widestRange = 0;
    let widestChannel = 0;
    buckets.forEach((bucket, index) => {
      if (bucket.length < 2) return;
      const [range, channel] = spread(bucket);
      if (range > widestRange) {
        widestRange = range;
        widest = index;
        widestChannel = channel;
      }
    });
    if (widest < 0) break;

    const bucket = buckets[widest]!.sort((a, b) => a[widestChannel] - b[widestChannel]);
    const mid = bucket.length >> 1;
    buckets = [
      ...buckets.slice(0, widest),
      bucket.slice(0, mid),
      bucket.slice(mid),
      ...buckets.slice(widest + 1),
    ];
  }

  return buckets
    .map((bucket) => {
      const sum = [0, 0, 0];
      for (const px of bucket) {
        sum[0] += px[0];
        sum[1] += px[1];
        sum[2] += px[2];
      }
      const rgb = sum.map((v) => Math.round(v / bucket.length)) as Pixel;
      return { rgb, share: (bucket.length / pixels.length) * 100 };
    })
    .sort((a, b) => luminance(b.rgb) - luminance(a.rgb))
    .map(({ rgb, share }) => ({ hex: toHex(rgb), share }));
}

function spread(bucket: Pixel[]): [range: number, channel: number] {
  const min = [255, 255, 255];
  const max = [0, 0, 0];
  for (const px of bucket) {
    for (let c = 0; c < 3; c++) {
      if (px[c]! < min[c]!) min[c] = px[c]!;
      if (px[c]! > max[c]!) max[c] = px[c]!;
    }
  }
  const ranges = [max[0]! - min[0]!, max[1]! - min[1]!, max[2]! - min[2]!];
  const channel = ranges.indexOf(Math.max(...ranges));
  return [ranges[channel]!, channel];
}

function luminance([r, g, b]: Pixel): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function toHex(rgb: Pixel): string {
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/* -------------------------------------------------------------- scene */

/**
 * The default image: a sunset over three ridges, painted from the brand
 * tokens so the palette it yields is the site's own.
 */
function makeScene(brand: Brand): HTMLCanvasElement {
  const w = 480;
  const h = 300;
  const scene = document.createElement('canvas');
  scene.width = w;
  scene.height = h;
  const g = scene.getContext('2d');
  if (!g) return scene;

  const horizon = h * 0.7;
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, css(brand.stage));
  sky.addColorStop(0.35, css(mix(brand.stage, brand.red, 0.55)));
  sky.addColorStop(0.7, css(brand.red));
  sky.addColorStop(1, css(brand.ember));
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);

  // Stars, only where the sky is still dark.
  g.fillStyle = css(brand.onInk, 0.7);
  for (let i = 0; i < 40; i++) {
    const sx = (Math.sin(i * 91.7) * 0.5 + 0.5) * w;
    const sy = (Math.sin(i * 47.3) * 0.5 + 0.5) * h * 0.3;
    g.fillRect(sx, sy, 1.5, 1.5);
  }

  // The sun, with the lower half sliced into bands the sky shows through.
  const sunX = w * 0.5;
  const sunY = horizon - h * 0.08;
  const sunR = h * 0.22;
  const sun = g.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
  sun.addColorStop(0, css(mix(brand.tint, brand.onInk, 0.5)));
  sun.addColorStop(1, css(brand.tint));
  g.save();
  g.beginPath();
  g.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = sun;
  g.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  g.fillStyle = sky;
  for (let band = 0; band < 6; band++) {
    const top = sunY + band * sunR * 0.17;
    g.fillRect(sunX - sunR, top, sunR * 2, 3 + band * 2);
  }
  g.restore();

  // Three ridges, each nearer one darker and taller.
  const ridges: [depth: number, base: number, amp: number, freq: number, colour: Rgb][] = [
    [0, horizon - 18, 22, 0.018, mix(brand.stage, brand.red, 0.45)],
    [1, horizon + 8, 30, 0.012, mix(brand.stage, brand.red, 0.22)],
    [2, horizon + 40, 26, 0.009, brand.stage],
  ];
  for (const [depth, base, amp, freq, colour] of ridges) {
    g.beginPath();
    g.moveTo(0, h);
    for (let px = 0; px <= w; px += 4) {
      const ridge =
        Math.sin(px * freq + depth * 2.1) * amp +
        Math.sin(px * freq * 2.7 + depth) * amp * 0.35;
      g.lineTo(px, base - ridge);
    }
    g.lineTo(w, h);
    g.closePath();
    g.fillStyle = css(colour);
    g.fill();
  }

  return scene;
}
