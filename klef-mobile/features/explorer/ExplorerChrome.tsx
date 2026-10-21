import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { useFavoriteIds } from '../favorites/useFavorites';
import { INK, tap } from '../reservations/tenant/components/ui';

/** Barre flottante « N gardés » : ouvre Mes gardés. Masquée tant que rien n'est gardé. */
export function KeptBar({ bottom }: { bottom: number }) {
  const { data } = useFavoriteIds();
  const n = data?.length ?? 0;
  if (!n) return null;
  return (
    <TouchableOpacity onPress={() => { tap(); router.push('/favoris' as never); }} style={[styles.kept, { bottom }]} accessibilityRole="button">
      <View style={styles.keptIcon}>
        <Heart size={15} color={INK} fill={INK} />
      </View>
      <Text style={styles.keptText}>
        {n} gardé{n > 1 ? 's' : ''}
      </Text>
      <View style={styles.keptBtn}>
        <Text style={styles.keptBtnText}>Voir</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  kept: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingLeft: 6, paddingRight: 6, borderRadius: 999, backgroundColor: INK, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  keptIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  keptText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: '#FFFFFF' },
  keptBtn: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: 'rgba(248,251,244,0.14)', justifyContent: 'center' },
  keptBtnText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.lime[400] },
});
