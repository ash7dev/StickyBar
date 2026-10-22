import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Building2 } from 'lucide-react-native';
import { colors, typography } from '../../../../shared/theme/tokens';
import { INK, LIME } from './ui';

/** Nouveau gestionnaire, aucun bien confié : on explique comment le parc se remplit. */
export function EmptyPark({ topInset, firstName }: { topInset: number; firstName?: string | null }) {
  return (
    <View style={[styles.hero, { paddingTop: topInset + 24 }]}>
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={[styles.ring, styles.ringInner]} />
      <View style={styles.icon}>
        <Building2 size={26} color={INK} />
      </View>
      <Text style={styles.kicker}>ESPACE GESTIONNAIRE{firstName ? ` · ${firstName.toUpperCase()}` : ''}</Text>
      <Text style={styles.title}>
        Votre parc{'\n'}
        <Text style={styles.accent}>attend ses premiers biens.</Text>
      </Text>
      <Text style={styles.text}>
        Dès qu’un propriétaire vous confie un logement, sa journée, ses séjours et ses revenus apparaissent ici. L’attribution des biens se fait depuis l’espace gestionnaire web.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12, paddingHorizontal: 22, paddingBottom: 30, backgroundColor: INK, overflow: 'hidden' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 320, height: 320, borderRadius: 160, top: -110, right: -110 },
  ringInner: { width: 200, height: 200, borderRadius: 100, top: -50, right: -50, borderColor: 'rgba(211,242,110,0.2)' },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 11, letterSpacing: 1.3, color: LIME },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.9, color: '#FFFFFF' },
  accent: { color: LIME, fontStyle: 'italic' },
  text: { fontFamily: typography.fontBody, fontSize: 14, lineHeight: 21, color: colors.forest[200] },
});
