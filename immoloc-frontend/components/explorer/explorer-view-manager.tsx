'use client';

import { useEffect, useState } from 'react';
import type { Listing } from '@/lib/nestjs/types';
import { ResultsGrid } from './results-grid';
import { ExplorerMap } from './explorer-map';
import { cn } from '@/lib/utils/cn';

interface ExplorerViewManagerProps {
  listings: Listing[];
}

/**
 * Gestionnaire réactif d'affichage Explorer
 * Desktop : Split 2 colonnes (Liste + Carte)
 * Mobile : Commutation fluide via l'action bar sur la même ligne que "Passer en mode hôte"
 */
export function ExplorerViewManager({ listings }: ExplorerViewManagerProps) {
  // Sur mobile : 'list' | 'map'
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    // Notifier le sous-système de navigation mobile du statut courant
    window.dispatchEvent(new CustomEvent('explorer-view-changed', { detail: mobileView }));

    const handleToggle = () => {
      setMobileView((prev) => (prev === 'list' ? 'map' : 'list'));
    };

    window.addEventListener('explorer-toggle-view', handleToggle);
    return () => {
      window.removeEventListener('explorer-toggle-view', handleToggle);
    };
  }, [mobileView]);

  return (
    <div className="relative">
      
      {/* ── Grille responsive Desktop / Mobile ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_1fr] gap-6 xl:gap-8 items-start">
        
        {/* ── Colonne Liste ──────────────────────────────────────────────── */}
        <section
          className={cn(
            'w-full transition-all duration-300',
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          )}
        >
          <ResultsGrid listings={listings} />
        </section>

        {/* ── Colonne Carte ──────────────────────────────────────────────── */}
        <aside
          className={cn(
            'w-full transition-all duration-300',
            mobileView === 'list'
              ? 'hidden lg:block sticky top-[calc(var(--navbar-height,80px)+1rem)] h-[calc(100dvh-var(--navbar-height,80px)-2rem)] rounded-[24px] overflow-hidden'
              : 'block h-[calc(100dvh-var(--navbar-height,80px)-5rem)] rounded-[24px] overflow-hidden border border-border shadow-md'
          )}
        >
          <ExplorerMap listings={listings} />
        </aside>

      </div>

    </div>
  );
}
