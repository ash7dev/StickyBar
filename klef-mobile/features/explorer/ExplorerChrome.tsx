import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Heart, List, Map, Play } from 'lucide-react-native';
import { colors, radius, typography } from '../../shared/theme/tokens';
import type { ExplorerViewMode } from '../../shared/stores/explorer-view.store';
import { useFavoriteIds } from '../favorites/useFavorites';
import { INK, tap } from '../reservations/tenant/components/ui';

const MODES: Array<{ key: ExplorerViewMode; label: string; Icon: typeof Play }> = [
  { key: 'video', label: 'Vidéos', Icon: Play },
  { key: 'map', label: 'Carte', Icon: Map },
  { key: 'list', label: 'Liste', Icon: List },
];

/** Vidéos | Carte | Liste, plus le nombre de résultats. */
export function ExplorerModeTabs({ mode, onChange, total }: { mode: ExplorerViewMode; onChange: (m: ExplorerViewMode) => void; total: number }) {
  return (
    <View style={styles.row}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {MODES.map(({ key, label, Icon }) => {
          const on = mode === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => { tap(); onChange(key); }}
              style={[styles.tab, on && styles.tabOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Icon size={14} color={on ? colors.lime[400] : INK} strokeWidth={2.3} />
              <Text style={[styles.tabText, on && { color: colors.lime[400] }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.total}>{total} logement{total > 1 ? 's' : ''}</Text>
    </View>
  );
}

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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  tabs: { flexDirection: 'row', padding: 3, borderRadius: radius.pill, backgroundColor: colors.forest[50] },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 12, borderRadius: radius.pill },
  tabOn: { backgroundColor: INK },
  tabText: { fontFamily: typography.fontBodySemiBold, fontSize: 13, color: INK },
  total: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: colors.neutral[600] },

  kept: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingLeft: 6, paddingRight: 6, borderRadius: 999, backgroundColor: INK, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  keptIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  keptText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: '#FFFFFF' },
  keptBtn: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: 'rgba(248,251,244,0.14)', justifyContent: 'center' },
  keptBtnText: { fontFamily: typography.fontBodyBold, fontSize: 13, color: colors.lime[400] },
});
