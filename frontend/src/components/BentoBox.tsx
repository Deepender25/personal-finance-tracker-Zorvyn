import React from 'react';
import { cn } from '../lib/utils';

interface BentoBoxProps extends React.ComponentProps<'div'> {
  span?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

export function BentoBox({ span = 1, className, children, ...props }: BentoBoxProps) {
  return (
    <div
      className={cn(
        "border border-border-subtle rounded-2xl p-6 bento-glow transition-all duration-200",
        "flex flex-col relative overflow-hidden",
        {
          "col-span-1 md:col-span-2 lg:col-span-1": span === 1,
          "col-span-1 md:col-span-2 lg:col-span-2": span === 2,
          "col-span-1 md:col-span-4 lg:col-span-3": span === 3,
          "col-span-1 md:col-span-4 lg:col-span-4": span === 4,
        },
        className
      )}
      {...props}
    >
      {/* Subtle top inset border for glass effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}
