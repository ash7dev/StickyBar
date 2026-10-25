import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../shared/theme/tokens';

interface OwnerScreenHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  /** Élément affiché à droite du bouton retour (ex. bascule de vue). */
  right?: React.ReactNode;
}

/** En-tête des écrans secondaires de l'espace hôte (même style que Statistiques). */
export function OwnerScreenHeader({ title, subtitle, icon: Icon, right }: OwnerScreenHeaderProps) {
  const router = useRouter();

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (router.canGoBack()) router.back();
    else router.navigate('/(owner)/dashboard' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={goBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={16} color={colors.forest[800]} strokeWidth={2.4} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        {right}
      </View>

      <View style={styles.titleRow}>
        <View style={styles.iconCircle}>
          <Icon size={20} color={colors.lime[400]} strokeWidth={2.4} />
        </View>
        <View style={styles.titleStack}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  backText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.forest[800] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStack: { flex: 1, gap: 2 },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, color: colors.forest[950] },
  subtitle: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
});
