import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../theme/tokens';

// =============================================================================
// AppButton — Système de boutons Klef Mobile
// SOURCE DE VÉRITÉ : Miroir exact de globals.css btn-action / btn-primary /
//                     btn-ghost / btn-outline / btn-inverse
// =============================================================================

export interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?:
    | 'action'    // ★ CTA Lime — UN SEUL par écran
    | 'lime'      // alias → action
    | 'primary'   // Vert forest structurant
    | 'forest'    // alias → primary
    | 'white'     // ★ Clean Hyper-Blanc + texte Vert Forest (hyper élégant)
    | 'outline'   // Transparent + bordure
    | 'ghost'     // Blanc + bordure
    | 'inverse'   // Fond sombre : bordure blanche translucide
    | 'danger';   // Rouge erreur
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AppButton({
  label,
  variant = 'action',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onPress,
  style,
  ...props
}: AppButtonProps) {
  const handlePress = (e: any) => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onPress) onPress(e);
  };

  const resolvedVariant =
    variant === 'lime' ? 'action' : variant === 'forest' ? 'primary' : variant;

  const sizeKey = `size_${size}` as keyof typeof viewStyles;
  const variantKey = `variant_${resolvedVariant}` as keyof typeof viewStyles;

  const buttonStyles = [
    viewStyles.base,
    viewStyles[sizeKey],
    viewStyles[variantKey],
    fullWidth && viewStyles.fullWidth,
    (disabled || loading) && viewStyles.disabled,
    style,
  ];

  const textSizeKey = `textSize_${size}` as keyof typeof txtStyles;
  const textVariantKey = `textVariant_${resolvedVariant}` as keyof typeof txtStyles;

  const labelStyles = [
    txtStyles.textBase,
    txtStyles[textSizeKey],
    txtStyles[textVariantKey],
    disabled && txtStyles.textDisabled,
  ];

  const spinnerColor =
    resolvedVariant === 'action'
      ? colors.forest[800]
      : resolvedVariant === 'inverse'
        ? colors.neutral[0]
        : resolvedVariant === 'outline'
          ? colors.neutral[900]
          : colors.neutral[0];

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || loading}
      onPress={handlePress}
      style={buttonStyles}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text numberOfLines={1} style={labelStyles}>{label}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

// ── View Styles ──────────────────────────────────────────────────────────
const viewStyles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  fullWidth: {
    width: '100%',
  },

  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 34,
  },
  size_md: {
    paddingVertical: 13,
    paddingHorizontal: 22,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    minHeight: 52,
  },

  // Variants
  variant_action: {
    backgroundColor: colors.lime[400],
    borderWidth: 1,
    borderColor: colors.action.edge,
    ...shadows.action,
  },
  variant_primary: {
    backgroundColor: colors.forest[600],
    borderWidth: 1,
    borderColor: colors.forest[700],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  variant_white: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  variant_ghost: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  variant_inverse: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  variant_danger: {
    backgroundColor: colors.error[500],
    borderWidth: 1,
    borderColor: colors.error[600],
  },

  disabled: {
    opacity: 0.5,
  },
});

// ── Text Styles ──────────────────────────────────────────────────────────
const txtStyles = StyleSheet.create({
  textBase: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  textSize_sm: { fontSize: typography.sizes.xs },
  textSize_md: { fontSize: typography.sizes.sm },
  textSize_lg: { fontSize: typography.sizes.md },

  textVariant_action: { color: colors.forest[800] },
  textVariant_primary: { color: colors.neutral[0] },
  textVariant_white: { color: colors.forest[800], fontWeight: '700' },
  textVariant_outline: { color: colors.forest[800] },
  textVariant_ghost: { color: colors.forest[800] },
  textVariant_inverse: { color: colors.neutral[0], fontWeight: '500' },
  textVariant_danger: { color: colors.neutral[0] },

  textDisabled: { color: colors.neutral[500] },
});

