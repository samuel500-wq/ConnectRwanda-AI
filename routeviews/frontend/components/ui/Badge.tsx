import { HTMLAttributes } from 'react';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'ai' | 'simulated';

const tones: Record<Tone, string> = {
  neutral:   'bg-canvas text-ink border-border',
  info:      'bg-blue-50 text-electric-700 border-blue-200',
  success:   'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning:   'bg-amber-50 text-amber-800 border-amber-200',
  danger:    'bg-red-50 text-danger-600 border-red-200',
  ai:        'bg-teal/10 text-teal-700 border-teal/30',
  simulated: 'bg-amber-100 text-amber-900 border-amber-300',
};

export function Badge({
  tone = 'neutral',
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-pill border ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}