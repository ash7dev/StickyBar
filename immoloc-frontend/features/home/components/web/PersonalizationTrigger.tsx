'use client';

import { useCallback, useState } from 'react';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import { useHomePreferences } from '@/lib/hooks/useHomePreferences';
import { HomePersonalizationModal } from '@/components/home/HomePersonalizationModal';
import { cn } from '@/lib/utils/cn';

interface Props {
  className?: string;
}

export function PersonalizationTrigger({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(0);

  const { preferences, hasActivePreferences, isLoaded } = useHomePreferences();
  const selection = [...preferences.zones, ...preferences.sousTypes];
  const count = selection.length;

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSyncKey((k) => k + 1);
  }, []);

  /* Sans cet écran d'attente, le libellé passait de « Personnaliser » à
     « Modifier » après l'hydratation, avec un saut visible. */
  if (!isLoaded) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'h-[76px] animate-pulse rounded-card border border-border bg-background-alt',
          className,
        )}
      />
    );
  }

  return (
    <>
      <div
        key={syncKey}
        className={cn(
          'flex flex-nowrap items-center justify-between gap-2.5 sm:gap-4 rounded-card border border-border bg-background-card p-3 sm:p-4 shadow-sm',
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5">
          <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-display text-xs sm:text-base font-semibold text-foreground truncate">
                Votre fil personnalisé
              </h2>
              {hasActivePreferences && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-forest-700">
                  <span className="tabular-nums">{count}</span>
                </span>
              )}
            </div>

            <p className="mt-0.5 truncate text-[11px] sm:text-xs text-foreground-muted">
              {hasActivePreferences ? (
                <>
                  {selection.slice(0, 3).join(', ')}
                  {count > 3 && ` et ${count - 3} autre${count - 3 > 1 ? 's' : ''}`}
                </>
              ) : (
                'Choisissez vos zones et logements préférés'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-pill border border-border bg-background-alt px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-card"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{hasActivePreferences ? 'Modifier' : 'Personnaliser'}</span>
        </button>
      </div>

      <HomePersonalizationModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
}