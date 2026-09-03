import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary';

interface CommonProps {
  variant?: ButtonVariant;
  /** Stretches to the full width of its container — mobile CTAs. */
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> & {
    /** Renders an <a> when set, a <button> otherwise. */
    href: string;
  };

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
  };

export type ButtonProps = AnchorProps | NativeButtonProps;

function classes(variant: ButtonVariant, block: boolean, className?: string): string {
  return ['pm-button', `pm-button--${variant}`, block && 'pm-button--block', className]
    .filter(Boolean)
    .join(' ');
}

export default function Button(props: ButtonProps) {
  const { variant = 'primary', block = false, className, children } = props;
  const cls = classes(variant, block, className);

  if (props.href !== undefined) {
    const { variant: _v, block: _b, className: _c, children: _ch, ...rest } = props;
    return (
      <a className={cls} {...rest}>
        {children}
      </a>
    );
  }

  const { variant: _v, block: _b, className: _c, children: _ch, ...rest } = props;
  return (
    <button type={rest.type ?? 'button'} className={cls} {...rest}>
      {children}
    </button>
  );
}
