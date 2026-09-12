import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

interface Props {
  hasFilter?: boolean;
}

export function MobileOwnerListingsEmptyState({ hasFilter }: Props) {
  const router = useRouter();

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    router.push('/(owner)/add-listing' as any);
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Building2 size={28} color={colors.lime[400]} />
      </View>

      <View style={styles.textStack}>
        <Text style={styles.title}>
          {hasFilter
            ? 'Aucune annonce trouvée avec ce filtre'
            : 'Aucune annonce publiée'}
        </Text>
        <Text style={styles.description}>
          {hasFilter
            ? 'Essayez de changer de filtre pour consulter vos autres logements.'
            : 'Mettez en ligne votre premier bien immobilier et commencez à recevoir des réservations sécurisées dès aujourd’hui.'}
        </Text>
      </View>

      {!hasFilter && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAddPress}
          style={styles.actionBtn}
        >
          <Plus size={16} color={colors.forest[950]} strokeWidth={2.5} />
          <Text style={styles.actionBtnText}>Publier un nouveau bien</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 14,
    marginVertical: 12,
    ...shadows.xs,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.forest[800],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  textStack: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
    textAlign: 'center',
  },
  description: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadows.action,
  },
  actionBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
});
