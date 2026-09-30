import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import {
  createShatterSim,
  type ShatterHandle,
  type ShatterParams,
  type Swatch,
} from './shatterSim';
import './ShatterStage.css';

const DEFAULTS: ShatterParams = {
  grain: 6,
  radius: 120,
  spring: 0.012,
};

/** An image broken into particles, and the palette it reduces to. Canvas 2D. */
export default function ShatterStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<ShatterParams>({ ...DEFAULTS });
  const simRef = useRef<ShatterHandle | null>(null);

  const [ui, setUi] = useState<ShatterParams>({ ...DEFAULTS });
  const [palette, setPalette] = useState<Swatch[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createShatterSim(canvas, paramsRef.current, setPalette);
    if (!sim) {
      setSupported(false);
      return;
    }
    simRef.current = sim;

    const observer = new IntersectionObserver(
      ([entry]) => sim.setPaused(!entry?.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      sim.destroy();
      simRef.current = null;
    };
  }, []);

  function update(key: keyof ShatterParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((prev) => ({ ...prev, [key]: value }));
  }

  /** The file never leaves the browser: it is decoded locally and sampled. */
  function onFile(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      simRef.current?.load(image);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }

  function copy(hex: string): void {
    navigator.clipboard
      ?.writeText(hex)
      .then(() => {
        setCopied(hex);
        window.setTimeout(() => setCopied((current) => (current === hex ? null : current)), 1200);
      })
      .catch(() => {});
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="An image made of thousands of square particles, each sprung to its place. Press on it to blow the particles apart."
      hint="Press and drag"
      unsupported={
        supported
          ? null
          : 'This experiment needs a 2D canvas, which this browser did not provide.'
      }
      onReset={() => simRef.current?.shatter()}
    >
      <ParamSlider
        label="Grain"
        min={3}
        max={14}
        step={1}
        value={ui.grain}
        onChange={(v) => update('grain', v)}
        format={(v) => `${v}px`}
        hint="The size of each particle. Smaller means more of them."
      />

      <ParamSlider
        label="Blast"
        min={40}
        max={260}
        step={10}
        value={ui.radius}
        onChange={(v) => update('radius', v)}
        format={(v) => `${v}px`}
        hint="How far a press reaches."
      />

      <ParamSlider
        label="Spring"
        min={0}
        max={0.04}
        step={0.001}
        value={ui.spring}
        onChange={(v) => update('spring', v)}
        format={(v) => v.toFixed(3)}
        hint="How hard each particle is pulled home. Zero leaves them where they land."
      />

      <div className="pm-shatter__palette">
        <ul className="pm-shatter__swatches" aria-label="Extracted palette">
          {palette.map((swatch) => (
            <li key={swatch.hex}>
              <button
                className="pm-shatter__swatch"
                type="button"
                onClick={() => copy(swatch.hex)}
                title={`Copy ${swatch.hex}`}
              >
                <span className="pm-shatter__chip" style={{ background: swatch.hex }} />
                <span className="pm-shatter__hex pm-tnum">
                  {copied === swatch.hex ? 'Copied' : swatch.hex}
                </span>
                <span className="pm-shatter__share pm-tnum">{swatch.share.toFixed(0)}%</span>
              </button>
            </li>
          ))}
        </ul>

        <label className="pm-shatter__upload">
          Use your own image
          <input type="file" accept="image/*" onChange={onFile} />
        </label>
      </div>
    </Stage>
  );
}
