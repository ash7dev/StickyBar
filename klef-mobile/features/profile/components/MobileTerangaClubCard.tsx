import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Coins,
  Sparkles,
  Key,
  Award,
  Crown,
  Check,
  Lock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { apiClient } from '../../../shared/api/api-client';

interface MobileTerangaClubCardProps {
  terangaTier?: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  soldeCoins?: number;
  nbSejours?: number;
  gmv12Mois?: number;
  onExploreClick?: () => void;
}

interface TerangaAccountResponse {
  soldeCoins?: number;
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  cashbackPct?: number;
  gmv12Mois?: number;
  nbSejours?: number;
  nextTier?: string | null;
  gmvRemainingForNextTier?: number;
}

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

export function MobileTerangaClubCard({
  terangaTier: propTier,
  soldeCoins: propSolde,
  nbSejours: propSejours,
  gmv12Mois: propGmv,
  onExploreClick,
}: MobileTerangaClubCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TerangaAccountResponse | null>(null);

  const fetchTerangaData = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/teranga-club/me');
      if (res?.data) {
        const payload = res.data.data || res.data;
        setData(payload);
      }
    } catch (err) {
      console.warn('[MobileTerangaClubCard] Erreur chargement Teranga Club:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTerangaData();
  }, [fetchTerangaData]);

  // Valeurs fusionnées entre la réponse API et les props de secours
  const soldeCoins = data?.soldeCoins ?? propSolde ?? 0;
  const rawTier = data?.tier ?? propTier ?? 'BRONZE';
  const currentTier = rawTier in ORDRE ? rawTier : 'BRONZE';
  const currentRang = ORDRE[currentTier] ?? 0;
  const currentStepInfo = TIER_STEPS[currentRang] || TIER_STEPS[0];
  const nbSejours = data?.nbSejours ?? propSejours ?? 0;
  const gmv12Mois = data?.gmv12Mois ?? propGmv ?? 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onExploreClick) {
      onExploreClick();
    } else {
      router.push('/teranga-club' as any);
    }
  };

  return (
    <View style={styles.card}>
      {/* ── 1. En-tête (Structure Web) ────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Coins size={18} color={colors.forest[700]} />
        </View>

        <View style={styles.headerTitleBlock}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Klef Teranga Club
            </Text>
            <View style={styles.rateChip}>
              <Text style={styles.rateChipText} numberOfLines={1}>
                1 coin = 1 FCFA
              </Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Programme de fidélité & cashback instantané
          </Text>
        </View>
      </View>

      {/* ── 2. Hero Widget Solde & Rang (Web Gold Box) ─────────────────── */}
      <View style={styles.soldeBox}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#B45309" />
            <Text style={styles.loadingText}>Chargement des coins Teranga…</Text>
          </View>
        ) : (
          <>
            <View style={styles.soldeTopRow}>
              <View style={styles.soldeLeft}>
                <Text style={styles.soldeLabel} numberOfLines={1}>
                  Vos coins disponibles
                </Text>
                <Text style={styles.soldeAmount} numberOfLines={1}>
                  {soldeCoins.toLocaleString('fr-FR')}{' '}
                  <Text style={styles.soldeUnit}>coins</Text>
                </Text>
              </View>

              <View style={styles.currentTierBadge}>
                <Sparkles size={13} color="#B45309" />
                <Text style={styles.currentTierBadgeText} numberOfLines={1}>
                  {currentStepInfo.label}
                </Text>
              </View>
            </View>

            <Text style={styles.soldeDesc} numberOfLines={2}>
              Rang <Text style={styles.soldeDescBold}>{currentStepInfo.label}</Text> · Profitez de{' '}
              <Text style={styles.soldeDescGold}>{currentStepInfo.cashback} de cashback</Text> sur tous vos séjours Klef.
            </Text>
          </>
        )}
      </View>

      {/* ── 3. Defilement des Paliers (3 Tiers Cards Carousel) ──────────── */}
      <View style={styles.tiersSection}>
        <View style={styles.tiersSectionHeader}>
          <View style={styles.tiersSectionHeaderLeft}>
            <TrendingUp size={14} color={colors.forest[700]} />
            <Text style={styles.tiersSectionTitle} numberOfLines={1}>
              Progression des paliers
            </Text>
          </View>
          <View style={styles.statsPill}>
            <Text style={styles.statsPillText} numberOfLines={1}>
              {nbSejours} séjour{nbSejours > 1 ? 's' : ''} · {formatFcfa(gmv12Mois)} FCFA
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tiersScrollContainer}
        >
          {TIER_STEPS.map((step) => {
            const rangStep = ORDRE[step.tier];
            const unlocked = rangStep <= currentRang;
            const current = rangStep === currentRang;
            const next = rangStep === currentRang + 1;

            let pctProgression = 0;
            if (unlocked) pctProgression = 100;
            else if (next) {
              pctProgression = Math.round(
                Math.min(
                  100,
                  Math.max(
                    step.minGmv > 0 ? (gmv12Mois / step.minGmv) * 100 : 0,
                    step.minSejours > 0 ? (nbSejours / step.minSejours) * 100 : 0
                  )
                )
              );
            }

            const resteSejours = Math.max(0, step.minSejours - nbSejours);
            const resteGmv = Math.max(0, step.minGmv - gmv12Mois);

            const StepIcon = step.icon;

            return (
              <View
                key={step.tier}
                style={[
                  styles.tierCard,
                  current
                    ? styles.tierCardCurrent
                    : unlocked
                    ? styles.tierCardUnlocked
                    : styles.tierCardLocked,
                ]}
              >
                <View style={styles.tierCardHeader}>
                  <View style={styles.tierIconCircle}>
                    <StepIcon
                      size={16}
                      color={unlocked ? colors.forest[900] : colors.neutral[500]}
                    />
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
                  <Text style={styles.tierCardTitle} numberOfLines={1}>
                    {step.label}
                  </Text>
                  <Text style={styles.tierCardCashback} numberOfLines={1}>
                    {step.cashback} de cashback
                  </Text>
                </View>

                <Text style={styles.tierCardReq} numberOfLines={2}>
                  {step.reqText}
                </Text>

                {/* Progress track */}
                {(unlocked || next) && (
                  <View style={styles.progressTrackContainer}>
                    <View style={styles.progressTrackLabelRow}>
                      <Text style={styles.progressTrackText} numberOfLines={1}>
                        {unlocked ? 'Palier atteint' : `${pctProgression}%`}
                      </Text>
                    </View>
                    <View style={styles.progressTrackBarBg}>
                      <View
                        style={[
                          styles.progressTrackBarFill,
                          { width: `${pctProgression}%` },
                        ]}
                      />
                    </View>
                    {!unlocked && (
                      <Text style={styles.remainingText} numberOfLines={2}>
                        Encore <Text style={styles.remainingBold}>{resteSejours}</Text> séjour{resteSejours > 1 ? 's' : ''} ou{' '}
                        <Text style={styles.remainingBold}>{formatFcfa(resteGmv)} FCFA</Text>
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 4. Bouton CTA Web ─────────────────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.ctaButton}
      >
        <Sparkles size={16} color={colors.forest[950]} />
        <Text style={styles.ctaButtonText} numberOfLines={1}>
          Mon Teranga Club
        </Text>
        <ChevronRight size={16} color={colors.forest[950]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
    flex: 1,
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  rateChip: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  rateChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[600],
  },

  // Hero Gold Box (Web TerangaClubWidgetCard)
  soldeBox: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: radius.inner,
    padding: 14,
    gap: 8,
    minHeight: 80,
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: '#92400E',
  },
  soldeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  soldeLeft: {
    gap: 1,
  },
  soldeLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soldeAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: '#B45309',
  },
  soldeUnit: {
    fontSize: 12,
    fontFamily: typography.fontBodySemiBold,
  },
  currentTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  currentTierBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#B45309',
  },
  soldeDesc: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  soldeDescBold: {
    fontFamily: typography.fontBodyBold,
    color: '#78350F',
  },
  soldeDescGold: {
    fontFamily: typography.fontBodyBold,
    color: '#B45309',
  },

  // Tiers Scroll Carousel (Web TerangaTierProgressCard)
  tiersSection: {
    gap: 10,
  },
  tiersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  tiersSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  tiersSectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsPill: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  statsPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[600],
  },
  tiersScrollContainer: {
    gap: 10,
    paddingRight: 4,
  },
  tierCard: {
    width: 185,
    borderRadius: radius.inner,
    padding: 12,
    gap: 8,
    borderWidth: 1,
  },
  tierCardCurrent: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  tierCardUnlocked: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  tierCardLocked: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.neutral[200],
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
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
  tierCardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  tierCardCashback: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#B45309',
  },
  tierCardReq: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[600],
    lineHeight: 14,
  },

  // Progress Track inside Tier Card
  progressTrackContainer: {
    gap: 4,
    marginTop: 2,
  },
  progressTrackLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrackText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 9,
    color: '#92400E',
  },
  progressTrackBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(180, 83, 9, 0.15)',
    overflow: 'hidden',
  },
  progressTrackBarFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 2,
  },
  remainingText: {
    fontFamily: typography.fontBody,
    fontSize: 9,
    color: colors.neutral[600],
    marginTop: 2,
  },
  remainingBold: {
    fontFamily: typography.fontBodySemiBold,
    color: colors.forest[950],
  },

  // CTA Button
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  ctaButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
});
