import type { HeadlineLines } from '~/lib/headline';
import './Headline.css';

export interface HeadlineProps {
  lines: HeadlineLines;
  /** Only one h1 per page — sections use h2. */
  as?: 'h1' | 'h2';
  /** Size and measure come from the owning section's css. */
  className?: string;
  /** Lets the browser even out ragged lines when no explicit breaks are set. */
  balance?: boolean;
  /** Passes through reveal hooks such as data-reveal-from. */
  [key: `data-${string}`]: unknown;
}

export default function Headline({
  lines,
  as = 'h1',
  className,
  balance = false,
  ...rest
}: HeadlineProps) {
  const Tag = as;
  const cls = ['pm-headline', balance && 'pm-headline--balance', className].filter(Boolean).join(' ');

  return (
    <Tag className={cls} {...rest}>
      {lines.map((line, lineIndex) => (
        <span className="pm-headline__line" key={lineIndex}>
          {line.map((token, tokenIndex) =>
            token.accent ? (
              <em className="pm-headline__accent" key={tokenIndex}>
                {token.text}
              </em>
            ) : (
              <span key={tokenIndex}>{token.text}</span>
            ),
          )}
        </span>
      ))}
    </Tag>
  );
}
