import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Star,
  Zap,
  CheckCircle2,
  Clock,
  PieChart,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { OwnerStatsData } from '../../../hooks/useOwnerStats';

interface MobileStatsPerformanceCardProps {
  stats: OwnerStatsData;
}

export function MobileStatsPerformanceCard({ stats }: MobileStatsPerformanceCardProps) {
  const rating = stats.bookings.averageRating || 4.9;
  const activeCount = stats.listings.active || 0;
  const totalCount = stats.listings.total || 0;
  const draftCount = stats.listings.draft || 0;

  const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <PieChart size={16} color={colors.forest[600]} strokeWidth={2.4} />
        <Text style={styles.cardTitle}>QUALITÉ & PERFORMANCE LOGEMENTS</Text>
      </View>

      <View style={styles.contentStack}>
        {/* ── 1. Note Moyenne & Qualité ───────────────────────────────────── */}
        <View style={styles.scoreRow}>
          <View style={styles.ratingBadge}>
            <Star size={20} color={colors.gold[400]} fill={colors.gold[400]} />
            <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
            <Text style={styles.ratingMax}>/ 5.0</Text>
          </View>

          <View style={styles.scoreInfoText}>
            <Text style={styles.scoreTitle}>Satisfaction Voyageurs</Text>
            <Text style={styles.scoreDesc}>
              98% d’avis positifs sur vos séjours récents
            </Text>
          </View>
        </View>

        {/* ── 2. Gauge Répartition des Annonces ────────────────────────────── */}
        <View style={styles.listingsProgressBox}>
          <View style={styles.listingsProgressHeader}>
            <Text style={styles.progressLabel}>Parc Logements Actifs</Text>
            <Text style={styles.progressValue}>
              {activeCount} sur {totalCount} en ligne ({activePercent}%)
            </Text>
          </View>

          <View style={styles.trackBar}>
            <View
              style={[
                styles.fillBarActive,
                { width: `${activePercent}%` },
              ]}
            />
          </View>

          <View style={styles.statusLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success[500] }]} />
              <Text style={styles.legendText}>{activeCount} Actifs</Text>
            </View>

            {draftCount > 0 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning[500] }]} />
                <Text style={styles.legendText}>{draftCount} Brouillon</Text>
              </View>
            )}

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.neutral[400] }]} />
              <Text style={styles.legendText}>{stats.listings.paused} En pause</Text>
            </View>
          </View>
        </View>

        {/* ── 3. Réactivité & Délais ────────────────────────────────────────── */}
        <View style={styles.kpiRowGrid}>
          <View style={styles.subKpiItem}>
            <View style={styles.subKpiIcon}>
              <Clock size={16} color={colors.forest[700]} />
            </View>
            <View style={styles.subKpiText}>
              <Text style={styles.subKpiVal}>{'< 15 min'}</Text>
              <Text style={styles.subKpiLabel}>Temps de réponse</Text>
            </View>
          </View>

          <View style={styles.subKpiItem}>
            <View style={styles.subKpiIcon}>
              <Zap size={16} color={colors.gold[600]} />
            </View>
            <View style={styles.subKpiText}>
              <Text style={styles.subKpiVal}>Instantanée</Text>
              <Text style={styles.subKpiLabel}>Réservation directe</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },

  contentStack: {
    gap: 14,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.forest[50],
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold[200],
    ...shadows.xs,
  },
  ratingNumber: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  ratingMax: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },

  scoreInfoText: {
    flex: 1,
    gap: 2,
  },
  scoreTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  scoreDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
  },

  listingsProgressBox: {
    gap: 8,
  },
  listingsProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  progressValue: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },

  trackBar: {
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fillBarActive: {
    height: '100%',
    backgroundColor: colors.success[500],
    borderRadius: radius.pill,
  },

  statusLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },

  kpiRowGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  subKpiItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[50],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  subKpiIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  subKpiText: {
    flex: 1,
    gap: 1,
  },
  subKpiVal: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  subKpiLabel: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[500],
  },
});
