import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import {
  createPendulumSim,
  type PendulumHandle,
  type PendulumParams,
} from './pendulumSim';

const DEFAULTS: PendulumParams = {
  length2: 0.75,
  mass2: 1,
  damping: 0.9997,
};

/** Double pendulum demonstrating chaotic motion. Canvas 2D. */
export default function PendulumStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<PendulumParams>({ ...DEFAULTS });
  const simRef = useRef<PendulumHandle | null>(null);

  const [ui, setUi] = useState<PendulumParams>({ ...DEFAULTS });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createPendulumSim(canvas, paramsRef.current);
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

  function update(key: keyof PendulumParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="A double pendulum swinging chaotically, with a fading trail showing its path."
      hint="Watch the chaos"
      unsupported={
        supported
          ? null
          : 'This experiment needs a 2D canvas, which this browser did not provide.'
      }
      onReset={() => simRef.current?.reset()}
    >
      <ParamSlider
        label="Second length"
        min={0.3}
        max={1.5}
        step={0.05}
        value={ui.length2}
        onChange={(v) => update('length2', v)}
        format={(v) => `${v.toFixed(2)}x`}
        hint="Length of the second rod relative to the first."
      />

      <ParamSlider
        label="Second mass"
        min={0.5}
        max={2}
        step={0.1}
        value={ui.mass2}
        onChange={(v) => update('mass2', v)}
        format={(v) => `${v.toFixed(1)}x`}
        hint="Mass of the lower bob relative to the upper."
      />

      <ParamSlider
        label="Damping"
        min={0.99}
        max={1}
        step={0.001}
        value={ui.damping}
        onChange={(v) => update('damping', v)}
        format={(v) => `${(v * 100).toFixed(1)}%`}
        hint="Energy retention per frame. At 100% it swings forever."
      />
    </Stage>
  );
}
