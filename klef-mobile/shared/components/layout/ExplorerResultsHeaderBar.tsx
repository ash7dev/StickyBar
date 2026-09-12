import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ArrowUpDown, SlidersHorizontal, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';
import { SortOptionValue, SORT_OPTIONS } from './ExplorerSortBottomSheet';

interface ExplorerResultsHeaderBarProps {
  total: number;
  ville?: string;
  currentSort: SortOptionValue;
  onOpenSort: () => void;
  onOpenFilters: () => void;
}

export function ExplorerResultsHeaderBar({
  total,
  ville,
  currentSort,
  onOpenSort,
  onOpenFilters,
}: ExplorerResultsHeaderBarProps) {
  const sortOption = SORT_OPTIONS.find((s) => s.value === currentSort) || SORT_OPTIONS[0];

  return (
    <View style={styles.container}>
      {/* Compteur dynamique de logements */}
      <View style={styles.countCol}>
        <Text style={styles.countTitle}>
          {total > 0 ? `${total.toLocaleString('fr-FR')} ${total > 1 ? 'logements' : 'logement'}` : '0 logement'}
        </Text>
        <Text style={styles.countSubtitle}>
          {ville ? `à ${ville}` : 'disponibles au Sénégal'}
        </Text>
      </View>

      {/* Actions (Puce de tri + Bouton filtres) */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onOpenSort();
          }}
          style={styles.sortPill}
        >
          <ArrowUpDown size={13} color={colors.forest[800]} />
          <Text style={styles.sortPillText} numberOfLines={1}>
            {sortOption.label}
          </Text>
          <ChevronDown size={13} color={colors.neutral[500]} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onOpenFilters();
          }}
          style={styles.filterSquareBtn}
        >
          <SlidersHorizontal size={15} color={colors.forest[950]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 12,
  },
  countCol: {
    flex: 1,
  },
  countTitle: {
    fontFamily: typography.fontDisplay,
    fontSize: 16,
    color: colors.forest[900],
  },
  countSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sortPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[900],
  },
  filterSquareBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
});
