import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Coins, Sparkles, Award, Key, Crown, TrendingUp } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

interface MobileTerangaHeaderProps {
  soldeCoins: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  cashbackPct?: number;
  totalEconomise?: number;
}

const TIER_LABELS: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  BRONZE: {
    label: 'Clé de Bronze',
    icon: Key,
    color: '#92400E',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
  SILVER: {
    label: 'Clé d’Argent',
    icon: Award,
    color: '#374151',
    bg: '#F3F4F6',
    border: '#E5E7EB',
  },
  GOLD: {
    label: 'Clé d’Or',
    icon: Crown,
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#FCD34D',
  },
};

function formatFcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export function MobileTerangaHeader({
  soldeCoins,
  tier,
  cashbackPct = 1.5,
  totalEconomise = 0,
}: MobileTerangaHeaderProps) {
  const tierInfo = TIER_LABELS[tier] || TIER_LABELS.BRONZE;
  const TierIcon = tierInfo.icon;

  return (
    <View style={styles.card}>
      {/* Badge équivalence 1 coin = 1 FCFA */}
      <View style={styles.topRow}>
        <View style={styles.rateBadge}>
          <Coins size={13} color={colors.forest[700]} />
          <Text style={styles.rateText}>1 Coin = 1 FCFA</Text>
        </View>

        <View style={[styles.tierBadge, { backgroundColor: tierInfo.bg, borderColor: tierInfo.border }]}>
          <TierIcon size={13} color={tierInfo.color} />
          <Text style={[styles.tierText, { color: tierInfo.color }]}>{tierInfo.label}</Text>
        </View>
      </View>

      {/* Solde des coins en grand */}
      <View style={styles.soldeBlock}>
        <Text style={styles.soldeLabel}>VOS TERANGA COINS DISPONIBLES</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amountText}>{soldeCoins.toLocaleString('fr-FR')}</Text>
          <Text style={styles.unitText}>coins</Text>
        </View>
        <Text style={styles.subtext}>
          Équivaut à <Text style={styles.boldText}>{formatFcfa(soldeCoins)} FCFA</Text> de réduction immédiate lors de vos prochaines réservations.
        </Text>
      </View>

      {/* Stats rapides (Cashback & Économies cumulées) */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Sparkles size={14} color="#B45309" />
          </View>
          <View>
            <Text style={styles.statLabel}>CASHBACK ACTIF</Text>
            <Text style={styles.statValue}>{cashbackPct}% sur vos séjours</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <TrendingUp size={14} color={colors.forest[700]} />
          </View>
          <View>
            <Text style={styles.statLabel}>ÉCONOMIES TOTALES</Text>
            <Text style={styles.statValue}>{formatFcfa(totalEconomise > 0 ? totalEconomise : soldeCoins)} FCFA</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[200],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  rateText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 10.5,
    color: colors.forest[900],
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tierText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },

  // Solde
  soldeBlock: {
    gap: 2,
  },
  soldeLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9.5,
    color: colors.forest[300],
    letterSpacing: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amountText: {
    fontFamily: typography.fontDisplay,
    fontSize: 34,
    color: colors.lime[300],
    letterSpacing: -1,
  },
  unitText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    color: colors.lime[400],
  },
  subtext: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[300],
    lineHeight: 17,
    marginTop: 2,
  },
  boldText: {
    fontFamily: typography.fontBodyBold,
    color: colors.neutral[0],
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 8.5,
    color: colors.forest[300],
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.neutral[0],
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 8,
  },
});
