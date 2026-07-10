'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/features/home/components/web/Footer';
import { MobileBottomNav } from '@/features/home/components/mobile/MobileBottomNav';

export default function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideFooter = pathname === '/become-host';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
}
