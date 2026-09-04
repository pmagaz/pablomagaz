import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import Stage from '~/components/lab/Stage/Stage';
import { createFluidSim, type FluidHandle, type FluidParams } from './fluidSim';

const DEFAULTS: FluidParams = {
  curl: 22,
  fade: 1.1,
  scale: 0.22,
};

/**
 * Hosts the fluid solver.
 *
 * Slider values are written into a mutable ref that the solver reads each
 * frame — putting them in React state would re-render 60x a second, and
 * remounting the canvas would throw the simulation away.
 */
export default function FluidStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<FluidParams>({ ...DEFAULTS });
  const simRef = useRef<FluidHandle | null>(null);

  const [ui, setUi] = useState<FluidParams>({ ...DEFAULTS });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sim = createFluidSim(canvas, paramsRef.current);
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

  function update(key: keyof FluidParams, value: number): void {
    paramsRef.current[key] = value;
    setUi((previous) => ({ ...previous, [key]: value }));
  }

  function reset(): void {
    paramsRef.current = { ...DEFAULTS };
    setUi({ ...DEFAULTS });
  }

  return (
    <Stage
      canvasRef={canvasRef}
      label="Fluid simulation. Drag to push dye through the velocity field."
      hint="Drag anywhere"
      unsupported={
        supported
          ? null
          : 'This experiment needs WebGL2 with floating-point render targets, which this browser does not provide.'
      }
      onReset={reset}
    >
      <ParamSlider
        label="Swirl"
        min={0}
        max={50}
        step={1}
        value={ui.curl}
        onChange={(value) => update('curl', value)}
        format={(value) => value.toFixed(0)}
        hint="Vorticity confinement — how much rotation is pushed back into the field."
      />

      <ParamSlider
        label="Fade"
        min={0.2}
        max={4}
        step={0.05}
        value={ui.fade}
        onChange={(value) => update('fade', value)}
        hint="Dye dissipation. Higher clears the canvas faster."
      />

      <ParamSlider
        label="Scale"
        min={0.05}
        max={0.6}
        step={0.01}
        value={ui.scale}
        onChange={(value) => update('scale', value)}
        hint="Radius of each splat of dye and force."
      />
    </Stage>
  );
}
