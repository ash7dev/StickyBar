import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { List, Map, Play, Search, SlidersHorizontal } from 'lucide-react-native';
import { colors, typography } from '../../shared/theme/tokens';
import type { ExplorerViewMode } from '../../shared/stores/explorer-view.store';
import { INK, tap } from '../reservations/tenant/components/ui';

const MODES: Array<{ key: ExplorerViewMode; label: string; Icon: typeof Play }> = [
  { key: 'video', label: 'Vidéos', Icon: Play },
  { key: 'map', label: 'Carte', Icon: Map },
  { key: 'list', label: 'Liste', Icon: List },
];

/**
 * Barre du haut d'Explorer (maquettes « combinaison ») : recherche · Vidéos | Carte | Liste · filtres,
 * puis le résumé de la recherche. Sombre et transparente sur les vidéos, claire sur la carte et la liste.
 */
export function ExplorerTopBar({
  mode,
  onMode,
  summary,
  onSearch,
  onFilters,
  filterCount,
  variant,
}: {
  mode: ExplorerViewMode;
  onMode: (m: ExplorerViewMode) => void;
  summary: string;
  onSearch: () => void;
  onFilters: () => void;
  filterCount: number;
  variant: 'dark' | 'light' | 'solid';
}) {
  const insets = useSafeAreaInsets();
  const dark = variant === 'dark';
  const glass = dark ? 'rgba(4,25,18,0.5)' : 'rgba(255,255,255,0.96)';
  const fg = dark ? '#FFFFFF' : INK;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }, variant === 'solid' && styles.solid]} pointerEvents="box-none">
      <View style={styles.row}>
        <TouchableOpacity onPress={() => { tap(); onSearch(); }} style={[styles.round, { backgroundColor: glass }]} accessibilityRole="button" accessibilityLabel="Rechercher">
          <Search size={18} color={fg} strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={[styles.tabs, { backgroundColor: dark ? 'rgba(4,25,18,0.5)' : variant === 'solid' ? colors.forest[50] : 'rgba(255,255,255,0.96)' }]} accessibilityRole="tablist">
          {MODES.map(({ key, label, Icon }) => {
            const on = mode === key;
            const color = on ? INK : fg;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => { tap(); onMode(key); }}
                style={[styles.tab, on && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Icon size={13} color={color} strokeWidth={2.4} />
                <Text style={[styles.tabText, { color }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={() => { tap(); onFilters(); }} style={[styles.round, { backgroundColor: glass }]} accessibilityRole="button" accessibilityLabel="Filtres et tri">
          <SlidersHorizontal size={17} color={fg} strokeWidth={2.2} />
          {filterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => { tap(); onSearch(); }} style={[styles.summary, { backgroundColor: dark ? 'rgba(4,25,18,0.45)' : variant === 'solid' ? 'transparent' : 'rgba(255,255,255,0.96)' }]} accessibilityRole="button">
        <Text style={[styles.summaryText, { color: dark ? '#FFFFFF' : INK }]} numberOfLines={1}>
          {summary}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const shadow = { shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  solid: { backgroundColor: colors.neutral[0] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...shadow },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 999, ...shadow },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingHorizontal: 11, borderRadius: 999 },
  tabOn: { backgroundColor: colors.lime[400] },
  tabText: { fontFamily: typography.fontBodySemiBold, fontSize: 13 },
  badge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.neutral[0] },
  badgeText: { fontFamily: typography.fontBodyBold, fontSize: 10, color: INK },
  summary: { alignSelf: 'center', height: 30, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', maxWidth: '100%' },
  summaryText: { fontFamily: typography.fontBodySemiBold, fontSize: 12 },
});
