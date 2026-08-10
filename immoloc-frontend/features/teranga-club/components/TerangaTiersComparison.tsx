'use client';

import { Award, Check, Sparkles } from 'lucide-react';
import type { TerangaAccountData } from '@/lib/nestjs';
import { useAutoScrollCarousel } from '../hooks/use-auto-scroll-carousel';

interface Props {
  data: TerangaAccountData | null;
}

const TIERS = [
  {
    code: 'BRONZE',
    name: 'Clé de Bronze',
    icon: '🗝️',
    cashback: '1.5%',
    condition: 'Dès votre inscription',
    color: 'border-sand-400 bg-sand-50/40 text-sand-800',
    perks: [
      'Cashback de 1.5% sur tous vos séjours',
      'Cumul de Klef Coins sans date d’expiration',
      'Accès aux quêtes & badges de démarrage',
    ],
  },
  {
    code: 'SILVER',
    name: 'Clé d’Argent',
    icon: '🔑',
    cashback: '2.0%',
    condition: '3 séjours ou 300 000 FCFA dépensés',
    color: 'border-neutral-300 bg-neutral-50/60 text-neutral-800',
    perks: [
      'Cashback de 2.0% sur tous vos séjours (+33% de bonus)',
      'Traitement prioritaire de vos réservations',
      'Accès aux quêtes exclusives Silver',
    ],
  },
  {
    code: 'GOLD',
    name: 'Clé d’Or Teranga',
    icon: '👑',
    cashback: '3.0%',
    condition: '8 séjours ou 1 000 000 FCFA dépensés',
    color: 'border-gold-300 bg-gold-50/50 text-gold-900',
    perks: [
      'Cashback maximal de 3.0% (double du niveau Bronze)',
      'Priorité absolue de réservation auprès des hôtes',
      'Badge de profil "Certifié Teranga Gold"',
    ],
  },
];

export function TerangaTiersComparison({ data }: Props) {
  const currentTier = data?.tier ?? 'BRONZE';

  const { containerRef, bindAutoScroll } = useAutoScrollCarousel<HTMLDivElement>({
    intervalMs: 5000,
    itemCount: 3,
  });

  return (
    <section className="card p-5 sm:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="marker-box border border-forest-100 bg-forest-50 text-forest-700">
            <Award className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Les Grades & Privilèges du Teranga Club
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Évoluez au fil de vos séjours pour augmenter votre cashback.
            </p>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        {...bindAutoScroll}
        className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar scroll-smooth"
      >
        {TIERS.map((tier) => {
          const isCurrent = currentTier === tier.code;
          return (
            <div
              key={tier.code}
              className={`snap-center shrink-0 w-[85vw] sm:w-auto rounded-card border p-5 sm:p-6 flex flex-col justify-between space-y-5 transition-all relative ${
                isCurrent
                  ? 'border-forest-500 bg-forest-50/40 shadow-sm ring-1 ring-forest-500'
                  : 'border-border bg-background-card hover:border-border-hover'
              }`}
            >
              {isCurrent && (
                <div className="flex justify-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-pill bg-forest-700 text-white text-[11px] font-bold shadow-xs border border-forest-600">
                    <Sparkles className="w-3 h-3 text-lime-300" />
                    <span>Votre Niveau Actuel</span>
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{tier.icon}</span>
                  <span className="font-display text-2xl font-bold text-forest-700 tabular-nums">
                    {tier.cashback} <span className="text-xs font-semibold text-foreground-muted">Cashback</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{tier.name}</h3>
                  <p className="text-xs font-medium text-foreground-muted mt-0.5">{tier.condition}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                {tier.perks.map((perk, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-foreground leading-snug">
                    <Check className="w-3.5 h-3.5 text-forest-600 shrink-0 mt-0.5" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
