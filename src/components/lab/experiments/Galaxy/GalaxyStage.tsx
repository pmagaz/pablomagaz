import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import { createGalaxySim, type GalaxyHandle, type GalaxyParams } from './galaxySim';

/** Star count is replaced with the sim's device-aware suggestion on mount. */
const DEFAULTS: GalaxyParams = {
  speed: 1,
  stars: 2200,
  systems: 4,
};

/** A flight through a starfield, past systems with planets in orbit. */
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
      label="A flight through a starfield, passing systems with planets in orbit. Move the pointer to steer."
      hint="Move to steer · hold to accelerate"
      unsupported={
        supported ? null : 'This experiment needs a 2D canvas, which this browser did not provide.'
      }
      onReset={() => simRef.current?.reseed()}
    >
      <ParamSlider
        label="Speed"
        min={0.1}
        max={3}
        step={0.05}
        value={ui.speed}
        onChange={(value) => update('speed', value)}
        hint="How fast you travel. Hold the pointer down to accelerate past this."
      />

      <ParamSlider
        label="Stars"
        min={200}
        max={4000}
        step={100}
        value={ui.stars}
        onChange={(value) => update('stars', value)}
        format={(value) => `${Math.round(value)}`}
        hint="Density of the field you are flying through."
      />

      <ParamSlider
        label="Systems"
        min={0}
        max={8}
        step={1}
        value={ui.systems}
        onChange={(value) => update('systems', value)}
        format={(value) => `${Math.round(value)}`}
        hint="Suns with planets on orbits. At zero it is open space."
      />
    </Stage>
  );
}
