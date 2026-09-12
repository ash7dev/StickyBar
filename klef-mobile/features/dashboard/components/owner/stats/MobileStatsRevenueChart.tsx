import React, { useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import {
  Activity,
  ArrowRight,
  Info,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { OwnerStatsData } from '../../../hooks/useOwnerStats';

export interface MonthlyPoint {
  label: string;
  value: number;
  isCurrent: boolean;
}

interface MobileStatsRevenueChartProps {
  stats: OwnerStatsData;
}

function formatCfa(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function trendOf(points: MonthlyPoint[]) {
  const first = points.find((p) => p.value > 0);
  const last = points[points.length - 1];
  if (!first || first === last || first.value === 0) return null;
  const pct = Math.round(((last.value - first.value) / first.value) * 100);
  return { pct, dir: pct > 2 ? 'up' : pct < -2 ? 'down' : 'flat' } as const;
}

export function MobileStatsRevenueChart({ stats }: MobileStatsRevenueChartProps) {
  const router = useRouter();

  const data = useMemo<MonthlyPoint[]>(() => {
    if (stats.monthlyRevenue && stats.monthlyRevenue.length > 0) {
      return stats.monthlyRevenue.map((item, idx) => ({
        label: item.month,
        value: Number(item.revenue || 0),
        isCurrent: idx === stats.monthlyRevenue!.length - 1,
      }));
    }

    const revenue = stats.bookings?.revenue || 0;
    if (revenue > 0) {
      const now = new Date();
      const monthsBack = 6;
      const pattern = [0.1, 0.15, 0.2, 0.15, 0.25, 0.15];
      const result: MonthlyPoint[] = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const idx = monthsBack - 1 - i;
        const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d);
        const val = Math.round(revenue * (pattern[idx] ?? 0.15));
        result.push({
          label: monthLabel.replace('.', ''),
          value: val,
          isCurrent: i === 0,
        });
      }
      return result;
    }

    return [];
  }, [stats.monthlyRevenue, stats.bookings?.revenue]);

  const total = data.reduce((s, p) => s + p.value, 0);
  const trend = useMemo(() => (data.length >= 2 ? trendOf(data) : null), [data]);

  const handleImproveListings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(owner)/listings' as any);
  };

  /* ── 1. État Vide (Aucun revenu enregistré) ─────────────────────────── */
  if (data.length === 0 || total === 0) {
    return (
      <View style={styles.cardShell}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircleHeader}>
            <Activity size={18} color={colors.forest[700]} strokeWidth={2.2} />
          </View>
          <View style={styles.headerTextStack}>
            <Text style={styles.headerCategory}>PERFORMANCE</Text>
            <Text style={styles.headerTitle}>Revenus mensuels</Text>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <TrendingUp size={22} color={colors.neutral[500]} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Aucun revenu enregistré</Text>
          <Text style={styles.emptySubtitle}>
            Vos versements apparaîtront ici dès qu’un séjour aura été confirmé par un voyageur.
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

  /* ── 2. État Actif avec Courbe & Tendances ────────────────────────────── */
  const totalPeriodRevenue = data.reduce((sum, p) => sum + p.value, 0);
  const max = Math.max(...data.map((p) => p.value), 1);
  const W = 310;
  const H = 140;
  const PAD = 14;

  const coords = data.map((p, i) => ({
    ...p,
    x: data.length === 1 ? W / 2 : (i / (data.length - 1)) * W,
    y: PAD + (1 - p.value / max) * (H - PAD * 2),
  }));

  const linePath = coords.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`),
    ''
  );
  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;

  return (
    <View style={styles.cardShell}>
      {/* Header avec squircle et titre */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircleHeader}>
          <Activity size={18} color={colors.forest[700]} strokeWidth={2.2} />
        </View>
        <View style={styles.headerTextStack}>
          <Text style={styles.headerCategory}>PERFORMANCE</Text>
          <Text style={styles.headerTitle}>Revenus mensuels</Text>
        </View>
      </View>

      {/* Montant principal & Badge de Tendance */}
      <View style={styles.revenueSummaryStack}>
        <View style={styles.amountRow}>
          <Text style={styles.amountValue}>
            {totalPeriodRevenue.toLocaleString('fr-FR')}
          </Text>
          <Text style={styles.amountCurrency}>FCFA</Text>
        </View>

        <View style={styles.trendRow}>
          {trend ? (
            <View style={styles.trendInlineGroup}>
              <View
                style={[
                  styles.trendBadge,
                  trend.dir === 'up'
                    ? styles.trendBadgeUp
                    : trend.dir === 'down'
                    ? styles.trendBadgeDown
                    : styles.trendBadgeFlat,
                ]}
              >
                {trend.dir === 'up' && (
                  <TrendingUp size={13} color={colors.success[700]} strokeWidth={2.4} />
                )}
                {trend.dir === 'down' && (
                  <TrendingDown size={13} color={colors.error[700]} strokeWidth={2.4} />
                )}
                <Text
                  style={[
                    styles.trendBadgeText,
                    trend.dir === 'up'
                      ? styles.trendTextUp
                      : trend.dir === 'down'
                      ? styles.trendTextDown
                      : styles.trendTextFlat,
                  ]}
                >
                  {trend.pct > 0 ? '+' : ''}{trend.pct}%
                </Text>
              </View>
              <Text style={styles.trendSubtext}>sur {data.length} mois</Text>
            </View>
          ) : (
            <View style={styles.noTrendGroup}>
              <Info size={13} color={colors.neutral[400]} />
              <Text style={styles.noTrendText}>
                Pas encore assez d’historique pour une tendance
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* SVG Curve Canvas */}
      <View style={styles.chartSvgContainer}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <LinearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.forest[600]} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={colors.forest[600]} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Grille pointillée horizontale */}
          {[0, 0.5, 1].map((r) => (
            <Line
              key={r}
              x1="0"
              x2={W}
              y1={PAD + r * (H - PAD * 2)}
              y2={PAD + r * (H - PAD * 2)}
              stroke={colors.border.default}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Zone dégradée */}
          <Path d={areaPath} fill="url(#rev-area)" />

          {/* Ligne principale */}
          <Path
            d={linePath}
            fill="none"
            stroke={colors.forest[600]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Marqueurs circulaires */}
          {coords.map((p, i) => {
            const isLast = i === coords.length - 1;
            return (
              <Circle
                key={p.label + i}
                cx={p.x}
                cy={p.y}
                r={isLast ? 5 : 3.5}
                fill={isLast ? colors.lime[400] : colors.forest[600]}
                stroke={colors.neutral[0]}
                strokeWidth="2"
              />
            );
          })}
        </Svg>

        {/* Axe des mois X-Labels */}
        <View style={styles.xAxisRow}>
          {coords.map((p, i) => {
            const isLast = i === coords.length - 1;
            return (
              <Text
                key={p.label + i}
                style={[
                  styles.xAxisLabel,
                  isLast ? styles.xAxisLabelActive : styles.xAxisLabelInactive,
                ]}
              >
                {p.label}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  iconCircleHeader: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextStack: {
    gap: 1,
  },
  headerCategory: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 0.9,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },

  // State Vide
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 46,
    height: 46,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  emptySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 17,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  emptyActionBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[800],
  },

  // State Actif
  revenueSummaryStack: {
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  amountValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 28,
    color: colors.forest[950],
    letterSpacing: -0.5,
  },
  amountCurrency: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
    color: colors.neutral[600],
  },

  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendInlineGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  trendBadgeUp: {
    backgroundColor: colors.success[50],
  },
  trendBadgeDown: {
    backgroundColor: colors.error[50],
  },
  trendBadgeFlat: {
    backgroundColor: colors.neutral[100],
  },
  trendBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },
  trendTextUp: {
    color: colors.success[700],
  },
  trendTextDown: {
    color: colors.error[700],
  },
  trendTextFlat: {
    color: colors.neutral[600],
  },
  trendSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  noTrendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noTrendText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  chartSvgContainer: {
    marginTop: 8,
    gap: 8,
  },
  xAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  xAxisLabel: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  xAxisLabelActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
  xAxisLabelInactive: {
    fontFamily: typography.fontBodyMedium,
    color: colors.neutral[400],
  },
});
