import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import {
  createAttractorSim,
  type AttractorHandle,
  type AttractorParams,
} from './attractorSim';

const DEFAULTS: AttractorParams = {
  formA: -1.4,
  formB: 1.6,
  drift: 0.35,
};

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
    // The old density belongs to the old shape; clear it so the new one
    // appears immediately rather than fading in through the previous.
    simRef.current?.reseed();
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
        label="Form A"
        min={-3}
        max={3}
        step={0.02}
        value={ui.formA}
        onChange={(value) => update('formA', value)}
        hint="The dominant fold. Small moves are the difference between a spiral and a lattice."
      />

      <ParamSlider
        label="Form B"
        min={-3}
        max={3}
        step={0.02}
        value={ui.formB}
        onChange={(value) => update('formB', value)}
        hint="The second fold, acting across the first."
      />

      <ParamSlider
        label="Drift"
        min={0}
        max={1}
        step={0.01}
        value={ui.drift}
        onChange={(value) => update('drift', value)}
        hint="How fast the figure morphs. At zero it freezes into a single still."
      />
    </Stage>
  );
}
