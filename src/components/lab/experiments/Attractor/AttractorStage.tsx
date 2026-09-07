import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import {
  createAttractorSim,
  type AttractorHandle,
  type AttractorParams,
} from './attractorSim';

const DEFAULTS: AttractorParams = {
  figure: 0,
  drift: 0.35,
  fade: 0.965,
};

/** Kept in step with FIGURES in the sim. */
const FIGURE_COUNT = 11;

/** Clifford attractor with drifting constants. */
export default function AttractorStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<AttractorParams>({ ...DEFAULTS });
  const simRef = useRef<AttractorHandle | null>(null);

  const [ui, setUi] = useState<AttractorParams>({ ...DEFAULTS });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createAttractorSim(canvas, paramsRef.current);
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

  function update(key: keyof AttractorParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((previous) => ({ ...previous, [key]: value }));
    // Deliberately no reseed. Clearing the buffer on every tick of the slider
    // meant a drag wiped the picture continuously and it never accumulated
    // into anything — the walkers migrate onto the new attractor by
    // themselves within a few iterations, and the decay fades the old one.
  }

  function reset(): void {
    paramsRef.current = { ...DEFAULTS };
    setUi({ ...DEFAULTS });
    simRef.current?.reseed();
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="A Clifford strange attractor, morphing as its constants drift. Move the cursor to reshape it."
      hint="Move the cursor"
      unsupported={
        supported ? null : 'This experiment needs a 2D canvas, which this browser did not provide.'
      }
      onReset={reset}
    >
      <ParamSlider
        label="Figure"
        min={0}
        max={FIGURE_COUNT - 1}
        step={1}
        value={ui.figure}
        onChange={(value) => update('figure', value)}
        format={(value) => `${Math.round(value) + 1} of ${FIGURE_COUNT}`}
        hint="Steps between parameter sets that each produce a rich figure. The map has dead zones between them, so it moves in whole steps."
      />

      <ParamSlider
        label="Drift"
        min={0}
        max={1}
        step={0.01}
        value={ui.drift}
        onChange={(value) => update('drift', value)}
        hint="How far the figure wanders from itself. At zero it freezes into a single still."
      />

      <ParamSlider
        label="Fade"
        min={0.9}
        max={0.99}
        step={0.005}
        value={ui.fade}
        onChange={(value) => update('fade', value)}
        format={(value) => value.toFixed(3)}
        hint="How long a visit lingers. Higher accumulates more samples into one picture."
      />
    </Stage>
  );
}
