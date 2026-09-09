import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';

export interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'lime' | 'forest' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AppButton({
  label,
  variant = 'lime',
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

  const buttonStyles = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.textBase,
    styles[`textSize_${size}`],
    styles[`textVariant_${variant}`],
    disabled && styles.textDisabled,
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={handlePress}
      style={buttonStyles}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'lime' ? colors.forest[950] : colors.text.inverse}
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
  size_md: { paddingVertical: 12, paddingHorizontal: 22 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 28 },

  // Variants
  variant_lime: {
    backgroundColor: colors.action.default,
  },
  variant_forest: {
    backgroundColor: colors.forest[950],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: colors.error.default,
  },

  disabled: {
    opacity: 0.5,
  },

  // Text Sizes & Colors
  textBase: {
    fontWeight: '700',
  },
  textSize_sm: { fontSize: typography.sizes.xs },
  textSize_md: { fontSize: typography.sizes.sm },
  textSize_lg: { fontSize: typography.sizes.md },

  textVariant_lime: { color: colors.action.text },
  textVariant_forest: { color: colors.text.inverse },
  textVariant_outline: { color: colors.text.primary },
  textVariant_ghost: { color: colors.text.secondary },
  textVariant_danger: { color: colors.text.inverse },

  textDisabled: { color: colors.text.muted },
});
