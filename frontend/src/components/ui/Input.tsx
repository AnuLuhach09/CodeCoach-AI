import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        ) : null}
        <input
          type={type}
          ref={ref}
          className={twMerge(
            clsx(
              'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              {
                'border-destructive focus-visible:ring-destructive': !!error,
              }
            ),
            className
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-xs text-destructive animate-fade-in">{error}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
