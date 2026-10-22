import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Camera, Plus, SearchX, ShieldCheck, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../../shared/theme/tokens';
import { MobileKlefManagedModal } from '../../../../shared/components/layout/MobileKlefManagedModal';

const INK = colors.forest[950];

interface Props {
  hasFilter?: boolean;
  onAddPress?: () => void;
  /** Revenir à « Tous » quand un filtre ne donne rien. */
  onResetFilter?: () => void;
}

const STEPS = [
  { Icon: Camera, title: 'Photos et infos', text: 'Une dizaine de minutes depuis votre téléphone.' },
  { Icon: ShieldCheck, title: 'Vérification Paixi', text: 'Notre équipe relit l’annonce, en général sous 24 h.' },
  { Icon: Sparkles, title: 'Premières réservations', text: 'Paiement sécurisé, versé après l’arrivée du voyageur.' },
];

export function MobileOwnerListingsEmptyState({ hasFilter, onAddPress, onResetFilter }: Props) {
  const router = useRouter();
  const [managedOpen, setManagedOpen] = useState(false);

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onAddPress) onAddPress();
    else router.push('/(owner)/add-listing' as any);
  };

  if (hasFilter) {
    return (
      <View style={styles.filterCard}>
        <View style={styles.filterIcon}>
          <SearchX size={20} color={colors.neutral[600]} />
        </View>
        <Text style={styles.filterTitle}>Aucun bien ici</Text>
        <Text style={styles.filterText}>Aucune de vos annonces n’a ce statut pour le moment.</Text>
        {onResetFilter && (
          <TouchableOpacity onPress={onResetFilter} style={styles.filterBtn} accessibilityRole="button">
            <Text style={styles.filterBtnText}>Voir tous mes biens</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <View style={[styles.ring, styles.ringOuter]} />
      <View style={[styles.ring, styles.ringInner]} />

      <Text style={styles.kicker}>VOTRE PREMIER BIEN</Text>
      <Text style={styles.title}>
        En ligne{'\n'}
        <Text style={styles.titleAccent}>en dix minutes.</Text>
      </Text>
      <Text style={styles.text}>Publication gratuite : Paixi ne prend une commission que sur les réservations.</Text>

      <View style={styles.steps}>
        {STEPS.map(({ Icon, title, text }, i) => (
          <View key={title} style={styles.step}>
            <View style={styles.stepRail}>
              <View style={styles.stepIcon}>
                <Icon size={15} color={colors.lime[400]} />
              </View>
              {i < STEPS.length - 1 && <View style={styles.stepLine} />}
            </View>
            <View style={styles.stepBody}>
              <Text style={styles.stepTitle}>{title}</Text>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity activeOpacity={0.88} onPress={handleAddPress} style={styles.cta} accessibilityRole="button">
        <Plus size={16} color={INK} strokeWidth={2.6} />
        <Text style={styles.ctaText}>Publier mon bien</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setManagedOpen(true);
        }}
        style={styles.managed}
        accessibilityRole="button"
      >
        <Text style={styles.managedText}>Pas le temps ? Confiez-le à Paixi Managed</Text>
        <ArrowRight size={14} color={colors.lime[400]} />
      </TouchableOpacity>

      <MobileKlefManagedModal visible={managedOpen} onClose={() => setManagedOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 14, padding: 22, borderRadius: 30, overflow: 'hidden', backgroundColor: INK },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 240, height: 240, borderRadius: 120, top: -120, right: -80 },
  ringInner: { width: 140, height: 140, borderRadius: 70, top: -70, right: -30, borderColor: 'rgba(211,242,110,0.2)' },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.lime[400] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 32, lineHeight: 35, letterSpacing: -0.9, color: '#FFFFFF' },
  titleAccent: { color: colors.lime[400], fontStyle: 'italic' },
  text: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.forest[200] },
  steps: { marginTop: 4 },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: 34 },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(211,242,110,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: { flex: 1, width: 1, marginVertical: 4, backgroundColor: 'rgba(211,242,110,0.2)' },
  stepBody: { flex: 1, paddingBottom: 16, paddingTop: 2 },
  stepTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: '#FFFFFF' },
  stepText: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.forest[200], marginTop: 2 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
  },
  ctaText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  managed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  managedText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: colors.lime[400] },

  filterCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  filterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  filterTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 19, color: colors.neutral[900] },
  filterText: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: colors.neutral[600], textAlign: 'center' },
  filterBtn: {
    marginTop: 10,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: INK,
    justifyContent: 'center',
  },
  filterBtnText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.lime[400] },
});
