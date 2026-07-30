'use client';

import { useState } from 'react';
import { Map, List, Sparkles } from 'lucide-react';
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
 * Mobile : Commutation fluide via le bouton flottant (🗺️ Carte / 📋 Liste)
 */
export function ExplorerViewManager({ listings }: ExplorerViewManagerProps) {
  // Sur mobile : 'list' | 'map'
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

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

      {/* ── BOUTON FLOTTANT MOBILE (Bascule Carte ↔ Liste) ─────────────── */}
      <div className="fixed bottom-20 left-4 z-40 lg:hidden animate-in fade-in slide-in-from-bottom-4">
        <button
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-forest-950 text-white font-bold text-sm shadow-2xl backdrop-blur-xl border border-white/20 active:scale-95 transition-all"
        >
          {mobileView === 'list' ? (
            <>
              <Map className="w-[18px] h-[18px] text-lime-300" />
              <span>Afficher la carte</span>
            </>
          ) : (
            <>
              <List className="w-[18px] h-[18px] text-lime-300" />
              <span>Afficher la liste</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
