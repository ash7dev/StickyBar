import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, typography } from '../../theme/tokens';

export interface AppBadgeProps extends ViewProps {
  label: string;
  tone?: 'success' | 'warning' | 'error' | 'gold' | 'lime' | 'neutral';
  leftIcon?: React.ReactNode;
}

export function AppBadge({ label, tone = 'neutral', leftIcon, style }: AppBadgeProps) {
  return (
    <View style={[styles.base, styles[`tone_${tone}`], style]}>
      {leftIcon}
      <Text style={[styles.text, styles[`textTone_${tone}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderWidth: 1,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },

  tone_success: { backgroundColor: colors.success.bg, borderColor: colors.success.border },
  tone_warning: { backgroundColor: colors.warning.bg, borderColor: colors.warning.border },
  tone_error: { backgroundColor: colors.error.bg, borderColor: colors.error.border },
  tone_gold: { backgroundColor: colors.gold[50], borderColor: colors.gold[400] },
  tone_lime: { backgroundColor: 'rgba(217, 249, 157, 0.2)', borderColor: colors.action.border },
  tone_neutral: { backgroundColor: colors.background.alt, borderColor: colors.border.default },

  textTone_success: { color: colors.success.text },
  textTone_warning: { color: colors.warning.text },
  textTone_error: { color: colors.error.text },
  textTone_gold: { color: colors.gold[600] },
  textTone_lime: { color: colors.forest[950] },
  textTone_neutral: { color: colors.text.secondary },
});
