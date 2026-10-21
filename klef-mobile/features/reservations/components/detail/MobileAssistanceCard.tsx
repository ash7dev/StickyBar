import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HelpCircle, MessageSquare, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

interface MobileAssistanceCardProps {
  reservationId: string;
}

export function MobileAssistanceCard({ reservationId }: MobileAssistanceCardProps) {
  const router = useRouter();

  const handleOpenAssistance = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push({
      pathname: '/assistance',
      params: { reservationId, tab: 'new' },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.iconCircle}>
          <HelpCircle size={20} color={colors.forest[700]} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>Une question ou besoin d'aide ?</Text>
          <Text style={styles.subtitle}>
            L'équipe Paixi vous accompagne 24h/24 et 7j/7 pour assurer votre sérénité.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenAssistance}
        style={styles.mainBtn}
      >
        <MessageSquare size={15} color={colors.forest[950]} />
        <Text style={styles.mainBtnText}>Contacter l'assistance</Text>
        <ChevronRight size={15} color={colors.forest[950]} />
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
    borderColor: colors.forest[100],
    ...shadows.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 16,
  },
  mainBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  mainBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
});
