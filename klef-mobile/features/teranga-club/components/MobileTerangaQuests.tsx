import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Award, Check, Coins, Sparkles, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { apiClient } from '../../../shared/api/api-client';

export interface TerangaQuest {
  code: string;
  titre: string;
  description: string;
  recompenseCoins: number;
  statut: 'A_FAIRE' | 'DISPONIBLE' | 'RECLAME' | string;
  progression?: number;
}

interface MobileTerangaQuestsProps {
  quests?: TerangaQuest[];
  isAuthenticated?: boolean;
  onClaimSuccess?: () => void;
}

const DEFAULT_QUESTS: TerangaQuest[] = [
  {
    code: 'COMPLETER_PROFIL',
    titre: 'Profil 100% complété',
    description: 'Renseignez vos nom, prénom, avatar et biographie.',
    recompenseCoins: 500,
    statut: 'DISPONIBLE',
    progression: 100,
  },
  {
    code: 'KYC_VERIFIE',
    titre: 'Identité vérifiée (KYC)',
    description: 'Soumettez votre pièce d’identité pour débloquer votre statut vérifié.',
    recompenseCoins: 1000,
    statut: 'A_FAIRE',
    progression: 50,
  },
  {
    code: 'FIRST_RESERVATION',
    titre: 'Premier séjour Klef',
    description: 'Réservez votre premier logement sur l’application.',
    recompenseCoins: 2000,
    statut: 'A_FAIRE',
    progression: 0,
  },
  {
    code: 'AVIS_POSTE',
    titre: 'Premier avis publié',
    description: 'Laissez une évaluation après la fin de votre premier séjour.',
    recompenseCoins: 500,
    statut: 'A_FAIRE',
    progression: 0,
  },
];

export function MobileTerangaQuests({
  quests: propQuests,
  isAuthenticated = true,
  onClaimSuccess,
}: MobileTerangaQuestsProps) {
  const quests = propQuests && propQuests.length > 0 ? propQuests : DEFAULT_QUESTS;
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [claimedCodes, setClaimedCodes] = useState<Record<string, boolean>>({});

  const handleClaim = async (code: string) => {
    if (!isAuthenticated) return;
    try {
      setClaimingCode(code);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      await apiClient.post(`/teranga-club/quests/${code}/claim`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setClaimedCodes((prev) => ({ ...prev, [code]: true }));
      onClaimSuccess?.();
    } catch (err) {
      console.warn('[MobileTerangaQuests] Erreur réclamation quête:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setClaimingCode(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Award size={16} color={colors.forest[700]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Quêtes & Badges</Text>
          <Text style={styles.headerSubtitle}>Gagnez des coins supplémentaires en complétant des défis</Text>
        </View>
      </View>

      <View style={styles.questsList}>
        {quests.map((q) => {
          const isClaimed = q.statut === 'RECLAME' || claimedCodes[q.code];
          const isClaimable = q.statut === 'DISPONIBLE' && !isClaimed;
          const isPending = claimingCode === q.code;

          return (
            <View key={q.code} style={styles.questItem}>
              <View style={styles.questTop}>
                <View style={styles.questTitleRow}>
                  <Text style={styles.questTitle}>{q.titre}</Text>
                  <View style={styles.rewardChip}>
                    <Coins size={11} color="#B45309" />
                    <Text style={styles.rewardText}>+{q.recompenseCoins}</Text>
                  </View>
                </View>

                <Text style={styles.questDesc}>{q.description}</Text>
              </View>

              <View style={styles.questBottom}>
                {isClaimed ? (
                  <View style={styles.claimedBadge}>
                    <Check size={12} color={colors.forest[800]} strokeWidth={3} />
                    <Text style={styles.claimedText}>Réclamé</Text>
                  </View>
                ) : isClaimable ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleClaim(q.code)}
                    disabled={isPending}
                    style={styles.claimButton}
                  >
                    {isPending ? (
                      <ActivityIndicator size="small" color={colors.forest[950]} />
                    ) : (
                      <>
                        <Sparkles size={13} color={colors.forest[950]} />
                        <Text style={styles.claimButtonText}>Réclamer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.progressPill}>
                    <Text style={styles.progressText}>En cours ({q.progression ?? 0}%)</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },

  questsList: {
    gap: 10,
  },
  questItem: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  questTop: {
    gap: 4,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  questTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
    flex: 1,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  rewardText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 10.5,
    color: '#B45309',
  },
  questDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
    lineHeight: 16,
  },

  questBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  claimedText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[800],
  },

  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  claimButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[950],
  },

  progressPill: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  progressText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10.5,
    color: colors.neutral[600],
  },
});
