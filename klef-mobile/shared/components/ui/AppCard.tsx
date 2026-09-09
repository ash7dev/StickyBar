import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, radius } from '../../theme/tokens';

export interface AppCardProps extends ViewProps {
  variant?: 'card' | 'inverse' | 'alt';
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
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  variant_inverse: {
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.border.inverse,
  },
  variant_alt: {
    backgroundColor: colors.background.alt,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
});
