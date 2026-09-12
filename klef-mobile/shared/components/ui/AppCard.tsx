import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewProps, TouchableOpacityProps } from 'react-native';
import { colors, radius, shadows } from '../../theme/tokens';

// =============================================================================
// AppCard — Système de cartes Klef Mobile
// SOURCE DE VÉRITÉ : Miroir exact de globals.css .card, .glass, .glass-dark,
//                     section-inverse, marker-box, etc.
// =============================================================================

export interface AppCardProps extends ViewProps {
  variant?: 'card' | 'inverse' | 'inverseDark' | 'alt' | 'glass' | 'glassDark';
  /** Rend la carte pressable (TouchableOpacity) */
  pressable?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

export function AppCard({
  variant = 'card',
  pressable = false,
  onPress,
  style,
  children,
  ...props
}: AppCardProps) {
  const cardStyles = [
    styles.base,
    styles[`variant_${variant}` as keyof typeof styles],
    style,
  ];

  if (pressable || onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={cardStyles}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

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

  // ── .card — Carte blanche standard (la plus utilisée) ─────────────────
  variant_card: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  // ── section-inverse — forest-900 (HostWelcomeBanner, WalletSnapshot) ──
  variant_inverse: {
    backgroundColor: colors.forest[900],
    borderWidth: 1,
    borderColor: colors.border.inverse,
  },

  // ── inverseDark — forest-950 (le « noir vert ») ──────────────────────
  // Utilisé dans les CTA sombres, bannières premium, footer sections
  variant_inverseDark: {
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.border.inverse,
  },

  // ── alt — Fond gris clair (background-alt) ────────────────────────────
  variant_alt: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },

  // ── glass — Glassmorphism clair (search bar, dropdowns flottants) ─────
  variant_glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.64)',
    ...shadows.float,
  },

  // ── glassDark — Glassmorphism sombre (prix sur images, overlays) ──────
  variant_glassDark: {
    backgroundColor: 'rgba(4, 25, 18, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
});
