import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Check } from 'lucide-react-native';
import { colors, typography } from '../../../shared/theme/tokens';
import { MobileKlefManagedModal } from '../../../shared/components/layout/MobileKlefManagedModal';
import { INK } from '../../reservations/tenant/components/ui';

/**
 * Invitation propriétaire (Paixi Managed), en bas de l'accueil : une carte éditoriale
 * sur la photo d'un vrai logement Paixi. Ouvre le même formulaire de conciergerie.
 */
export function HostInvite({ cover }: { cover?: string }) {
  const [open, setOpen] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const press = (to: number) => Animated.spring(scale, { toValue: to, speed: 40, bounciness: 4, useNativeDriver: true }).start();

  return (
    <View style={styles.wrap}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPressIn={() => press(0.98)}
          onPressOut={() => press(1)}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            setOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Confier mon logement à Paixi Managed et estimer mes revenus"
          style={styles.card}
        >
          {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
          <LinearGradient colors={['rgba(4,25,18,0.2)', 'rgba(4,25,18,0.55)', 'rgba(4,25,18,0.96)']} locations={[0, 0.35, 0.75]} style={StyleSheet.absoluteFill} />

          <View style={styles.badge}>
            <Text style={styles.badgeText}>PAIXI MANAGED · POUR LES PROPRIÉTAIRES</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.title}>
              Votre logement,{'\n'}
              <Text style={styles.titleAccent}>on s’en occupe.</Text>
            </Text>
            <Text style={styles.text}>Conciergerie 100 % déléguée, prise en charge sous 24 h.</Text>
            <View style={styles.tags}>
              {['Sans engagement', 'Gratuit', 'Confidentiel'].map((t) => (
                <View key={t} style={styles.tag}>
                  <Check size={11} color={colors.lime[400]} strokeWidth={3} />
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
            <View style={styles.cta}>
              <Text style={styles.ctaText}>Estimer mes revenus</Text>
              <View style={styles.ctaArrow}>
                <ArrowRight size={15} color={colors.lime[400]} strokeWidth={2.6} />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
      <MobileKlefManagedModal visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  card: { height: 330, borderRadius: 30, overflow: 'hidden', backgroundColor: INK, justifyContent: 'space-between' },
  badge: { alignSelf: 'flex-start', margin: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(4,25,18,0.55)' },
  badgeText: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1.2, color: colors.lime[400] },
  body: { padding: 18, gap: 10 },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.8, color: '#FFFFFF' },
  titleAccent: { color: colors.lime[400], fontStyle: 'italic' },
  text: { fontFamily: typography.fontBody, fontSize: 13, lineHeight: 19, color: '#DDE8E1' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tagText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: '#C9DBD1' },
  cta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10, height: 48, paddingLeft: 20, paddingRight: 5, marginTop: 4, borderRadius: 999, backgroundColor: colors.lime[400] },
  ctaText: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  ctaArrow: { width: 38, height: 38, borderRadius: 19, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
});
