import { useId } from 'react';
import './ParamSlider.css';

export interface ParamSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Formats the readout. Defaults to two decimal places. */
  format?: (value: number) => string;
  /** Short hint shown under the label. */
  hint?: string;
}

/**
 * One animation parameter.
 *
 * A real <input type="range"> underneath, so keyboard, screen readers and
 * touch all behave natively; the track is painted with a gradient driven by
 * a css variable, which is the only cross-browser way to fill a range input.
 */
export default function ParamSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format = (v) => v.toFixed(2),
  hint,
}: ParamSliderProps) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;

  return (
    <div className="pm-param">
      <div className="pm-param__head">
        <label className="pm-param__label" htmlFor={id}>
          {label}
        </label>
        <output className="pm-param__value pm-tnum" htmlFor={id}>
          {format(value)}
        </output>
      </div>

      <input
        className="pm-param__input"
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--pm-param-fill': `${fill}%` } as React.CSSProperties}
      />

      {hint && <p className="pm-param__hint">{hint}</p>}
    </div>
  );
}
