'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import { useHomePreferences } from '@/lib/hooks/useHomePreferences';
import { HomePersonalizationModal } from '@/components/home/HomePersonalizationModal';
import { cn } from '@/lib/utils/cn';

const AUTO_OPEN_KEY = 'klef_onboarding_shown';

interface Props {
  className?: string;
}

export function PersonalizationTrigger({ className }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(0);

  const { preferences, hasActivePreferences, isLoaded, completeOnboarding } = useHomePreferences();
  const selection = [...preferences.zones, ...preferences.sousTypes];
  const count = selection.length;

  const autoOpened = useRef(false);

  /* Ouverture automatique à la première visite, une seule fois.
     Deux gardes : `hasCompletedOnboarding` en localStorage pour les visites
     suivantes, et un flag de session pour le cas où le localStorage est
     indisponible (navigation privée, cookies bloqués) — sans lui, la modale
     se rouvrirait à chaque chargement de page. */
  useEffect(() => {
    if (!isLoaded || autoOpened.current) return;
    autoOpened.current = true;

    if (preferences.hasCompletedOnboarding) return;

    try {
      if (sessionStorage.getItem(AUTO_OPEN_KEY)) return;
      sessionStorage.setItem(AUTO_OPEN_KEY, '1');
    } catch {
      /* Stockage de session indisponible : on ouvre quand même, une fois. */
    }

    setIsOpen(true);
  }, [isLoaded, preferences.hasCompletedOnboarding]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    /* Marqué comme vu même si rien n'a été sélectionné : sinon la modale
       reviendrait à chaque visite pour quelqu'un qui l'a fermée exprès. */
    if (!preferences.hasCompletedOnboarding) completeOnboarding();
    /* `syncKey` force la relecture : ce composant et la modale appellent
       `useHomePreferences()` séparément, donc chacun a son propre état. */
    setSyncKey((k) => k + 1);
  }, [completeOnboarding, preferences.hasCompletedOnboarding]);

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
          'flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-background-card p-4 shadow-sm sm:p-5',
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-sm font-semibold text-foreground sm:text-base">
                Votre fil personnalisé
              </h2>
              {hasActivePreferences && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-2.5 py-0.5 text-xs font-semibold text-forest-700">
                  <span className="tabular-nums">{count}</span> filtre{count > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* `join(', ')` sur huit entrées produisait une ligne tronquée en
               plein milieu d'un nom de zone. */}
            <p className="mt-0.5 truncate text-xs text-foreground-muted">
              {hasActivePreferences ? (
                <>
                  {selection.slice(0, 3).join(', ')}
                  {count > 3 && ` et ${count - 3} autre${count - 3 > 1 ? 's' : ''}`}
                </>
              ) : (
                'Choisissez vos zones et vos types de logement préférés.'
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-pill border border-border bg-background-alt px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-card"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          {hasActivePreferences ? 'Modifier' : 'Personnaliser'}
        </button>
      </div>

      <HomePersonalizationModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
}