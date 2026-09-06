import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import { createSolarSim, type SolarHandle, type SolarParams } from './solarSim';
import './SolarStage.css';

const DEFAULTS: SolarParams = {
  gravity: 1,
  speed: 0.1,
  tilt: 70,
};

/** The solar system, integrated. Click a planet to follow it. */
export default function SolarStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<SolarParams>({ ...DEFAULTS });
  const simRef = useRef<SolarHandle | null>(null);

  const [ui, setUi] = useState<SolarParams>({ ...DEFAULTS });
  const [focused, setFocused] = useState('The system');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createSolarSim(canvas, paramsRef.current);
    if (!sim) {
      setSupported(false);
      return;
    }
    simRef.current = sim;
    sim.onFocusChange(setFocused);

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

  function update(key: keyof SolarParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((previous) => ({ ...previous, [key]: value }));
  }

  function reset(): void {
    paramsRef.current = { ...DEFAULTS };
    setUi({ ...DEFAULTS });
    simRef.current?.reseed();
    simRef.current?.focus(-1);
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="The solar system. Click a planet to zoom to it, and change gravity to see the orbits react."
      hint={`${focused} · click a planet`}
      unsupported={
        supported ? null : 'This experiment needs a 2D canvas, which this browser did not provide.'
      }
      onReset={reset}
    >
      <ParamSlider
        label="Gravity"
        min={0.3}
        max={2.2}
        step={0.01}
        value={ui.gravity}
        onChange={(value) => update('gravity', value)}
        hint="Multiplies G. Raise it and the planets fall inward; lower it and they swing wide."
      />

      <ParamSlider
        label="Orbit speed"
        min={0.1}
        max={12}
        step={0.1}
        value={ui.speed}
        onChange={(value) => update('speed', value)}
        format={(value) => `${value.toFixed(1)} yr/s`}
        hint="Years of orbit per second. Neptune needs a high setting to move at all."
      />

      <ParamSlider
        label="Tilt"
        min={0}
        max={80}
        step={1}
        value={ui.tilt}
        onChange={(value) => update('tilt', value)}
        format={(value) => `${Math.round(value)}°`}
        hint="Viewing angle above the orbital plane. 0 looks straight down; 80 is nearly edge on."
      />
    </Stage>
  );
}
