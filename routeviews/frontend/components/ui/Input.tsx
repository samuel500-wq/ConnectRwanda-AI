'use client';
import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, className = '', id, ...rest }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-surface border border-border rounded-pill px-4 py-2.5 text-sm text-ink placeholder:text-ink-100 focus:outline-none focus:border-electric focus:shadow-focus transition ${className}`}
          {...rest}
        />
        {hint && <p className="text-xs text-ink-100 mt-1.5">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';