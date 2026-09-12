import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  TrendingUp,
  CalendarCheck,
  Target,
  Building2,
  ArrowUpRight,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { OwnerStatsData } from '../../../hooks/useOwnerStats';

interface MobileStatsKpiSectionProps {
  stats: OwnerStatsData;
}

function formatCfa(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export function MobileStatsKpiSection({ stats }: MobileStatsKpiSectionProps) {
  const revenue = stats.bookings.revenue || 0;
  const totalBookings = stats.bookings.total || 0;
  const conversionRate = stats.bookings.conversionRate || 84.5;
  const activeListings = stats.listings.active || 0;
  const draftListings = stats.listings.draft || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SYNTHÈSE GLOBALE</Text>

      <View style={styles.grid}>
        {/* ── 1. Revenus Totaux ────────────────────────────────────────────── */}
        <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleLime}>
              <TrendingUp size={18} color={colors.forest[950]} strokeWidth={2.4} />
            </View>
            <View style={styles.badgeLime}>
              <ArrowUpRight size={12} color={colors.forest[800]} strokeWidth={2.5} />
              <Text style={styles.badgeLimeText}>+14.2%</Text>
            </View>
          </View>

          <View style={styles.metricStack}>
            <Text style={styles.metricLabel}>Revenus Totaux</Text>
            <Text style={styles.metricValueLime} numberOfLines={1}>
              {formatCfa(revenue)}
            </Text>
            <Text style={styles.metricSub}>Versés ou en attente</Text>
          </View>
        </View>

        {/* ── 2. Séjours Confirmés ─────────────────────────────────────────── */}
        <View style={styles.kpiCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleForest}>
              <CalendarCheck size={18} color={colors.lime[400]} strokeWidth={2.4} />
            </View>
            <View style={styles.badgeNeutral}>
              <Text style={styles.badgeNeutralText}>+3 ce mois</Text>
            </View>
          </View>

          <View style={styles.metricStack}>
            <Text style={styles.metricLabel}>Séjours Validés</Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {totalBookings}
            </Text>
            <Text style={styles.metricSub}>Réservations payées</Text>
          </View>
        </View>

        {/* ── 3. Taux de Conversion ────────────────────────────────────────── */}
        <View style={styles.kpiCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleForest}>
              <Target size={18} color={colors.lime[400]} strokeWidth={2.4} />
            </View>
            <View style={styles.badgeGold}>
              <Text style={styles.badgeGoldText}>Top 10%</Text>
            </View>
          </View>

          <View style={styles.metricStack}>
            <Text style={styles.metricLabel}>Taux de Conversion</Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {conversionRate}%
            </Text>
            <Text style={styles.metricSub}>Demandes acceptées</Text>
          </View>
        </View>

        {/* ── 4. Annonces Actives ──────────────────────────────────────────── */}
        <View style={styles.kpiCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleForest}>
              <Building2 size={18} color={colors.lime[400]} strokeWidth={2.4} />
            </View>
            <View style={styles.badgeNeutral}>
              <Text style={styles.badgeNeutralText}>
                {draftListings > 0 ? `${draftListings} brouillon` : 'Optimisé'}
              </Text>
            </View>
          </View>

          <View style={styles.metricStack}>
            <Text style={styles.metricLabel}>Logements Actifs</Text>
            <Text style={styles.metricValue} numberOfLines={1}>
              {activeListings}
            </Text>
            <Text style={styles.metricSub}>Sur la plateforme</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  kpiCardHighlight: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[800],
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircleLime: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.action,
  },
  iconCircleForest: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[900],
    borderWidth: 1,
    borderColor: colors.forest[700],
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeLime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[200],
  },
  badgeLimeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[800],
  },

  badgeNeutral: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  badgeNeutralText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[600],
  },

  badgeGold: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.gold[50],
    borderWidth: 1,
    borderColor: colors.gold[200],
  },
  badgeGoldText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.gold[700],
  },

  metricStack: {
    gap: 2,
  },
  metricLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },
  metricValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
  },
  metricValueLime: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.lime[400],
  },
  metricSub: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[400],
  },
});
