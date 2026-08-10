'use client';

import { Coins, Tag, Award } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TerangaAccountData } from '@/lib/nestjs';
import { useAutoScrollCarousel } from '../hooks/use-auto-scroll-carousel';

interface Props {
  data: TerangaAccountData | null;
  isAuthenticated: boolean;
}

const TIER_LABELS: Record<string, string> = {
  BRONZE: 'Clé de Bronze',
  SILVER: 'Clé d’Argent',
  GOLD: 'Clé d’Or',
};

/* `{cashbackPct}%` affichait « 1.5% » : point décimal anglais et pas d'espace
   avant le signe, contrairement à la typographie française. */
const pct = (n: number) => `${n.toFixed(1).replace('.', ',').replace(',0', '')} %`;

export function TerangaPerksGrid({ data, isAuthenticated }: Props) {
  const cashbackPct = Number(data?.cashbackPct) || 1.5;
  const tier = data?.tier ?? 'BRONZE';

  const { containerRef, bindAutoScroll } = useAutoScrollCarousel<HTMLDivElement>({
    intervalMs: 4500,
    itemCount: 3,
  });

  /* `isAuthenticated` n'était jamais utilisé : un visiteur non connecté
     voyait « Rang : BRONZE » et « 1,5 % » comme s'il s'agissait de son
     statut, alors que ce sont des valeurs par défaut. */
  const perks = [
    {
      key: 'cashback',
      icon: Coins,
      badge: isAuthenticated ? 'Votre taux' : 'Dès l’inscription',
      eyebrow: 'Sur chaque séjour',
      value: (
        <>
          {pct(cashbackPct)}{' '}
          <span className="text-sm font-semibold text-foreground-muted">en Klef Coins</span>
        </>
      ),
      description: isAuthenticated
        ? 'Chaque séjour validé crédite automatiquement vos Klef Coins.'
        : 'Chaque séjour validé crédite des Klef Coins, dès votre premier voyage.',
      highlight: true,
    },
    {
      key: 'reduction',
      icon: Tag,
      badge: '1 coin = 1 FCFA',
      eyebrow: 'À la réservation',
      value: 'Réduction immédiate',
      /* « lors du paiement de votre acompte » : à vérifier côté backend.
         Si les coins réduisent l'acompte, c'est le montant placé en séquestre
         qui diminue — donc la protection du locataire. La réduction devrait
         porter sur le total du séjour. */
      description: 'Utilisez vos coins accumulés pour réduire le montant de votre séjour.',
      highlight: false,
    },
    {
      key: 'tiers',
      icon: Award,
      badge: isAuthenticated ? TIER_LABELS[tier] ?? tier : 'Trois niveaux',
      eyebrow: 'Bronze, Argent, Or',
      value: 'Statut et privilèges',
      description:
        'Plus vous réservez, plus votre taux de cashback augmente et plus vos demandes sont prioritaires.',
      highlight: false,
    },
  ];

  return (
    <div
      ref={containerRef}
      {...bindAutoScroll}
      /* `role="list"` explicite : le défilement horizontal avec
         `snap-mandatory` masquait la nature de liste aux lecteurs d'écran. */
      role="list"
      aria-label="Avantages du Teranga Club"
      className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0"
    >
      {perks.map(({ key, icon: Icon, badge, eyebrow, value, description, highlight }) => (
        <div
          key={key}
          role="listitem"
          className={cn(
            'card flex w-[85vw] shrink-0 snap-center flex-col justify-between gap-4 p-5 sm:w-auto sm:p-6',
            /* Les trois cartes étaient rigoureusement identiques : même
               pastille, même badge, même vert. Le cashback est l'argument
               principal, il se distingue. */
            highlight && 'border-gold-200 bg-gold-50/40',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border',
              highlight
                ? 'border-gold-200 bg-gold-400 text-forest-900'
                : 'border-forest-100 bg-forest-50 text-forest-700',
            )}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>

            <span className={cn(
              'inline-flex shrink-0 items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold',
              highlight
                ? 'border-gold-200 bg-background-card text-gold-700'
                : 'border-border bg-background-alt text-foreground-muted',
            )}>
              {badge}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {eyebrow}
            </p>
            <p className={cn(
              'font-display font-semibold tabular-nums',
              highlight ? 'text-2xl text-gold-700' : 'text-xl text-foreground',
            )}>
              {value}
            </p>
            <p className="text-xs leading-relaxed text-foreground-muted">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}