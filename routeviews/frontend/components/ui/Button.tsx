'use client';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-pill transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:shadow-focus';

const variants: Record<Variant, string> = {
  primary:   'bg-electric text-white hover:bg-electric-600 active:scale-[0.98]',
  secondary: 'bg-navy text-white hover:bg-navy-700 active:scale-[0.98]',
  ghost:     'bg-transparent text-ink hover:bg-canvas',
  outline:   'bg-surface text-ink border border-border hover:border-border-strong hover:bg-canvas',
  danger:    'bg-danger text-white hover:bg-danger-600',
  ai:        'bg-teal text-white hover:bg-teal-600 active:scale-[0.98]',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3.5 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...rest }, ref) => (
    <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />
  )
);
Button.displayName = 'Button';