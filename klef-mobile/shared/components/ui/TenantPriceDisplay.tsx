import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { colors, radius, typography } from '../../theme/tokens';

import { useCurrencyStore } from '../../stores/currency.store';

export const TENANT_COMMISSION_MARKUP = 1.07;
export const LAST_MINUTE_DISCOUNT = 0.15;

export function getPrixPublic(prixBase: number | string | null | undefined): number {
  if (prixBase === null || prixBase === undefined) return 0;
  const num = typeof prixBase === 'string' ? parseFloat(prixBase) : prixBase;
  if (Number.isNaN(num) || num <= 0) return 0;
  return Math.round(num * TENANT_COMMISSION_MARKUP);
}

export function getPrixDerniereMinute(prixPublic: number): number {
  return Math.round(prixPublic * (1 - LAST_MINUTE_DISCOUNT));
}

/**
 * Même règle que le serveur : la remise dernière minute ne vaut que pour une arrivée
 * dans les 48 h. Sans date d'arrivée connue, on ne l'applique pas au prix affiché.
 */
export function remiseApplicable(derniereMinuteActive?: boolean | null, arrivee?: string | Date | null): boolean {
  if (!derniereMinuteActive || !arrivee) return false;
  const t = new Date(arrivee).getTime();
  if (Number.isNaN(t)) return false;
  return t - Date.now() <= 48 * 3600 * 1000;
}

/** Prix par nuit affiché au voyageur (frais inclus), remise comprise seulement si elle s'applique. */
export function prixNuitAffiche(prixBase: number | string | null | undefined, derniereMinuteActive?: boolean | null, arrivee?: string | Date | null): number {
  const pub = getPrixPublic(prixBase);
  return remiseApplicable(derniereMinuteActive, arrivee) ? getPrixDerniereMinute(pub) : pub;
}

export const LAST_MINUTE_LABEL = '−15 % si arrivée sous 48 h';

export interface TenantPriceDisplayProps {
  prixBase: number | string | null | undefined;
  derniereMinuteActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  period?: string;
  isInverse?: boolean;
  reserveSpace?: boolean;
}

export function TenantPriceDisplay({
  prixBase,
  derniereMinuteActive = false,
  size = 'md',
  showBadge = true,
  period = '/ nuit',
  isInverse = false,
  reserveSpace = true,
}: TenantPriceDisplayProps) {
  const { currencyInfo, formatPrice } = useCurrencyStore();
  const prixPublic = getPrixPublic(prixBase);
  // Pas de date d'arrivée ici : la remise n'est jamais garantie, on l'annonce sans barrer le prix
  const hasLastMinute = !!derniereMinuteActive && prixPublic > 0;

  if (prixPublic <= 0) {
    return (
      <Text style={[styles.fallbackText, isInverse && styles.inverseFallback]}>
        —
      </Text>
    );
  }

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <View style={styles.container}>
      {hasLastMinute && showBadge ? (
        <View style={styles.discountRow}>
          <View style={styles.discountBadge}>
            <Zap size={10} color={colors.forest[950]} fill={colors.forest[950]} />
            <Text style={styles.discountBadgeText}>−15 % sous 48 h</Text>
          </View>
        </View>
      ) : reserveSpace ? (
        <View
          style={[
            styles.discountRowPlaceholder,
            isSmall && styles.discountRowPlaceholderSm,
            isLarge && styles.discountRowPlaceholderLg,
          ]}
        />
      ) : null}

      <View style={styles.priceRow}>
        <Text
          style={[
            styles.finalPrice,
            isSmall && styles.finalPriceSm,
            isLarge && styles.finalPriceLg,
            isInverse ? styles.inversePrice : styles.normalPrice,
          ]}
        >
          {formatPrice(prixPublic)}
        </Text>
        {period ? (
          <Text
            style={[
              styles.periodText,
              isSmall && styles.periodTextSm,
              isInverse && styles.inversePeriod,
            ]}
          >
            {period}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
  },
  fallbackText: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  inverseFallback: {
    color: colors.forest[200],
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    height: 18,
  },
  discountRowPlaceholder: {
    height: 18,
    marginBottom: 2,
  },
  discountRowPlaceholderSm: {
    height: 16,
    marginBottom: 2,
  },
  discountRowPlaceholderLg: {
    height: 22,
    marginBottom: 2,
  },
  originalPrice: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.neutral[500],
    textDecorationLine: 'line-through',
  },
  originalPriceSm: {
    fontSize: 11,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.lime[400],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  discountBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
    color: colors.forest[950],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  finalPrice: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    letterSpacing: -0.4,
  },
  finalPriceSm: {
    fontSize: 15,
    letterSpacing: -0.3,
  },
  finalPriceLg: {
    fontSize: 24,
    letterSpacing: -0.6,
  },
  normalPrice: {
    color: colors.forest[950],
  },
  discountedPrice: {
    color: colors.forest[950],
  },
  inversePrice: {
    color: colors.neutral[0],
  },
  inverseDiscountedPrice: {
    color: colors.lime[300],
  },
  currencyText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    letterSpacing: -0.1,
  },
  currencyTextSm: {
    fontSize: 10,
  },
  currencyTextLg: {
    fontSize: 13,
  },
  normalCurrency: {
    color: colors.forest[800],
  },
  inverseCurrency: {
    color: colors.lime[300],
  },
  periodText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginLeft: 1,
  },
  periodTextSm: {
    fontSize: 10,
  },
  inversePeriod: {
    color: colors.forest[200],
  },
});