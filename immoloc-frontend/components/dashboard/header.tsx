'use client';

import { usePathname } from 'next/navigation';
import { DesktopHeader } from './desktop-header';
import { MobileHeader } from './mobile-header';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function DashboardHeader({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const isDashboardHome = pathname === '/dashboard';

  return (
    <>
      {/* Version Mobile (< 640px) : MobileHeader uniquement sur l'Accueil /dashboard */}
      <div className="block sm:hidden">
        {isDashboardHome && <MobileHeader onMenuToggle={onMenuToggle} />}
      </div>

      {/* Version Desktop (>= 640px) */}
      <div className="hidden sm:block">
        <DesktopHeader onMenuToggle={onMenuToggle} />
      </div>
    </>
  );
}
