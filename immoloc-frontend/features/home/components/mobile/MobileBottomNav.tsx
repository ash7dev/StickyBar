'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, CalendarDays, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { href: '/',             label: 'Accueil',     icon: Home,         exact: true  },
  { href: '/logements',    label: 'Explorer',    icon: Compass,      exact: false },
  { href: '/reservations', label: 'Séjours',     icon: CalendarDays, exact: false },
  { href: '/parametres',   label: 'Paramètres',  icon: Settings,     exact: false },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  // Masquer la nav sur les pages de détail de logement (/logements/[uuid])
  const isListingDetailPage = pathname.match(/^\/logements\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

  if (isListingDetailPage) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes nav-pill-enter {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
        @keyframes nav-icon-bounce {
          0%, 100% { transform: translateY(0);    }
          40%       { transform: translateY(-3px); }
          60%       { transform: translateY(-1px); }
        }
        .nav-pill-anim  { animation: nav-pill-enter  0.35s cubic-bezier(0.34,1.56,0.64,1); }
        .nav-icon-active{ animation: nav-icon-bounce 0.40s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        {/* Fondu au-dessus */}
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />

        {/* Conteneur glassmorphism */}
        <div
          className="mx-3 mb-2 rounded-2xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          <div className="flex items-center justify-around px-2 py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-300',
                    'active:scale-90',
                    isActive && 'bg-primary-600/10',
                  )}
                >
                  {isActive && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary-600 nav-pill-anim" />
                  )}

                  <Icon
                    className={cn(
                      'w-[22px] h-[22px] transition-all duration-300',
                      isActive ? 'text-primary-700 nav-icon-active' : 'text-foreground',
                    )}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />

                  <span className={cn(
                    'text-[10px] font-semibold tracking-tight transition-colors duration-300',
                    isActive ? 'text-primary-700' : 'text-foreground',
                  )}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
