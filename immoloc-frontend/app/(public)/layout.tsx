'use client';

import type { ReactNode } from 'react';
import { Navbar } from '@/features/home/components/web/Navbar';
import { Footer } from '@/features/home/components/web/Footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-canvas pt-[env(safe-area-inset-top,0px)]">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

