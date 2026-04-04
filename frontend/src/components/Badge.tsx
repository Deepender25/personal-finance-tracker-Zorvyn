import React from 'react';
import { cn } from '../lib/utils';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'admin' | 'neutral';

interface BadgeProps extends React.ComponentProps<'span'> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        {
          "bg-success-bg text-success border-success/20": variant === 'success',
          "bg-danger-bg text-danger border-danger/20": variant === 'danger',
          "bg-warning-bg text-warning border-warning/20": variant === 'warning',
          "bg-transparent text-primary border-primary/30": variant === 'admin',
          "bg-surface-hover text-muted border-border-strong": variant === 'neutral',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
