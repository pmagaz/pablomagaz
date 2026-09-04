import { useEffect, useRef, useState } from 'react';
import ParamSlider from '~/components/lab/ParamSlider/ParamSlider';
import { createFluidSim, type FluidHandle, type FluidParams } from './fluidSim';
import './FluidStage.css';

const DEFAULTS: FluidParams = {
  curl: 22,
  fade: 1.1,
  scale: 0.22,
};

/**
 * Hosts the fluid solver.
 *
 * Rendered with `client:only` so none of the WebGL code is touched during the
 * static build. Slider values are written into a mutable ref that the solver
 * reads each frame — putting them in React state would re-render 60x a second
 * and remounting the canvas would throw the simulation away.
 */
export default function FluidStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef<FluidParams>({ ...DEFAULTS });
  const simRef = useRef<FluidHandle | null>(null);

  // Mirrored in state purely so the readouts re-render.
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

    // Stop simulating while the canvas is scrolled out of view.
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

  if (!supported) {
    return (
      <div className="pm-stage pm-stage--unsupported">
        <p className="pm-stage__fallback">
          This experiment needs WebGL2 with floating-point render targets, which this
          browser does not provide. Everything else on the page works as normal.
        </p>
      </div>
    );
  }

  return (
    <div className="pm-stage">
      <div className="pm-stage__canvas">
        <canvas ref={canvasRef} aria-label="Fluid simulation. Drag to move the dye." />
        <p className="pm-stage__hint" aria-hidden="true">
          Drag anywhere
        </p>
      </div>

      <div className="pm-stage__controls">
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

        <button className="pm-stage__reset" type="button" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
