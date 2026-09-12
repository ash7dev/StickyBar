import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarDays, Building2, TrendingUp, Star, ArrowUpRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { OwnerStatsData, OwnerPendingActionsData } from '../../hooks/useOwnerDashboard';

interface Props {
  stats: OwnerStatsData;
  pending: OwnerPendingActionsData;
}

const compactFormat = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const noteFormat = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function MobileKpiGridCard({ stats, pending }: Props) {
  const router = useRouter();

  const handleKpiPress = (href: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(href as any);
  };

  const pendingConfirmations = pending.pendingConfirmations ?? 0;

  const kpis = [
    {
      id: 'bookings',
      href: '/(owner)/reservations',
      title: 'RÉSERVATIONS',
      value: String(stats.bookings.total ?? 0),
      unit: stats.bookings.total > 1 ? 'séjours' : 'séjour',
      icon: CalendarDays,
      alert: pendingConfirmations > 0 ? `${pendingConfirmations} à confirmer` : null,
      subtext: pendingConfirmations > 0 ? null : 'Aucune action',
    },
    {
      id: 'listings',
      href: '/(owner)/listings',
      title: 'MES BIENS',
      value: String(stats.listings.active ?? 0),
      unit: stats.listings.active > 1 ? 'publiés' : 'publié',
      icon: Building2,
      alert: null,
      subtext: 'En ligne sur Klef',
    },
    {
      id: 'revenue',
      href: '/(owner)/wallet',
      title: 'REVENUS NETS',
      value: compactFormat.format(stats.bookings.revenue ?? 0),
      unit: 'FCFA',
      icon: TrendingUp,
      alert: null,
      subtext: 'Cumul du mois',
    },
    {
      id: 'rating',
      href: '/(owner)/stats',
      title: 'ÉVALUATION',
      value: (stats.bookings.averageRating && stats.bookings.averageRating > 0)
        ? noteFormat.format(stats.bookings.averageRating)
        : '5.0',
      unit: '/ 5',
      icon: Star,
      alert: null,
      subtext: (stats.bookings.averageRating && stats.bookings.averageRating > 0)
        ? 'Avis voyageurs'
        : 'Note excellente',
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>SYNTHÈSE D’ACTIVITÉ</Text>

      <View style={styles.gridRow}>
        {kpis.map((kpi) => {
          const IconComp = kpi.icon;
          const hasAlert = !!kpi.alert;

          return (
            <TouchableOpacity
              key={kpi.id}
              activeOpacity={0.82}
              onPress={() => handleKpiPress(kpi.href)}
              style={[
                styles.kpiCard,
                hasAlert && styles.kpiCardAlert,
              ]}
            >
              {/* Header Icon + Arrow */}
              <View style={styles.kpiCardHeader}>
                <View
                  style={[
                    styles.iconBox,
                    hasAlert ? styles.iconBoxAlert : styles.iconBoxNormal,
                  ]}
                >
                  <IconComp
                    size={18}
                    color={hasAlert ? colors.warning[600] : colors.lime[400]}
                    strokeWidth={2.2}
                  />
                </View>

                <ArrowUpRight size={16} color={colors.neutral[400]} />
              </View>

              {/* Title & Value */}
              <View style={styles.kpiContent}>
                <Text style={styles.kpiTitle} numberOfLines={1}>
                  {kpi.title}
                </Text>

                <View style={styles.valueRow}>
                  <Text style={styles.kpiValue} numberOfLines={1}>
                    {kpi.value}
                  </Text>
                  {kpi.unit ? <Text style={styles.kpiUnit}>{kpi.unit}</Text> : null}
                </View>
              </View>

              {/* Footer Subtext or Alert Pill */}
              <View style={styles.kpiFooter}>
                {hasAlert ? (
                  <View style={styles.alertPill}>
                    <View style={styles.alertDot} />
                    <Text style={styles.alertPillText} numberOfLines={1}>
                      {kpi.alert}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.subtext} numberOfLines={1}>
                    {kpi.subtext}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },

  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  kpiCardAlert: {
    borderColor: colors.warning[500],
    backgroundColor: colors.neutral[0],
  },

  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxNormal: {
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.forest[800],
  },
  iconBoxAlert: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[500],
  },

  kpiContent: {
    gap: 4,
  },
  kpiTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 0.6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  kpiValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 22,
    color: colors.forest[950],
  },
  kpiUnit: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  kpiFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 8,
  },
  subtext: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning[50],
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  alertDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.warning[500],
  },
  alertPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.warning[700],
  },
});
