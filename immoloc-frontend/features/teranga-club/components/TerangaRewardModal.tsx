'use client';

import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Coins, Trophy, ChevronRight, X, ShieldCheck, PartyPopper, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTerangaClub } from '../hooks/use-teranga-club';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /* Pas de valeur par défaut : `= 1500` faisait annoncer un gain de
     1 500 coins dès que le parent oubliait la prop. */
  earnedCoins?: number;
}

/* Les emojis 🔑 👑 🎉 dans les libellés : rendu variable selon la plateforme,
   annoncés littéralement par les lecteurs d'écran, et incohérents avec les
   icônes lucide utilisées à côté. */
const TIER_GOALS: Record<string, {
  nextTier: string | null;
  goalText: string;
  perkText: string;
}> = {
  BRONZE: {
    nextTier: 'Clé d’Argent',
    goalText: '3 séjours ou 300 000 FCFA dépensés',
    perkText: '2 % de cashback et traitement prioritaire',
  },
  SILVER: {
    nextTier: 'Clé d’Or',
    goalText: '8 séjours ou 1 000 000 FCFA dépensés',
    perkText: '3 % de cashback et priorité auprès des hôtes',
  },
  GOLD: {
    /* `null` : le palier maximal n'a pas d'objectif suivant. La version
       précédente affichait quand même « Objectif Privilège » avec une barre
       de progression, en contradiction avec son propre texte. */
    nextTier: null,
    goalText: 'Statut maximal atteint',
    perkText: 'Vous bénéficiez du cashback maximal de 3 %',
  },
};

const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

export function TerangaRewardModal({ isOpen, onClose, earnedCoins }: Props) {
  const { data: teranga } = useTerangaClub();

  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* Ni Échap, ni piège à focus, ni verrou de scroll, ni fermeture au clic
     sur le fond. */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = panelRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  const tier = teranga?.tier ?? 'BRONZE';
  const info = TIER_GOALS[tier] ?? TIER_GOALS.BRONZE;

  /* La barre était figée à `w-3/5` : elle affichait 60 % à tout le monde,
     quel que soit le nombre de séjours ou le montant dépensé. Elle n'apparaît
     désormais que si l'API fournit une progression réelle. */
  const progression = useMemo(() => {
    const p = Number((teranga as { progressionTier?: number } | undefined)?.progressionTier);
    return Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : null;
  }, [teranga]);

  const handleBackdrop = useCallback(() => onClose(), [onClose]);

  if (!isOpen) return null;

  const coins = Number(earnedCoins) || 0;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-forest-950/70 p-4 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-card border border-border bg-background-card shadow-xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="glass absolute top-3.5 right-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-pill text-forest-900"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── En-tête ──────────────────────────────────────────────────── */}

        <div className="section-inverse relative overflow-hidden rounded-none p-6 pt-8 text-center">
          {/* Deux halos superposés dont un lime, plus un dégradé, plus une
             pastille en dégradé lime→or : quatre couches pour un en-tête. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-pill bg-forest-700/40 blur-3xl"
          />

          <div className="relative">
            {/* `animate-bounce` en boucle infinie sur la pastille. */}
            <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-inner border border-gold-400/30 bg-gold-400/15 text-gold-300">
              <PartyPopper className="h-8 w-8" aria-hidden="true" />
            </span>

            <h2 id={titleId} className="font-display text-xl font-semibold text-on-inverse-display">
              Check-in validé
            </h2>
            <p className="mt-1 text-xs text-on-inverse-muted">
              Votre installation est confirmée. Bon séjour.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">

          {/* ── Cashback ───────────────────────────────────────────────── */}

          {coins > 0 && (
            <div className="space-y-2 rounded-card border border-gold-200 bg-gold-50 p-4 text-center">
              <span className="inline-flex items-center gap-2 rounded-pill border border-gold-200 bg-background-card px-3 py-1 text-xs font-semibold text-gold-700">
                <Coins className="h-4 w-4" aria-hidden="true" />
                Cashback crédité
              </span>

              <p className="font-display text-3xl font-semibold tracking-tight tabular-nums text-gold-700">
                +{nombre(coins)}
              </p>
              <p className="text-sm font-semibold text-foreground">Klef Coins</p>

              <p className="text-xs leading-relaxed text-foreground-muted">
                Vos coins sont disponibles immédiatement et utilisables sur vos prochaines
                réservations.
              </p>
            </div>
          )}

          {/* ── Progression ────────────────────────────────────────────── */}

          <div className="space-y-3 rounded-card border border-border bg-background-alt p-4">
            {info.nextTier ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Prochain statut
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-gold-700">
                    <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                    {info.nextTier}
                  </span>
                </div>

                <p className="text-sm font-semibold text-foreground">{info.goalText}</p>

                {progression !== null && (
                  <div className="space-y-1">
                    <div
                      role="img"
                      aria-label={`Progression : ${Math.round(progression)} pour cent`}
                      className="h-2 w-full overflow-hidden rounded-pill bg-background-card"
                    >
                      <div
                        className="h-full rounded-pill bg-gold-400 transition-[width] duration-700"
                        style={{ width: `${progression}%` }}
                      />
                    </div>
                    <p className="text-right text-xs tabular-nums text-foreground-muted">
                      {Math.round(progression)} %
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-gold-200 bg-gold-50 text-gold-700">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-foreground">{info.goalText}</p>
              </div>
            )}

            <p className="flex items-start gap-1.5 border-t border-border pt-3 text-xs leading-relaxed text-foreground-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden="true" />
              {info.perkText}
            </p>
          </div>

          {/* ── Actions ────────────────────────────────────────────────── */}

          <div className="space-y-2">
            <Link
              href="/teranga-club"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-pill bg-button-primary px-5 py-3.5 text-sm font-semibold text-on-button-primary transition-[background-color,transform] hover:bg-button-primary-hover active:scale-[0.98]"
            >
              Voir mon Teranga Club
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2.5 text-center text-xs font-semibold text-foreground-muted transition-colors hover:text-foreground"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}