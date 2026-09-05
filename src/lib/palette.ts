/**
 * The site palette as numbers, for canvas and shader work.
 * Keep in sync with src/styles/tokens.css — the lab animations should always
 * read as the brand rather than as arbitrary colour.
 */

export type Rgb = readonly [number, number, number];

/** 0-1 floats, for WebGL uniforms. */

/**
 * The canvas ground — --pm-stage, deliberately deeper than --pm-ink. The
 * brand black is a mid grey, which would wash out every glowing animation,
 * so the lab stages get their own near-black.
 */
export const INK: Rgb = [0.071, 0.071, 0.102]; // #12121a

export const RED: Rgb = [0.902, 0.122, 0.259]; // #e61f42
export const EMBER: Rgb = [0.89, 0.29, 0.1]; // warm shift off the brand red
export const TINT: Rgb = [0.976, 0.475, 0.565]; // light crimson highlight

/** The three dye/fill colours used across the experiments. */
export const BRAND_RAMP: readonly Rgb[] = [RED, EMBER, TINT];

/** 0-255 css string, for canvas 2D fills. */
export function css(color: Rgb, alpha = 1): string {
  const [r, g, b] = color;
  const to255 = (v: number) => Math.round(v * 255);
  return alpha === 1
    ? `rgb(${to255(r)} ${to255(g)} ${to255(b)})`
    : `rgb(${to255(r)} ${to255(g)} ${to255(b)} / ${alpha})`;
}

/** Mixes two colours, `t` from 0 to 1. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
