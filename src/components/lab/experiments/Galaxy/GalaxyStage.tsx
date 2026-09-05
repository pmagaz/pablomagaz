import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import { createGalaxySim, type GalaxyHandle, type GalaxyParams } from './galaxySim';

/** Star count is replaced with the sim's device-aware suggestion on mount. */
const DEFAULTS: GalaxyParams = {
  gravity: 1,
  stars: 3200,
  pull: 0.5,
};

/** A galaxy you can pull apart with the cursor. */
export default function GalaxyStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<GalaxyParams>({ ...DEFAULTS });
  const simRef = useRef<GalaxyHandle | null>(null);

  const [ui, setUi] = useState<GalaxyParams>({ ...DEFAULTS });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createGalaxySim(canvas, paramsRef.current);
    if (!sim) {
      setSupported(false);
      return;
    }
    simRef.current = sim;

    // A phone should not open with a desktop star count.
    paramsRef.current.stars = sim.suggestedStars;
    setUi((previous) => ({ ...previous, stars: sim.suggestedStars }));
    sim.reseed();

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

  function update(key: keyof GalaxyParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="A galaxy of stars orbiting a massive core. Move the pointer to pull them out of orbit."
      hint="Move to pull · hold for more"
      unsupported={
        supported ? null : 'This experiment needs a 2D canvas, which this browser did not provide.'
      }
      onReset={() => simRef.current?.reseed()}
    >
      <ParamSlider
        label="Gravity"
        min={0.2}
        max={2.5}
        step={0.05}
        value={ui.gravity}
        onChange={(value) => update('gravity', value)}
        hint="Scales every mass. Drop it and the disk unwinds; raise it and it collapses inward."
      />

      <ParamSlider
        label="Stars"
        min={300}
        max={6000}
        step={100}
        value={ui.stars}
        onChange={(value) => update('stars', value)}
        format={(value) => `${Math.round(value)}`}
        hint="Each star costs four force evaluations, so this scales linearly."
      />

      <ParamSlider
        label="Pull"
        min={0}
        max={1.5}
        step={0.05}
        value={ui.pull}
        onChange={(value) => update('pull', value)}
        hint="How much mass your cursor carries. At zero you are only a spectator."
      />
    </Stage>
  );
}
