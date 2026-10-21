'use client';

import { usePathname } from 'next/navigation';
import { DesktopHeader } from './desktop-header';
import { MobileHeader } from './mobile-header';
import { OwnerTopNav } from './owner-topnav';

interface HeaderProps {
  onMenuToggle: () => void;
  /** Pages de détail : elles ont leur propre barre de retour sous 1024 px ; seule la navbar desktop reste. */
  desktopOnly?: boolean;
}

export function DashboardHeader({ onMenuToggle, desktopOnly = false }: HeaderProps) {
  const pathname = usePathname();
  const isDashboardHome = pathname === '/dashboard';

  return (
    <>
      {/* Version Mobile (< 640px) : MobileHeader uniquement sur l'Accueil /dashboard */}
      {!desktopOnly && (
        <>
          <div className="block sm:hidden">
            {isDashboardHome && <MobileHeader />}
          </div>

          {/* Tablette (640–1023px) : en-tête + tiroir de navigation */}
          <div className="hidden sm:block lg:hidden">
            <DesktopHeader onMenuToggle={onMenuToggle} />
          </div>
        </>
      )}

      {/* Desktop (>= 1024px) : navigation horizontale, sans sidebar */}
      <div className="hidden lg:block">
        <OwnerTopNav />
      </div>
    </>
  );
}
