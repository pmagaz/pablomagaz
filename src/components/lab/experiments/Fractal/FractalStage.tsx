import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import { createFractalSim, type FractalHandle, type FractalParams } from './fractalSim';

const DEFAULTS: FractalParams = {
  iterations: 220,
  zoomExp: 0,
  colorShift: 0,
};

/** Mandelbrot set on the GPU, pan by dragging. */
export default function FractalStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<FractalParams>({ ...DEFAULTS });
  const simRef = useRef<FractalHandle | null>(null);

  const [ui, setUi] = useState<FractalParams>({ ...DEFAULTS });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createFractalSim(canvas, paramsRef.current);
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

  function update(key: keyof FractalParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((previous) => ({ ...previous, [key]: value }));
  }

  function reset(): void {
    paramsRef.current = { ...DEFAULTS };
    setUi({ ...DEFAULTS });
    simRef.current?.recenter();
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="The Mandelbrot set. Drag to pan across the complex plane."
      hint="Drag to pan"
      unsupported={
        supported ? null : 'This experiment needs WebGL2, which this browser does not provide.'
      }
      onReset={reset}
    >
      <ParamSlider
        label="Detail"
        min={60}
        max={900}
        step={20}
        value={ui.iterations}
        onChange={(value) => update('iterations', value)}
        format={(value) => `${Math.round(value)}`}
        hint="Escape iterations. Higher resolves finer filaments at deep zoom."
      />

      <ParamSlider
        label="Zoom"
        min={0}
        max={3.4}
        step={0.02}
        value={ui.zoomExp}
        onChange={(value) => update('zoomExp', value)}
        format={(value) => `${(0.4 * Math.pow(10, value)).toFixed(1)}×`}
        hint="Logarithmic. Past about 1000x, 32-bit floats start to show."
      />

      <ParamSlider
        label="Colour"
        min={0}
        max={1}
        step={0.01}
        value={ui.colorShift}
        onChange={(value) => update('colorShift', value)}
        hint="Rotates the red-to-ember ramp through the escape bands."
      />
    </Stage>
  );
}
