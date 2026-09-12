import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Coins, Moon, ShieldCheck, Sparkles, Lock, ArrowUpRight } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { OwnerStatsData } from '../../../hooks/useOwnerStats';

interface MobileStatsAdvancedMetricsCardProps {
  stats: OwnerStatsData;
}

function formatCfa(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export function MobileStatsAdvancedMetricsCard({ stats }: MobileStatsAdvancedMetricsCardProps) {
  const adr = stats.bookings.averageDailyRate || 0;
  const totalNights = stats.bookings.totalNights || 0;
  const cancellationRate = stats.bookings.cancellationRate || 0;
  const pendingAmount = stats.wallet.pending || 0;

  const getCancelHealth = (rate: number) => {
    if (rate <= 3) {
      return { label: 'Santé Excellente', color: colors.forest[700], bg: colors.forest[50], border: colors.forest[100] };
    }
    if (rate <= 10) {
      return { label: 'Santé Normale', color: colors.warning[700], bg: colors.warning[50], border: colors.warning[200] };
    }
    return { label: 'Attention requise', color: colors.error[700], bg: colors.error[50], border: colors.error[200] };
  };

  const health = getCancelHealth(cancellationRate);

  return (
    <View style={styles.cardShell}>
      {/* ── 1. En-tête Premium ────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerSquircle}>
            <Sparkles size={18} color={colors.forest[800]} strokeWidth={2.2} />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Rentabilité & Indicateurs</Text>
            <Text style={styles.headerSubtitle}>Métriques clés d'exploitation</Text>
          </View>
        </View>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>SÉCURISÉ</Text>
        </View>
      </View>

      {/* ── 2. Carte Principale : Prix Moyen par Nuitée (ADR) ─────────────── */}
      <View style={styles.heroAdrCard}>
        <View style={styles.adrTopRow}>
          <View style={styles.adrTagGroup}>
            <View style={styles.adrIconCircle}>
              <Coins size={16} color={colors.forest[950]} strokeWidth={2.5} />
            </View>
            <Text style={styles.adrTagText} numberOfLines={1}>PRIX MOYEN / NUIT (ADR)</Text>
          </View>

          <View style={styles.adrTrendPill}>
            <ArrowUpRight size={12} color={colors.forest[900]} strokeWidth={2.5} />
            <Text style={styles.adrTrendText}>Calcul exact</Text>
          </View>
        </View>

        <View style={styles.adrValueStack}>
          <View style={styles.adrValueRow}>
            <Text style={styles.adrValueText}>
              {adr > 0 ? formatCfa(adr) : 'Non défini'}
            </Text>
            {adr > 0 && <Text style={styles.adrUnitText}>/ nuit</Text>}
          </View>
          <Text style={styles.adrSubtext}>
            {adr > 0
              ? 'Revenu moyen généré par nuitée effectivement louée'
              : 'Apparaîtra dès que vos premières nuits seront réservées'}
          </Text>
        </View>

        <View style={styles.adrProgressTrack}>
          <View style={[styles.adrProgressFill, { width: adr > 0 ? '75%' : '15%' }]} />
        </View>
      </View>

      {/* ── 3. Grille 2 Métriques Secondaires ──────────────────────────────── */}
      <View style={styles.subGrid}>
        {/* Nuits Occupées */}
        <View style={styles.subMetricCard}>
          <View style={styles.subHeader}>
            <View style={styles.subIconSquircle}>
              <Moon size={15} color={colors.forest[700]} strokeWidth={2.2} />
            </View>
            <Text style={styles.subTitle}>VOLUME NUITS</Text>
          </View>
          <Text style={styles.subValue}>
            {totalNights} nuit{totalNights > 1 ? 's' : ''}
          </Text>
          <Text style={styles.subFootnote}>Total nuits réservées</Text>
        </View>

        {/* Taux d'Annulation */}
        <View style={styles.subMetricCard}>
          <View style={styles.subHeader}>
            <View style={styles.subIconSquircle}>
              <ShieldCheck size={15} color={colors.forest[700]} strokeWidth={2.2} />
            </View>
            <View style={[styles.healthPill, { backgroundColor: health.bg, borderColor: health.border }]}>
              <Text style={[styles.healthText, { color: health.color }]}>{health.label}</Text>
            </View>
          </View>
          <Text style={styles.subValue}>{cancellationRate}%</Text>
          <Text style={styles.subFootnote}>Taux d'annulation</Text>
        </View>
      </View>

      {/* ── 4. Séquestre de Garantie ───────────────────────────────────────── */}
      <View style={styles.escrowBanner}>
        <View style={styles.escrowLeft}>
          <View style={styles.escrowIconCircle}>
            <Lock size={14} color={colors.forest[800]} strokeWidth={2.2} />
          </View>
          <View style={styles.escrowTextStack}>
            <Text style={styles.escrowTitle}>Fonds en séquestre garantis</Text>
            <Text style={styles.escrowSubtitle}>Montant libéré au Check-in</Text>
          </View>
        </View>
        <Text style={styles.escrowAmount}>{formatCfa(pendingAmount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerSquircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  headerTitles: {
    gap: 2,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
  },
  heroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  heroBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[800],
    letterSpacing: 0.5,
  },

  // Hero Card ADR
  heroAdrCard: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.inner,
    padding: 16,
    gap: 14,
    ...shadows.xs,
  },
  adrTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  adrTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  adrIconCircle: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  adrTagText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[300],
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  adrTrendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    flexShrink: 0,
  },
  adrTrendText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[950],
  },

  adrValueStack: {
    gap: 4,
  },
  adrValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  adrValueText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 24,
    color: colors.lime[400],
    letterSpacing: -0.4,
  },
  adrUnitText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.neutral[300],
  },
  adrSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[400],
    lineHeight: 16,
  },
  adrProgressTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  adrProgressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
  },

  // Sub Grid
  subGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  subMetricCard: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subIconSquircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  subTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[500],
    letterSpacing: 0.5,
  },
  subValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
    letterSpacing: -0.2,
  },
  subFootnote: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[600],
  },
  healthPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  healthText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
  },

  // Escrow Banner
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.forest[50],
    padding: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  escrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  escrowIconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  escrowTextStack: {
    gap: 1,
  },
  escrowTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  escrowSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[600],
  },
  escrowAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
});
