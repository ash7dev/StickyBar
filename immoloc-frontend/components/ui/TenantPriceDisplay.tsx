'use client';

import React from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  getPrixPublic,
  getPrixDerniereMinute,
  formatPrixPublic,
  formatPrixDerniereMinute,
} from '@/lib/pricing';

export interface TenantPriceDisplayProps {
  /** Prix de base hôte (avant commission locataire +7%) */
  prixBase: number | string | null | undefined;
  /** Si l'offre -15% Dernière Minute est active */
  derniereMinuteActive?: boolean;
  /** Taille d'affichage : 'sm' (cartes mobiles), 'md' (cartes grille), 'lg' (en-tête & widget) */
  size?: 'sm' | 'md' | 'lg';
  /** Disposition du prix barré : 'stacked' (au-dessus) ou 'inline' (à côté) */
  layout?: 'stacked' | 'inline';
  /** Afficher le badge ⚡ -15% */
  showBadge?: boolean;
  /** Réserver la hauteur de la ligne de promo pour égaliser la hauteur des cartes (par défaut: true) */
  reserveSpace?: boolean;
  /** Libellé de période (par défaut: "/ nuit") */
  period?: string;
  /** Classes CSS supplémentaires */
  className?: string;
  /** Couleur personnalisée pour le texte du prix final */
  textColor?: string;
}

const fmtMoney = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function TenantPriceDisplay({
  prixBase,
  derniereMinuteActive = false,
  size = 'md',
  layout = 'stacked',
  showBadge = true,
  reserveSpace = true,
  period = '/ nuit',
  className,
  textColor,
}: TenantPriceDisplayProps) {
  const prixPublic = getPrixPublic(prixBase);
  const isDiscounted = derniereMinuteActive && prixPublic > 0;
  const prixFinal = isDiscounted ? getPrixDerniereMinute(prixPublic) : prixPublic;

  if (prixPublic <= 0) {
    return (
      <span className={cn('font-display font-semibold text-foreground-muted', className)}>
        —
      </span>
    );
  }

  // Styles selon la taille (typographie raffinée font-semibold)
  const sizeStyles = {
    sm: {
      original: 'text-[10px] font-medium text-foreground-muted line-through tabular-nums',
      final: 'font-display text-base font-semibold tabular-nums tracking-tight',
      period: 'text-[11px] font-normal text-foreground-muted ml-1',
      badge: 'px-1.5 py-0.5 text-[9px] font-bold',
      topSlotHeight: 'h-4',
    },
    md: {
      original: 'text-xs font-medium text-foreground-muted line-through tabular-nums',
      final: 'font-display text-xl sm:text-2xl font-semibold tabular-nums tracking-tight',
      period: 'text-xs sm:text-sm font-normal text-foreground-muted ml-1',
      badge: 'px-2 py-0.5 text-[10px] font-bold',
      topSlotHeight: 'h-5',
    },
    lg: {
      original: 'text-sm font-medium text-foreground-muted line-through tabular-nums',
      final: 'font-display text-3xl sm:text-[2.25rem] font-semibold tabular-nums tracking-tight',
      period: 'text-sm font-medium text-foreground-muted ml-1.5',
      badge: 'px-2.5 py-0.5 text-[11px] font-bold',
      topSlotHeight: 'h-6',
    },
  }[size];

  const defaultFinalColor = isDiscounted
    ? 'text-forest-950'
    : 'text-foreground';

  const activeFinalColor = textColor || defaultFinalColor;

  return (
    <div className={cn('flex flex-col min-w-0 justify-end', className)}>
      {isDiscounted ? (
        <div
          className={cn(
            'flex items-center gap-1.5 mb-0.5',
            sizeStyles.topSlotHeight,
            layout === 'inline' ? 'flex-row' : 'flex-row items-center',
          )}
        >
          <span className={sizeStyles.original}>
            {fmtMoney.format(prixPublic)} FCFA
          </span>
          {showBadge && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-pill bg-lime-400 text-forest-950 uppercase tracking-wider shadow-2xs',
                sizeStyles.badge,
              )}
            >
              <Zap className="h-3 w-3 fill-forest-950 text-forest-950 shrink-0" />
              -15%
            </span>
          )}
        </div>
      ) : reserveSpace && layout === 'stacked' ? (
        <div className={cn('mb-0.5 opacity-0 pointer-events-none aria-hidden', sizeStyles.topSlotHeight)} />
      ) : null}

      <div className="flex items-baseline min-w-0">
        <span className={cn(sizeStyles.final, activeFinalColor)}>
          {fmtMoney.format(prixFinal)}
        </span>
        {period && (
          <span className={sizeStyles.period}>
            FCFA&nbsp;{period}
          </span>
        )}
      </div>
    </div>
  );
}

export default TenantPriceDisplay;
