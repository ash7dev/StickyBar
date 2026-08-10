'use client';

import { Coins, Tag, Award } from 'lucide-react';
import type { TerangaAccountData } from '@/lib/nestjs';
import { useAutoScrollCarousel } from '../hooks/use-auto-scroll-carousel';

interface Props {
  data: TerangaAccountData | null;
  isAuthenticated: boolean;
}

export function TerangaPerksGrid({ data, isAuthenticated }: Props) {
  const cashbackPct = data?.cashbackPct ?? 1.5;
  const tier = data?.tier ?? 'BRONZE';

  const { containerRef, bindAutoScroll } = useAutoScrollCarousel<HTMLDivElement>({
    intervalMs: 4500,
    itemCount: 3,
  });

  return (
    <div
      ref={containerRef}
      {...bindAutoScroll}
      className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar scroll-smooth"
    >
      {/* Carte 1 : Cashback Automatique */}
      <div className="snap-center shrink-0 w-[85vw] sm:w-auto card p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="marker-box border border-forest-100 bg-forest-50 text-forest-700">
            <Coins className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-forest-50 text-forest-700 border border-forest-100">
            Cashback
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground-muted">Gagnez sur chaque séjour</p>
          <p className="font-display text-2xl font-semibold text-foreground tabular-nums">
            {cashbackPct}% <span className="text-sm font-semibold text-forest-700">en Klef Coins</span>
          </p>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Chaque séjour réservé et validé crédite automatiquement des Klef Coins dans votre portefeuille.
          </p>
        </div>
      </div>

      {/* Carte 2 : Réduction au Checkout */}
      <div className="snap-center shrink-0 w-[85vw] sm:w-auto card p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="marker-box border border-forest-100 bg-forest-50 text-forest-700">
            <Tag className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-forest-50 text-forest-700 border border-forest-100">
            1 Coin = 1 FCFA
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground-muted">Économisez à l’acompte</p>
          <p className="font-display text-xl font-semibold text-foreground">
            Réduction Immédiate
          </p>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Déduisez vos Klef Coins accumulés directement lors du paiement de votre acompte pour réserver moins cher.
          </p>
        </div>
      </div>

      {/* Carte 3 : Niveaux & Taux de Cashback */}
      <div className="snap-center shrink-0 w-[85vw] sm:w-auto card p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between">
          <div className="marker-box border border-forest-100 bg-forest-50 text-forest-700">
            <Award className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-semibold bg-forest-50 text-forest-700 border border-forest-100">
            Rang : {tier}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground-muted">Bronze, Silver & Gold</p>
          <p className="font-display text-xl font-semibold text-foreground">
            Privilèges & Confiance
          </p>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Plus vous voyagez avec Klef, plus votre taux de cashback augmente et plus votre profil gagne en priorité.
          </p>
        </div>
      </div>
    </div>
  );
}
