import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { HelpCircle, PhoneCall, MessageSquare } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

interface MobileAssistanceCardProps {
  reservationId: string;
}

export function MobileAssistanceCard({ reservationId }: MobileAssistanceCardProps) {
  const handleCallSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL('tel:+221338000000').catch(() => {
      Alert.alert('Support Klef', 'Le numéro du support est le +221 33 800 00 00');
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
            L'équipe Klef vous accompagne 24h/24 et 7j/7 pour assurer votre sérénité.
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCallSupport}
          style={styles.supportBtn}
        >
          <PhoneCall size={14} color={colors.forest[950]} />
          <Text style={styles.supportBtnText}>Appeler le support</Text>
        </TouchableOpacity>
      </View>
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
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    flex: 1,
    ...shadows.action,
  },
  supportBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
});
