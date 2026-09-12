import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { X, MapPin, CalendarDays, ArrowUpDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';

interface ExplorerActiveFiltersProps {
  ville?: string;
  dateArrivee?: string;
  dateDepart?: string;
  sortLabel?: string;
  total: number;
  onClearVille: () => void;
  onClearDates: () => void;
  onClearSort: () => void;
}

export function ExplorerActiveFilters({
  ville,
  dateArrivee,
  dateDepart,
  sortLabel,
  total,
  onClearVille,
  onClearDates,
  onClearSort,
}: ExplorerActiveFiltersProps) {
  const hasVille = !!ville?.trim();
  const hasDates = !!dateArrivee;
  const hasSort = !!sortLabel;

  if (!hasVille && !hasDates && !hasSort) return null;

  const formatDate = (d?: string) => {
    if (!d) return '';
    try {
      const date = new Date(d + 'T12:00:00');
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return d;
    }
  };

  const dateText = hasDates
    ? `${formatDate(dateArrivee)}${dateDepart ? ` → ${formatDate(dateDepart)}` : ''}`
    : null;

  const handleDismiss = (cb: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    cb();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Compteur de résultats */}
        <View style={styles.countChip}>
          <Text style={styles.countText}>
            {total} résultat{total > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Chip Ville */}
        {hasVille && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleDismiss(onClearVille)}
            style={styles.filterChip}
          >
            <MapPin size={11} color={colors.forest[700]} strokeWidth={2.5} />
            <Text style={styles.chipText}>{ville}</Text>
            <View style={styles.chipDismiss}>
              <X size={10} color={colors.neutral[500]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Chip Dates */}
        {hasDates && dateText && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleDismiss(onClearDates)}
            style={styles.filterChip}
          >
            <CalendarDays size={11} color={colors.forest[700]} strokeWidth={2.5} />
            <Text style={styles.chipText}>{dateText}</Text>
            <View style={styles.chipDismiss}>
              <X size={10} color={colors.neutral[500]} />
            </View>
          </TouchableOpacity>
        )}

        {/* Chip Tri */}
        {hasSort && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleDismiss(onClearSort)}
            style={styles.filterChip}
          >
            <ArrowUpDown size={11} color={colors.forest[700]} strokeWidth={2.5} />
            <Text style={styles.chipText}>{sortLabel}</Text>
            <View style={styles.chipDismiss}>
              <X size={10} color={colors.neutral[500]} />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    paddingBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },

  // Compteur
  countChip: {
    backgroundColor: colors.forest[950],
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  countText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[300],
    letterSpacing: 0.2,
  },

  // Filter Chips
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowColor: '#0B3D2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.forest[800],
  },
  chipDismiss: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
