import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { ArrowRight, Info, PieChart, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

const STATUT_CONFIG: Record<
  string,
  { label: string; color: string; counts: 'honored' | 'failed' | 'pending' }
> = {
  COMPLETED: { label: 'Terminées', color: colors.forest[600], counts: 'honored' },
  CHECKED_IN: { label: 'En cours', color: colors.lime[600], counts: 'honored' },
  CONFIRMED: { label: 'Confirmées', color: colors.forest[400], counts: 'pending' },
  PAID: { label: 'Payées', color: colors.forest[300], counts: 'pending' },
  PENDING: { label: 'En attente', color: colors.warning[500], counts: 'pending' },
  CANCELLED: { label: 'Annulées', color: colors.neutral[400], counts: 'failed' },
  DISPUTED: { label: 'Litiges', color: colors.error[500], counts: 'failed' },
};

const MIN_FOR_RATE = 5;

interface ReservationStatsProps {
  bookings?: Array<{ statut?: string; status?: string }> | null;
}

function Gauge({ value, label }: { value: number; label: string }) {
  const size = 200;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = Math.PI * r;
  const center = size / 2;
  const arc = `M ${stroke / 2} ${center} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${center}`;

  const dashoffset = c - (value / 100) * c;
  const tone =
    value >= 85
      ? colors.forest[600]
      : value >= 60
      ? colors.warning[500]
      : colors.error[500];

  return (
    <View style={styles.gaugeWrapper}>
      <Svg width={size} height={size * 0.55} viewBox={`0 0 ${size} ${size * 0.58}`}>
        {/* Track de fond */}
        <Path
          d={arc}
          fill="none"
          stroke={colors.neutral[100]}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Track actif de progression */}
        <Path
          d={arc}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dashoffset}
        />
      </Svg>

      <View style={styles.gaugeTextOverlay}>
        <Text style={styles.gaugeValueText}>{value}%</Text>
        <View style={styles.gaugeBadge}>
          <ShieldCheck size={12} color={colors.forest[700]} strokeWidth={2.5} />
          <Text style={styles.gaugeLabelText}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

export function MobileStatsReservationBreakdownCard({ bookings }: ReservationStatsProps) {
  const router = useRouter();
  const list = bookings ?? [];
  const filtered = list.filter(
    (b) => String(b.statut || b.status || '').toUpperCase() !== 'EXPIRED'
  );

  const groups = filtered.reduce<Record<string, number>>((acc, b) => {
    const status = String(b.statut || b.status || '').toUpperCase();
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const known = Object.entries(groups).filter(([s]) => STATUT_CONFIG[s]);
  const total = known.reduce((s, [, n]) => s + n, 0);

  const handleSeeAllReservations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(owner)/reservations' as any);
  };

  const handleImproveListings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(owner)/listings' as any);
  };

  /* ── 1. État Vide (Aucune réservation) ────────────────────────────── */
  if (total === 0) {
    return (
      <View style={styles.cardShell}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconSquircle}>
              <PieChart size={18} color={colors.forest[700]} strokeWidth={2.2} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Vos réservations</Text>
              <Text style={styles.headerSubtitle}>Répartition par statut</Text>
            </View>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <PieChart size={24} color={colors.forest[600]} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Pas encore de réservation</Text>
          <Text style={styles.emptySubtitle}>
            Les statistiques de vos séjours apparaîtront dès votre première réservation enregistrée.
          </Text>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleImproveListings}
            style={styles.emptyActionBtn}
          >
            <Text style={styles.emptyActionBtnText}>Améliorer mes annonces</Text>
            <ArrowRight size={14} color={colors.forest[800]} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ── 2. Calcul du taux et tri ────────────────────────────────────────── */
  const entries = known
    .map(([statut, count]) => ({
      statut,
      count,
      pct: Math.round((count / total) * 100),
      ...STATUT_CONFIG[statut],
    }))
    .sort((a, b) => b.count - a.count);

  const honored = entries.filter((e) => e.counts === 'honored').reduce((s, e) => s + e.count, 0);
  const failed = entries.filter((e) => e.counts === 'failed').reduce((s, e) => s + e.count, 0);
  const settled = honored + failed;
  const rate = settled > 0 ? Math.round((honored / settled) * 100) : null;
  const enoughForRate = settled >= MIN_FOR_RATE && rate !== null;

  return (
    <View style={styles.cardShell}>
      {/* En-tête Premium */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconSquircle}>
            <PieChart size={18} color={colors.forest[700]} strokeWidth={2.2} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Vos réservations</Text>
            <Text style={styles.headerSubtitle}>Répartition par statut</Text>
          </View>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{total} au total</Text>
        </View>
      </View>

      {/* Jauge ou Notice d'information */}
      {enoughForRate ? (
        <View style={styles.gaugeBox}>
          <Gauge value={rate} label="Séjours honorés" />
        </View>
      ) : (
        <View style={styles.infoBox}>
          <View style={styles.infoIconCircle}>
            <Info size={16} color={colors.forest[700]} strokeWidth={2} />
          </View>
          <Text style={styles.infoText}>
            {settled === 0
              ? 'Aucun séjour terminé pour l’instant. Le taux d’honoration s’affichera après votre premier séjour.'
              : `Encore ${MIN_FOR_RATE - settled} séjour${
                  MIN_FOR_RATE - settled > 1 ? 's' : ''
                } validé${MIN_FOR_RATE - settled > 1 ? 's' : ''} avant d'afficher un taux significatif.`}
          </Text>
        </View>
      )}

      {/* Liste des statuts avec barres de progression */}
      <View style={styles.statusList}>
        {entries.map((e) => (
          <View key={e.statut} style={styles.statusItemContainer}>
            <View style={styles.statusItemHeader}>
              <View style={styles.statusLeft}>
                <View style={[styles.colorDot, { backgroundColor: e.color }]} />
                <Text style={styles.statusLabel}>{e.label}</Text>
              </View>

              <View style={styles.statusRight}>
                <Text style={styles.countText}>{e.count}</Text>
                {total >= MIN_FOR_RATE && (
                  <View style={styles.pctBadge}>
                    <Text style={styles.pctText}>{e.pct}%</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Barre de progression visuelle */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: e.color, width: `${Math.max(e.pct, 4)}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Bouton d'action */}
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={handleSeeAllReservations}
        style={styles.seeAllBtn}
      >
        <Text style={styles.seeAllBtnText}>Voir toutes mes réservations</Text>
        <ArrowRight size={15} color={colors.forest[800]} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    backgroundColor: '#FFFFFF', // Fond blanc pur exigé
    borderRadius: radius.card,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconSquircle: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  headerTextGroup: {
    gap: 2,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16.5,
    color: colors.forest[950],
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
  },
  totalBadgeText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.forest[900],
  },

  // Gauge
  gaugeBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeTextOverlay: {
    position: 'absolute',
    bottom: 6,
    alignItems: 'center',
    gap: 4,
  },
  gaugeValueText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 30,
    color: colors.forest[950],
    letterSpacing: -0.5,
  },
  gaugeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
  },
  gaugeLabelText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[800],
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.forest[50] + '60',
    padding: 14,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  infoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[950],
    flex: 1,
    lineHeight: 18,
  },

  // Status List
  statusList: {
    gap: 14,
  },
  statusItemContainer: {
    gap: 6,
  },
  statusItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  colorDot: {
    width: 9,
    height: 9,
    borderRadius: radius.pill,
  },
  statusLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  pctBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  pctText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },
  progressBarTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.pill,
  },

  // Actions
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  seeAllBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[900],
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  emptyTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  emptySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[600],
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  emptyActionBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[900],
  },
});
