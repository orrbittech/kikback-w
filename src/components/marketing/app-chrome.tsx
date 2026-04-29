import { type ReactNode } from 'react';
import { LandingHeader } from '@/components/landing-header';

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <LandingHeader />
      {children}
    </div>
  );
}
