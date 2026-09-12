import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { OwnerStatsData } from '../../hooks/useOwnerDashboard';

interface Props {
  stats: OwnerStatsData;
}

const formatFCFA = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export function MobileRevenueWalletCard({ stats }: Props) {
  const router = useRouter();
  const [showValues, setShowValues] = useState(true);

  const toggleVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowValues((prev) => !prev);
  };

  const handleWithdrawPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/(owner)/wallet' as any);
  };

  const revenueAmount = Number(stats.bookings.revenue ?? 0);
  const totalBookings = Number(stats.bookings.total ?? 0);
  const availableBalance = Number(stats.wallet.balance ?? 0);

  return (
    <View style={styles.card}>
      {/* ── Top Header Row ────────────────────────────────────────── */}
      <View style={styles.topRow}>
        <View style={styles.leftLabelGroup}>
          <View style={styles.iconCircle}>
            <TrendingUp size={16} color={colors.lime[400]} />
          </View>
          <Text style={styles.headerLabel}>REVENUS</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleVisibility}
          style={styles.eyeBtn}
          accessibilityLabel={showValues ? 'Masquer les montants' : 'Afficher les montants'}
        >
          {showValues ? (
            <Eye size={18} color={colors.neutral[300]} />
          ) : (
            <EyeOff size={18} color={colors.neutral[300]} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Main Revenue Amount ──────────────────────────────────── */}
      <View style={styles.mainRevenueBlock}>
        <View style={styles.amountRow}>
          <Text style={styles.mainAmountText}>
            {showValues ? formatFCFA.format(revenueAmount) : '••••••••'}
          </Text>
          <Text style={styles.unitText}>FCFA</Text>
        </View>

        <Text style={styles.subtext}>
          {totalBookings} réservation{totalBookings > 1 ? 's' : ''} au total
        </Text>
      </View>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <View style={styles.divider} />

      {/* ── Bottom Retirable Section ────────────────────────────── */}
      <View style={styles.bottomRow}>
        <View style={styles.soldeBlock}>
          <Text style={styles.soldeLabel}>SOLDE RETIRABLE</Text>
          <Text style={styles.soldeValue}>
            {showValues ? `${formatFCFA.format(availableBalance)} FCFA` : '•••••••• FCFA'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleWithdrawPress}
          style={styles.withdrawBtn}
        >
          <Text style={styles.withdrawBtnText}>Retirer</Text>
          <ArrowRight size={15} color={colors.forest[950]} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    ...shadows.float,
  },

  // Top Row
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(211, 242, 110, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[300],
    letterSpacing: 1.2,
  },
  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Main Revenue Block
  mainRevenueBlock: {
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  mainAmountText: {
    fontFamily: typography.fontDisplay,
    fontSize: 32,
    color: colors.neutral[0],
    letterSpacing: -0.5,
  },
  unitText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[300],
  },
  subtext: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[300],
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginVertical: 2,
  },

  // Bottom Section
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soldeBlock: {
    gap: 4,
  },
  soldeLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[300],
    letterSpacing: 1,
  },
  soldeValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 17,
    color: colors.neutral[0],
  },

  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  withdrawBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
});
