// ─────────────────────────────────────────────────────────────────────────────
// Paixi — logo (symbole tige + feuille, wordmark Fraunces 600)
// Même construction que le web : symbole = 1.16 × la taille du texte,
// écart 0.13 × la taille du texte.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, typography } from '../../theme/tokens';

type Tone = 'default' | 'inverse';

const TONES: Record<Tone, { stem: string; leaf: string; text: string }> = {
  default: { stem: colors.forest[600], leaf: colors.lime[600], text: colors.forest[950] },
  inverse: { stem: colors.neutral[50], leaf: colors.lime[400], text: colors.neutral[50] },
};

export function PaixiSymbol({ size = 24, tone = 'default' }: { size?: number; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <Svg width={(size * 80) / 104} height={size} viewBox="0 0 80 104">
      <Rect x={10} y={30} width={15} height={72} rx={7.5} fill={t.stem} />
      <Path d="M25 76 A46 46 0 0 1 72 28 A46 46 0 0 1 25 76 Z" fill={t.leaf} />
    </Svg>
  );
}

export function PaixiLogo({ size = 24, tone = 'default' }: { size?: number; tone?: Tone }) {
  return (
    <View style={[styles.row, { gap: size * 0.13 }]} accessibilityRole="image" accessibilityLabel="Paixi">
      <PaixiSymbol size={size * 1.16} tone={tone} />
      <Text style={[styles.word, { fontSize: size, letterSpacing: size * -0.033, color: TONES[tone].text }]}>paixi</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: { fontFamily: typography.fontDisplaySemiBold, includeFontPadding: false },
});
