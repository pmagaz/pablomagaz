import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import { createBallsSim, type BallsHandle, type BallsParams } from './ballsSim';

const DEFAULTS: BallsParams = {
  gravity: 1500,
  bounce: 0.72,
  count: 180,
};

/** Falling, bouncing, shovable balls. Canvas 2D, no WebGL needed. */
export default function BallsStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<BallsParams>({ ...DEFAULTS });
  const simRef = useRef<BallsHandle | null>(null);

  const [ui, setUi] = useState<BallsParams>({ ...DEFAULTS });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createBallsSim(canvas, paramsRef.current);
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

  function update(key: keyof BallsParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="Balls falling and bouncing under gravity. Move the pointer to push them around."
      hint="Move the cursor"
      unsupported={
        supported
          ? null
          : 'This experiment needs a 2D canvas, which this browser did not provide.'
      }
      onReset={() => simRef.current?.shake()}
    >
      <ParamSlider
        label="Gravity"
        min={0}
        max={4000}
        step={50}
        value={ui.gravity}
        onChange={(value) => update('gravity', value)}
        format={(value) => `${Math.round(value)}`}
        hint="Downward acceleration. At zero they drift and settle wherever you leave them."
      />

      <ParamSlider
        label="Bounce"
        min={0.1}
        max={0.98}
        step={0.01}
        value={ui.bounce}
        onChange={(value) => update('bounce', value)}
        hint="Restitution. Near 1 almost no energy is lost on impact."
      />

      <ParamSlider
        label="Count"
        min={30}
        max={400}
        step={10}
        value={ui.count}
        onChange={(value) => update('count', value)}
        format={(value) => `${Math.round(value)}`}
        hint="Number of balls. Collisions use a spatial grid, so this scales."
      />
    </Stage>
  );
}
