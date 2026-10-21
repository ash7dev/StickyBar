import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, ShieldCheck, ChevronRight, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';

export function MobileProfileLegalCard() {
  const router = useRouter();

  const handleOpenCGU = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/cgu' as any);
  };

  const handleOpenPrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/politique-confidentialite' as any);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>CONFIDENTIALITÉ & MENTIONS LÉGALES</Text>

      <View style={styles.linksStack}>
        {/* Lien CGU */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenCGU}
          style={styles.linkRow}
          accessibilityRole="button"
          accessibilityLabel="Conditions Générales d'Utilisation (CGU)"
        >
          <View style={styles.iconCircle}>
            <FileText size={16} color={colors.forest[700]} />
          </View>
          <View style={styles.textStack}>
            <Text style={styles.linkTitle}>Conditions Générales d'Utilisation (CGU)</Text>
            <Text style={styles.linkSub}>Règles de réservation, séquestre & annulations</Text>
          </View>
          <ChevronRight size={16} color={colors.neutral[400]} />
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Lien Politique de Confidentialité */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenPrivacy}
          style={styles.linkRow}
          accessibilityRole="button"
          accessibilityLabel="Politique de Confidentialité & Données Personnelles"
        >
          <View style={styles.iconCircle}>
            <Lock size={16} color={colors.forest[700]} />
          </View>
          <View style={styles.textStack}>
            <Text style={styles.linkTitle}>Politique de Confidentialité</Text>
            <Text style={styles.linkSub}>Protection des données, RGPD & DPO</Text>
          </View>
          <ChevronRight size={16} color={colors.neutral[400]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },
  linksStack: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
    gap: 2,
  },
  linkTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  linkSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginHorizontal: 14,
  },
});
