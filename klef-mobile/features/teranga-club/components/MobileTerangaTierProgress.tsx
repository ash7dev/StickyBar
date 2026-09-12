import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Key, Award, Crown, Check, Lock, TrendingUp } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

const TIER_STEPS = [
  {
    tier: 'BRONZE',
    label: 'Clé de Bronze',
    icon: Key,
    cashback: '1.5%',
    reqText: 'Dès la création du compte',
    minGmv: 0,
    minSejours: 0,
  },
  {
    tier: 'SILVER',
    label: 'Clé d’Argent',
    icon: Award,
    cashback: '2.0%',
    reqText: '500 000 FCFA ou 7 séjours',
    minGmv: 500_000,
    minSejours: 7,
  },
  {
    tier: 'GOLD',
    label: 'Clé d’Or',
    icon: Crown,
    cashback: '3.0%',
    reqText: '2 000 000 FCFA ou 15 séjours',
    minGmv: 2_000_000,
    minSejours: 15,
  },
] as const;

const ORDRE: Record<string, number> = { BRONZE: 0, SILVER: 1, GOLD: 2 };

function formatFcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

interface MobileTerangaTierProgressProps {
  currentTier?: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  nbSejours?: number;
  gmv12Mois?: number;
}

export function MobileTerangaTierProgress({
  currentTier = 'BRONZE',
  nbSejours = 0,
  gmv12Mois = 0,
}: MobileTerangaTierProgressProps) {
  const currentRang = ORDRE[currentTier] ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TrendingUp size={16} color={colors.forest[700]} />
          <Text style={styles.headerTitle}>Paliers de privilèges</Text>
        </View>

        <View style={styles.statsPill}>
          <Text style={styles.statsText}>
            {nbSejours} séjour{nbSejours > 1 ? 's' : ''} · {formatFcfa(gmv12Mois)} FCFA
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tiersScroll}
      >
        {TIER_STEPS.map((step) => {
          const rangStep = ORDRE[step.tier];
          const unlocked = rangStep <= currentRang;
          const isCurrent = rangStep === currentRang;
          const isNext = rangStep === currentRang + 1;

          let pctProgression = 0;
          if (unlocked) pctProgression = 100;
          else if (isNext) {
            const pctGmv = step.minGmv > 0 ? (gmv12Mois / step.minGmv) * 100 : 0;
            const pctSejours = step.minSejours > 0 ? (nbSejours / step.minSejours) * 100 : 0;
            pctProgression = Math.round(Math.min(100, Math.max(pctGmv, pctSejours)));
          }

          const resteSejours = Math.max(0, step.minSejours - nbSejours);
          const resteGmv = Math.max(0, step.minGmv - gmv12Mois);
          const StepIcon = step.icon;

          return (
            <View
              key={step.tier}
              style={[
                styles.tierCard,
                isCurrent
                  ? styles.tierCurrent
                  : unlocked
                  ? styles.tierUnlocked
                  : styles.tierLocked,
              ]}
            >
              <View style={styles.tierHeader}>
                <View style={[styles.iconCircle, unlocked && styles.iconCircleUnlocked]}>
                  <StepIcon size={16} color={unlocked ? colors.forest[900] : colors.neutral[500]} />
                </View>

                {unlocked ? (
                  <View style={styles.checkBadge}>
                    <Check size={11} color={colors.forest[950]} strokeWidth={3} />
                  </View>
                ) : (
                  <View style={styles.lockBadge}>
                    <Lock size={10} color={colors.neutral[400]} />
                  </View>
                )}
              </View>

              <View style={{ gap: 2 }}>
                <Text style={styles.tierTitle}>{step.label}</Text>
                <Text style={styles.tierCashback}>{step.cashback} de cashback</Text>
              </View>

              <Text style={styles.tierReq}>{step.reqText}</Text>

              {(unlocked || isNext) && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressText}>
                      {unlocked ? 'Palier débloqué' : `${pctProgression}%`}
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${pctProgression}%` }]} />
                  </View>

                  {!unlocked && (
                    <Text style={styles.remainingText}>
                      Encore <Text style={styles.remainingBold}>{resteSejours}</Text> séjour{resteSejours > 1 ? 's' : ''} ou <Text style={styles.remainingBold}>{formatFcfa(resteGmv)} FCFA</Text>
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  statsPill: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  statsText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[600],
  },

  tiersScroll: {
    gap: 10,
    paddingRight: 4,
  },
  tierCard: {
    width: 190,
    borderRadius: radius.inner,
    padding: 12,
    gap: 8,
    borderWidth: 1,
  },
  tierCurrent: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  tierUnlocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  tierLocked: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
  },

  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleUnlocked: {
    backgroundColor: '#FBBF24',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },

  tierTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  tierCashback: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#B45309',
  },
  tierReq: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[600],
    lineHeight: 14,
  },

  progressContainer: {
    gap: 4,
    marginTop: 2,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 9.5,
    color: '#92400E',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 2,
  },
  remainingText: {
    fontFamily: typography.fontBody,
    fontSize: 9.5,
    color: colors.neutral[600],
    marginTop: 2,
  },
  remainingBold: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
});
