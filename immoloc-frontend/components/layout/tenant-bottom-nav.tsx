'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Settings } from 'lucide-react';
import { useRoleStore } from '@/stores/role.store';
import { cn } from '@/lib/utils/cn';

export function TenantBottomNav() {
  const pathname = usePathname();
  const { nestToken, activeRole } = useRoleStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (!nestToken || activeRole !== 'LOCATAIRE') return null;

  const items = [
    { href: '/', label: 'Accueil', icon: Home, exact: true },
    { href: '/reservations', label: 'Réservations', icon: CalendarDays },
    { href: '/parametres', label: 'Paramètres', icon: Settings },
  ];

  return (
    <>
      {/* Spacer pour éviter que le contenu soit caché derrière la nav fixe */}
      <div className="md:hidden h-20" />

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-border backdrop-blur-md bg-background-card/90 dark:bg-neutral-950/90 safe-area-inset-bottom shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors"
            >
              <item.icon className={cn('h-5 w-5', active ? 'text-primary-700' : 'text-foreground-muted')} />
              <span className={cn('text-[10px] font-bold tracking-tight', active ? 'text-primary-700' : 'text-foreground-muted')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
