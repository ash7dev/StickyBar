import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Briefcase } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';
import { useRoleStore } from '../../../shared/stores/role.store';
import { useSwitchRole } from '../../auth/hooks/useSwitchRole';

const INK = colors.forest[950];

/** Porte d'entrée de l'espace gestionnaire : visible seulement pour les comptes gestionnaires. */
export function ManagerSpaceCard() {
  const estGestionnaire = useRoleStore((s) => s.estGestionnaire);
  const activeRole = useRoleStore((s) => s.activeRole);
  const { switchRole, isSwitching, error } = useSwitchRole();

  if (!estGestionnaire || activeRole === 'GESTIONNAIRE') return null;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      disabled={isSwitching}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        switchRole('GESTIONNAIRE');
      }}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir l’espace gestionnaire"
    >
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={styles.icon}>
        <Briefcase size={20} color={INK} />
      </View>
      <View style={styles.body}>
        <Text style={styles.kicker}>CONCIERGERIE PAIXI</Text>
        <Text style={styles.title}>Espace gestionnaire</Text>
        <Text style={styles.text}>{error ?? 'Les biens que vous gérez, leurs séjours et leurs propriétaires.'}</Text>
      </View>
      <View style={styles.go}>
        {isSwitching ? <ActivityIndicator color={INK} /> : <ArrowRight size={17} color={INK} strokeWidth={2.6} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: INK,
  },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.14)' },
  ringOuter: { width: 160, height: 160, borderRadius: 80, top: -70, right: -50 },
  icon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0, gap: 2 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1.2, color: colors.lime[400] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: '#FFFFFF' },
  text: { fontFamily: typography.fontBody, fontSize: 12.5, lineHeight: 17, color: colors.forest[200] },
  go: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
});
