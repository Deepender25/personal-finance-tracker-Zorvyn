import React from 'react';
import { BentoBox } from '../components/BentoBox';

export function Placeholder({ title, description }: { title: string, description: string }) {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">{title}</h1>
        <p className="text-muted mt-1">{description}</p>
      </header>

      <BentoBox span={4} className="min-h-[400px] flex items-center justify-center text-center">
        <div>
          <div className="w-16 h-16 rounded-2xl bg-surface-hover border border-border-subtle flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span className="text-2xl opacity-50">🚧</span>
          </div>
          <h2 className="text-xl font-semibold text-primary mb-2">Under Construction</h2>
          <p className="text-muted max-w-md mx-auto">
            The {title} module is currently being built. Check back later for updates.
          </p>
        </div>
      </BentoBox>
    </div>
  );
}
