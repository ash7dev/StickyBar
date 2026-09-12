import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../shared/theme/tokens';

interface MobileCheckoutHeaderProps {
  title?: string;
  onBack: () => void;
}

export function MobileCheckoutHeader({
  title = 'Confirmer votre réservation',
  onBack,
}: MobileCheckoutHeaderProps) {
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleBack}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Retour"
      >
        <ChevronLeft size={20} color={colors.forest[950]} />
      </TouchableOpacity>

      <View style={styles.titleCenterBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.secureBadge}>
          <ShieldCheck size={11} color={colors.forest[700]} />
          <Text style={styles.secureBadgeText}>Paiement 100% sécurisé par Klef</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCenterBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secureBadgeText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.forest[700],
  },
});
