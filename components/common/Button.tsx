import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import Link from 'next/link';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  'inline-flex h-10 items-center justify-center gap-2 rounded-card border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'border-transparent bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary:
    'border-border bg-surface text-foreground hover:bg-surface-hover',
  ghost:
    'border-transparent bg-transparent text-muted hover:bg-surface-hover hover:text-foreground',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
);

Button.displayName = 'Button';

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
}

/** Enlace de navegación con la apariencia exacta del Button. */
export function ButtonLink({ variant = 'primary', className = '', ...props }: ButtonLinkProps) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
