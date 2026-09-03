'use client';

import { Award, Check, Key, Crown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TerangaAccountData } from '@/lib/nestjs';
import { useAutoScrollCarousel } from '../hooks/use-auto-scroll-carousel';

interface Props {
  data: TerangaAccountData | null;
}

/* ⚠️ Troisième jeu de seuils du Teranga Club. `TerangaTierProgressCard`
   annonce 250 000 FCFA pour l'Argent, ce fichier et `TerangaRewardModal`
   annoncent 300 000. Tant que le barème vit dans trois fichiers, un écran
   mentira toujours. À faire descendre de l'API.

   La propriété `color` (`sand-400`, `neutral-300`…) n'était utilisée nulle
   part dans le JSX — et `sand` n'existe plus dans la palette depuis le
   passage aux neutres verts. */
const TIERS = [
  {
    code: 'BRONZE',
    name: 'Clé de Bronze',
    icon: Key,
    cashback: 1.5,
    condition: 'Dès votre inscription',
    perks: [
      'Cashback sur tous vos séjours',
      'Klef Coins sans date d’expiration',
      'Accès aux quêtes de démarrage',
    ],
  },
  {
    code: 'SILVER',
    name: 'Clé d’Argent',
    icon: Award,
    cashback: 2,
    condition: '7 séjours ou 500 000 FCFA',
    perks: [
      'Cashback augmenté sur tous vos séjours',
      'Traitement prioritaire de vos réservations',
      'Déblocage des quêtes Explorateur (+1 500 à +2 500 Coins)',
    ],
  },
  {
    code: 'GOLD',
    name: 'Clé d’Or',
    icon: Crown,
    cashback: 3,
    condition: '15 séjours ou 2 000 000 FCFA',
    perks: [
      'Cashback maximal VIP (3.0%)',
      'Priorité auprès des hôtes',
      'Déblocage des quêtes Légendaires (+5 000 à +10 000 Coins)',
    ],
  },
] as const;

const pct = (n: number) => `${n.toFixed(1).replace('.', ',').replace(',0', '')} %`;

export function TerangaTiersComparison({ data }: Props) {
  const currentTier = data?.tier ?? null;

  const { containerRef, bindAutoScroll } = useAutoScrollCarousel<HTMLDivElement>({
    intervalMs: 5000,
    itemCount: 3,
  });

  return (
    <section className="card space-y-6 p-5 sm:p-8">

      <header className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-gold-200 bg-gold-50 text-gold-700">
          <Award className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Paliers et privilèges
          </h2>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Votre taux de cashback augmente au fil de vos séjours.
          </p>
        </div>
      </header>

      <div
        ref={containerRef}
        {...bindAutoScroll}
        role="list"
        aria-label="Paliers du Teranga Club"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0"
      >
        {TIERS.map(({ code, name, icon: Icon, cashback, condition, perks }) => {
          /* `currentTier` valait `'BRONZE'` par défaut : un visiteur non
             connecté voyait « Votre niveau actuel » sur la carte Bronze. */
          const isCurrent = currentTier === code;

          return (
            <div
              key={code}
              role="listitem"
              aria-current={isCurrent ? 'true' : undefined}
              className={cn(
                'flex w-[85vw] shrink-0 snap-center flex-col justify-between gap-5 rounded-card border p-5 transition-[border-color] sm:w-auto sm:p-6',
                isCurrent
                  ? 'border-gold-300 bg-gold-50'
                  : 'border-border bg-background-card hover:border-border-hover',
              )}
            >
              {/* Le badge occupait la première ligne uniquement sur la carte
                 active : les trois cartes n'étaient donc plus alignées. */}
              <div className="flex h-6 items-center justify-center">
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-pill bg-gold-400 px-3 py-1 text-xs font-semibold text-forest-900">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Votre palier
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Les emojis 🗝️ et 🔑 se ressemblent au point d'être
                     confondus, et sont annoncés littéralement par les
                     lecteurs d'écran. */}
                  <span className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border',
                    isCurrent
                      ? 'border-gold-200 bg-gold-400 text-forest-900'
                      : 'border-border bg-background-alt text-foreground-muted',
                  )}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <p className="text-right">
                    <span className="font-display text-2xl font-semibold tabular-nums text-gold-700">
                      {pct(cashback)}
                    </span>
                    <span className="block text-xs text-foreground-muted">de cashback</span>
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{name}</h3>
                  <p className="mt-0.5 text-xs text-foreground-muted">{condition}</p>
                </div>
              </div>

              <ul className="space-y-2 border-t border-border pt-4">
                {perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-xs leading-snug text-foreground">
                    <Check
                      className={cn(
                        'mt-0.5 h-3.5 w-3.5 shrink-0',
                        isCurrent ? 'text-gold-600' : 'text-forest-600',
                      )}
                      aria-hidden="true"
                    />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}