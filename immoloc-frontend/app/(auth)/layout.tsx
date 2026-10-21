import type { ReactNode } from 'react';
import { PaixiLogo } from '@/components/brand/PaixiLogo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background-alt flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="flex justify-center text-3xl">
            <PaixiLogo />
          </h1>
          <p className="text-foreground-muted text-sm mt-1">Locations de confiance au Sénégal</p>
        </div>
        <div className="bg-background rounded-2xl shadow-xl border border-border p-8 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
