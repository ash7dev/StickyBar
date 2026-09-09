import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../theme/tokens';

export interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'action' | 'lime' | 'forest' | 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AppButton({
  label,
  variant = 'action',
  size = 'md',
  loading = false,
  disabled = false,
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

  const resolvedVariant = variant === 'lime' ? 'action' : variant === 'forest' ? 'primary' : variant;

  const buttonStyles = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${resolvedVariant}`],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.textBase,
    styles[`textSize_${size}`],
    styles[`textVariant_${resolvedVariant}`],
    disabled && styles.textDisabled,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || loading}
      onPress={handlePress}
      style={buttonStyles}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={resolvedVariant === 'action' ? colors.forest[800] : colors.neutral[0]}
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyles}>{label}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  // Sizes
  size_sm: { paddingVertical: 8, paddingHorizontal: 16 },
  size_md: { paddingVertical: 13, paddingHorizontal: 22 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 28 },

  // Variants (Miroir exact de globals.css)
  variant_action: {
    backgroundColor: colors.lime[400],
    borderWidth: 1,
    borderColor: colors.action.edge,
    ...shadows.action,
  },
  variant_primary: {
    backgroundColor: colors.forest[600],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  variant_ghost: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  variant_danger: {
    backgroundColor: colors.error[500],
  },

  disabled: {
    opacity: 0.5,
  },

  // Text Sizes & Colors
  textBase: {
    fontWeight: '600',
  },
  textSize_sm: { fontSize: typography.sizes.xs },
  textSize_md: { fontSize: typography.sizes.sm },
  textSize_lg: { fontSize: typography.sizes.md },

  textVariant_action: { color: colors.forest[800] },
  textVariant_primary: { color: colors.neutral[0] },
  textVariant_outline: { color: colors.neutral[900] },
  textVariant_ghost: { color: colors.neutral[900] },
  textVariant_danger: { color: colors.neutral[0] },

  textDisabled: { color: colors.neutral[500] },
});
