import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, typography } from '../../theme/tokens';

export interface AppBadgeProps extends ViewProps {
  label: string;
  variant?: 'brand' | 'soft' | 'verified' | 'success' | 'warning' | 'error' | 'neutral';
  tone?: 'brand' | 'soft' | 'verified' | 'success' | 'warning' | 'error' | 'neutral' | 'gold' | 'lime'; // Backwards compat alias
  leftIcon?: React.ReactNode;
}

export function AppBadge({
  label,
  variant,
  tone = 'neutral',
  leftIcon,
  style,
  ...props
}: AppBadgeProps) {
  const activeVariant = variant || (tone === 'gold' ? 'verified' : tone === 'lime' ? 'brand' : tone);

  return (
    <View style={[styles.base, styles[`variant_${activeVariant}`], style]} {...props}>
      {leftIcon}
      <Text style={[styles.text, styles[`textVariant_${activeVariant}`]]}>{label}</Text>
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
    fontWeight: '600',
  },

  // Variants (Miroir exact de globals.css)
  variant_brand: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
  },
  variant_soft: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[100],
  },
  variant_verified: {
    backgroundColor: colors.gold[50],
    borderColor: colors.gold[200],
  },
  variant_success: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[500],
  },
  variant_warning: {
    backgroundColor: colors.warning[50],
    borderColor: colors.warning[500],
  },
  variant_error: {
    backgroundColor: colors.error[50],
    borderColor: colors.error[500],
  },
  variant_neutral: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },

  // Text colors & styles
  textVariant_brand: {
    color: colors.lime[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
  },
  textVariant_soft: {
    color: colors.forest[800],
  },
  textVariant_verified: {
    color: colors.gold[700],
  },
  textVariant_success: {
    color: colors.success[700],
  },
  textVariant_warning: {
    color: colors.warning[700],
  },
  textVariant_error: {
    color: colors.error[700],
  },
  textVariant_neutral: {
    color: colors.neutral[600],
  },
});
