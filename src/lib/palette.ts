/**
 * The palette, for canvas and shader work.
 *
 * Nothing here hardcodes a colour. The values are read from the design tokens
 * on :root, so `src/styles/tokens.css` is the single place any colour in the
 * project is declared — change it there and the canvases follow.
 */

export type Rgb = readonly [number, number, number];

export interface Brand {
  /** The canvas ground, --pm-stage: deeper than --pm-ink so glows read. */
  stage: Rgb;
  red: Rgb;
  ember: Rgb;
  tint: Rgb;
  /** --pm-on-ink, for faint furniture drawn over a canvas. */
  onInk: Rgb;
  /** The three fill colours the experiments cycle through. */
  ramp: readonly Rgb[];
}

/**
 * Only used if a custom property is missing — which would mean tokens.css
 * failed to load, and the canvas is the least of the problems.
 */
const FALLBACK = '#000000';

function hexToRgb(hex: string): Rgb {
  const value = hex.trim().replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) return [0, 0, 0];
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
}

/** Parses a `250 250 250` channel triple, the form used for alpha variants. */
function rgbChannels(value: string): Rgb {
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return [1, 1, 1];
  return [parts[0]! / 255, parts[1]! / 255, parts[2]! / 255];
}

/**
 * Reads the tokens off :root. Call this inside a simulation, not at module
 * scope — it needs a document.
 */
export function readBrand(): Brand {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string): Rgb =>
    hexToRgb(styles.getPropertyValue(name) || FALLBACK);

  const red = token('--pm-red');
  const ember = token('--pm-red-ember');
  const tint = token('--pm-red-tint');

  return {
    stage: token('--pm-stage'),
    onInk: rgbChannels(styles.getPropertyValue('--pm-on-ink-rgb')),
    red,
    ember,
    tint,
    ramp: [red, ember, tint],
  };
}

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
