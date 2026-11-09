import { ReactNode } from 'react';

export function Alert({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const palette = {
    info:    'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    danger:  'bg-red-50 border-red-300 text-red-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }[tone];
  return (
    <div role="status" className={`rounded-card border ${palette} px-4 py-3 text-sm ${className}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      {children}
    </div>
  );
}