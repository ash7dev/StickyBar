import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { colors, radius, typography } from '../../../shared/theme/tokens';

const INK = colors.forest[950];

/**
 * Écran de l'espace gestionnaire pas encore construit : on annonce ce qui arrive,
 * plutôt qu'un écran vide. Remplacé écran par écran.
 */
export function ManagerComingSoon({ title, kicker, points }: { title: string; kicker: string; points: string[] }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.kicker}>ESPACE GESTIONNAIRE</Text>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.card}>
        <View style={[styles.ring, styles.ringOuter]} />
        <View style={[styles.ring, styles.ringInner]} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BIENTÔT ICI</Text>
        </View>
        <Text style={styles.cardKicker}>{kicker}</Text>
        <View style={styles.points}>
          {points.map((p) => (
            <View key={p} style={styles.point}>
              <View style={styles.dot}>
                <Check size={11} color={INK} strokeWidth={3} />
              </View>
              <Text style={styles.pointText}>{p}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>En attendant, tout reste disponible sur le site Paixi, dans l’espace gestionnaire.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.neutral[50] },
  content: { paddingHorizontal: 16, paddingBottom: 140, gap: 6 },
  kicker: { fontFamily: typography.fontBodyBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.forest[600] },
  title: { fontFamily: typography.fontDisplaySemiBold, fontSize: 32, letterSpacing: -0.8, color: INK, marginBottom: 14 },
  card: { gap: 14, padding: 22, borderRadius: 30, overflow: 'hidden', backgroundColor: INK },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(211,242,110,0.12)' },
  ringOuter: { width: 240, height: 240, borderRadius: 120, top: -120, right: -80 },
  ringInner: { width: 140, height: 140, borderRadius: 70, top: -70, right: -30, borderColor: 'rgba(211,242,110,0.2)' },
  badge: { alignSelf: 'flex-start', height: 26, paddingHorizontal: 11, borderRadius: radius.pill, backgroundColor: colors.lime[400], justifyContent: 'center' },
  badgeText: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1.2, color: INK },
  cardKicker: { fontFamily: typography.fontDisplaySemiBold, fontSize: 22, lineHeight: 27, letterSpacing: -0.4, color: '#FFFFFF' },
  points: { gap: 10 },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  pointText: { flex: 1, fontFamily: typography.fontBody, fontSize: 14, lineHeight: 20, color: colors.forest[100] },
  note: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.forest[300], marginTop: 4 },
});
