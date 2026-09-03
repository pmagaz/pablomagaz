import './Eyebrow.css';

export interface EyebrowProps {
  /** Label text — rendered uppercase with 0.22em tracking. */
  text: string;
  /** `muted` for section labels, `red` for categories. */
  tone?: 'muted' | 'red';
  /** The 7px brand dot that precedes bylines and section labels. */
  dot?: boolean;
  className?: string;
}

export default function Eyebrow({ text, tone = 'muted', dot = false, className }: EyebrowProps) {
  const cls = ['pm-eyebrow', `pm-eyebrow--${tone}`, className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      {dot && <span className="pm-eyebrow__dot" aria-hidden="true" />}
      <span className="pm-eyebrow__text">{text}</span>
    </div>
  );
}
