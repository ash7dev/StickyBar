import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, LifeBuoy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { useAuthStore } from '../../../auth/stores/auth.store';

interface Props {
  nbAnnulations?: number;
  nbAbsencesJourJ?: number;
  threshold?: number;
  warningStart?: number;
}

export function MobileCancellationWarningBanner({
  nbAnnulations: propAnnulations,
  nbAbsencesJourJ: propAbsences,
  threshold = 7,
  warningStart = 4,
}: Props) {
  const { user } = useAuthStore();

  const nbAnnulations = propAnnulations ?? (user as any)?.nbAnnulations ?? 0;
  const nbAbsencesJourJ = propAbsences ?? (user as any)?.nbAbsencesJourJ ?? 0;

  const maxFautes = Math.max(nbAnnulations, nbAbsencesJourJ);
  const remainingBeforeSuspension = Math.max(0, threshold - maxFautes);

  // S'affiche uniquement si l'hôte est proche du seuil de suspension (ex: >= 4 fautes sur 7)
  if (maxFautes < warningStart) {
    return null;
  }

  const handleSupportPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.alertIconCircle}>
          <AlertTriangle size={18} color={colors.warning[500]} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Seuil de suspension proche
            </Text>
            <View style={styles.warningPill}>
              <Text style={styles.warningPillText}>
                {maxFautes}/{threshold} fautes
              </Text>
            </View>
          </View>

          <Text style={styles.cardDesc}>
            Vous avez accumulé {maxFautes} annulation(s) sur {threshold} autorisées. Plus que{' '}
            <Text style={styles.boldText}>
              {remainingBeforeSuspension} chance{remainingBeforeSuspension > 1 ? 's' : ''}
            </Text>{' '}
            avant suspension automatique.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSupportPress}
        style={styles.supportBtn}
      >
        <LifeBuoy size={14} color={colors.forest[950]} />
        <Text style={styles.supportBtnText}>Demander une réinitialisation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.warning[50],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.warning[500],
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(217, 154, 34, 0.15)',
    borderWidth: 1,
    borderColor: colors.warning[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.warning[700],
    flex: 1,
  },
  warningPill: {
    backgroundColor: colors.warning[500],
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.pill,
  },
  warningPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[0],
  },
  cardDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.warning[700],
    lineHeight: 16,
  },
  boldText: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  supportBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
});
