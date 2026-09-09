import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, shadows } from '../../theme/tokens';

export interface AppCardProps extends ViewProps {
  variant?: 'card' | 'inverse' | 'alt' | 'glass';
  children: React.ReactNode;
}

export function AppCard({ variant = 'card', style, children, ...props }: AppCardProps) {
  const cardStyles = [
    styles.base,
    styles[`variant_${variant}`],
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    padding: 18,
  },
  variant_card: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  variant_inverse: {
    backgroundColor: colors.forest[900],
    borderWidth: 1,
    borderColor: colors.border.inverse,
  },
  variant_alt: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  variant_glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.64)',
    ...shadows.float,
  },
});
