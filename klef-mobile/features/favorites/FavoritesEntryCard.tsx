import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ChevronRight, Heart } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import { INK, tap } from '../reservations/tenant/components/ui';
import { useFavoritesList } from './useFavorites';

/** Entrée « Mes gardés » du profil : nombre de logements et premières photos. */
export function FavoritesEntryCard() {
  const { data } = useFavoritesList();
  const items = data ?? [];
  const photos = items.map((f) => f.logement.photos?.[0]?.url).filter(Boolean).slice(0, 3) as string[];
  return (
    <TouchableOpacity onPress={() => { tap(); router.push('/favoris' as never); }} style={styles.card} accessibilityRole="button">
      <View style={styles.icon}>
        <Heart size={18} color={INK} fill={INK} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Mes gardés</Text>
        <Text style={styles.sub}>{items.length ? `${items.length} logement${items.length > 1 ? 's' : ''} mis de côté` : 'Touchez ♥ sur une annonce pour la garder'}</Text>
      </View>
      {photos.length > 0 && (
        <View style={styles.stack}>
          {photos.map((u, i) => (
            <Image key={u} source={{ uri: u }} style={[styles.thumb, { marginLeft: i ? -10 : 0 }]} contentFit="cover" />
          ))}
        </View>
      )}
      <ChevronRight size={18} color={colors.neutral[400]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  sub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  stack: { flexDirection: 'row' },
  thumb: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.neutral[0] },
});
