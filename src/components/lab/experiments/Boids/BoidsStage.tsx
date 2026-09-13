import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import { createBoidsSim, type BoidsHandle, type BoidsParams } from './boidsSim';

const DEFAULTS: BoidsParams = {
  count: 150,
  separation: 1.5,
  alignment: 1.0,
  cohesion: 1.0,
};

/** Flocking boids with emergent swarm behavior. Canvas 2D. */
export default function BoidsStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<BoidsParams>({ ...DEFAULTS });
  const simRef = useRef<BoidsHandle | null>(null);

  const [ui, setUi] = useState<BoidsParams>({ ...DEFAULTS });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createBoidsSim(canvas, paramsRef.current);
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

  function update(key: keyof BoidsParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="A flock of boids following separation, alignment, and cohesion rules. Move the cursor to scatter them."
      hint="Move the cursor"
      unsupported={
        supported
          ? null
          : 'This experiment needs a 2D canvas, which this browser did not provide.'
      }
      onReset={() => simRef.current?.scatter()}
    >
      <ParamSlider
        label="Separation"
        min={0}
        max={3}
        step={0.1}
        value={ui.separation}
        onChange={(v) => update('separation', v)}
        format={(v) => v.toFixed(1)}
        hint="How strongly boids avoid crowding each other."
      />

      <ParamSlider
        label="Alignment"
        min={0}
        max={3}
        step={0.1}
        value={ui.alignment}
        onChange={(v) => update('alignment', v)}
        format={(v) => v.toFixed(1)}
        hint="How strongly boids match their neighbors' direction."
      />

      <ParamSlider
        label="Cohesion"
        min={0}
        max={3}
        step={0.1}
        value={ui.cohesion}
        onChange={(v) => update('cohesion', v)}
        format={(v) => v.toFixed(1)}
        hint="How strongly boids move toward the group center."
      />
    </Stage>
  );
}
