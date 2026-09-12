import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, typography } from '../../theme/tokens';

// =============================================================================
// AppBadge — Système de badges Klef Mobile
// SOURCE DE VÉRITÉ : Miroir exact de globals.css .badge-verified, .eyebrow,
//                     et les pills utilisés dans HostWelcomeBanner, KPI cards
// =============================================================================

export interface AppBadgeProps extends ViewProps {
  label: string;
  variant?:
    | 'brand'     // forest-950 + lime text (logo Klef)
    | 'soft'      // forest clair
    | 'verified'  // gold (badge vérifié / étoiles)
    | 'success'   // vert sémantique
    | 'warning'   // orange sémantique
    | 'error'     // rouge sémantique
    | 'neutral'   // gris neutre
    | 'inverse';  // ★ Fond sombre : bordure blanche translucide (welcome banner)
  tone?:
    | 'brand' | 'soft' | 'verified' | 'success' | 'warning'
    | 'error' | 'neutral' | 'inverse'
    | 'gold' | 'lime'; // Backwards compat aliases
  size?: 'sm' | 'md';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AppBadge({
  label,
  variant,
  tone = 'neutral',
  size = 'sm',
  leftIcon,
  rightIcon,
  style,
  ...props
}: AppBadgeProps) {
  const activeVariant =
    variant ||
    (tone === 'gold'
      ? 'verified'
      : tone === 'lime'
        ? 'brand'
        : tone);

  const variantKey = `variant_${activeVariant}` as keyof typeof viewStyles;
  const sizeKey = `size_${size}` as keyof typeof viewStyles;
  const textSizeKey = `textSize_${size}` as keyof typeof textStyles;
  const textVariantKey = `textVariant_${activeVariant}` as keyof typeof textStyles;

  return (
    <View
      style={[
        viewStyles.base,
        viewStyles[sizeKey],
        viewStyles[variantKey],
        style,
      ]}
      {...props}
    >
      {leftIcon}
      <Text
        style={[
          textStyles.text,
          textStyles[textSizeKey],
          textStyles[textVariantKey],
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {rightIcon}
    </View>
  );
}

// ── View Styles (containers) ──────────────────────────────────────────────
const viewStyles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },

  // Sizes
  size_sm: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
  },
  size_md: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },

  // Variants
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
  variant_inverse: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
});

// ── Text Styles ──────────────────────────────────────────────────────────
const textStyles = StyleSheet.create({
  text: {
    fontWeight: '600',
  },
  textSize_sm: {
    fontSize: typography.sizes.xs,
  },
  textSize_md: {
    fontSize: typography.sizes.sm,
  },

  textVariant_brand: {
    color: colors.lime[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
    fontWeight: '700',
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
  textVariant_inverse: {
    color: colors.forest[200],
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 9,
    fontWeight: '700',
  },
});

