import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { TimeframeFilter } from '../../../hooks/useOwnerStats';

interface MobileStatsHeaderProps {
  timeframe: TimeframeFilter;
  onTimeframeChange: (tf: TimeframeFilter) => void;
  onRefresh: () => void;
  isRefetching: boolean;
}

const TIMEFRAMES: TimeframeFilter[] = ['Ce mois', '30 jours', '6 mois', 'Cette année'];

export function MobileStatsHeader({
  timeframe,
  onTimeframeChange,
  onRefresh,
  isRefetching,
}: MobileStatsHeaderProps) {
  const router = useRouter();

  const handleBackToHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/(owner)/dashboard' as any);
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onRefresh();
  };

  const handleSelectTf = (tf: TimeframeFilter) => {
    Haptics.selectionAsync().catch(() => {});
    onTimeframeChange(tf);
  };

  return (
    <View style={styles.container}>
      {/* ── 1. Bouton Retour vers Accueil Espace Hôte ──────────────────────── */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleBackToHome}
          style={styles.backBtn}
        >
          <ArrowLeft size={16} color={colors.forest[800]} strokeWidth={2.4} />
          <Text style={styles.backBtnText}>Accueil Hôte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.82}
          onPress={handleRefresh}
          disabled={isRefetching}
          style={styles.refreshBtn}
        >
          <RefreshCw
            size={14}
            color={colors.forest[800]}
            strokeWidth={2.2}
          />
          <Text style={styles.refreshBtnText}>
            {isRefetching ? 'Actualisation...' : 'Actualiser'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. Titre avec Badge Icône ─────────────────────────────────────── */}
      <View style={styles.titleRow}>
        <View style={styles.iconCircle}>
          <BarChart3 size={20} color={colors.lime[400]} strokeWidth={2.4} />
        </View>

        <View style={styles.titleTextStack}>
          <Text style={styles.title} numberOfLines={1}>
            Statistiques & Performance
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Analyse détaillée de vos revenus, séjours et conversion.
          </Text>
        </View>
      </View>

      {/* ── 3. Rail Filtre Période (Pills) ─────────────────────────────────── */}
      <View style={styles.timeframeRail}>
        {TIMEFRAMES.map((tf) => {
          const isActive = tf === timeframe;
          return (
            <TouchableOpacity
              key={tf}
              activeOpacity={0.8}
              onPress={() => handleSelectTf(tf)}
              style={[
                styles.tfPill,
                isActive ? styles.tfPillActive : styles.tfPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tfPillText,
                  isActive ? styles.tfPillTextActive : styles.tfPillTextInactive,
                ]}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  backBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[800],
  },

  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  refreshBtnText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.neutral[700],
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.forest[800],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  titleTextStack: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.forest[950],
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 16,
  },

  timeframeRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tfPill: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tfPillActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
    ...shadows.xs,
  },
  tfPillInactive: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[200],
  },
  tfPillText: {
    fontSize: 12,
  },
  tfPillTextActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.lime[400],
  },
  tfPillTextInactive: {
    fontFamily: typography.fontBodyMedium,
    color: colors.neutral[600],
  },
});
