import type { ReactNode, RefObject } from 'react';
import './Stage.css';

export interface StageProps {
  /** Owned by the experiment, so its simulation can attach to the element. */
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Accessible description of what the canvas shows. */
  label: string;
  /** Small uppercase hint in the corner, e.g. "Drag anywhere". */
  hint?: string;
  /** Set when the browser cannot run the experiment; replaces the canvas. */
  unsupported?: string | null;
  /** The parameter sliders. */
  children: ReactNode;
  onReset?: () => void;
}

/**
 * Shared chrome for every experiment: an ink canvas with a controls rail
 * beneath it. Each experiment supplies its own sliders as children.
 */
export default function Stage({
  canvasRef,
  label,
  hint,
  unsupported,
  children,
  onReset,
}: StageProps) {
  if (unsupported) {
    return (
      <div className="pm-stage pm-stage--unsupported">
        <p className="pm-stage__fallback">{unsupported}</p>
      </div>
    );
  }

  return (
    <div className="pm-stage">
      <div className="pm-stage__canvas">
        <canvas ref={canvasRef} aria-label={label} />
        {hint && (
          <p className="pm-stage__hint" aria-hidden="true">
            {hint}
          </p>
        )}
      </div>

      <div className="pm-stage__controls">
        {children}

        {onReset && (
          <button className="pm-stage__reset" type="button" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
