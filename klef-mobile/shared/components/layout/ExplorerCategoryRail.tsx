import React, { useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  LayoutGrid,
  CalendarDays,
  Waves,
  Sunset,
  Home,
  Building2,
  BedDouble,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';

export interface CategoryItem {
  key: string;
  label: string;
  icon: any;
  filterType?: string;
  filterSousType?: string;
  filterDerniereMinute?: boolean;
  filterWeekend?: boolean;
}

export const EXPLORER_CATEGORIES: CategoryItem[] = [
  { key: 'all', label: 'Tous', icon: LayoutGrid },
  { key: 'weekend', label: 'Ce week-end', icon: CalendarDays, filterWeekend: true },
  { key: 'villa', label: 'Villas', icon: Home, filterType: 'VILLA' },
  { key: 'appart', label: 'Apparts', icon: Building2, filterType: 'APPARTEMENT' },
  { key: 'chambre', label: 'Chambres', icon: BedDouble, filterType: 'CHAMBRE' },
  { key: 'piscine', label: 'Piscine', icon: Waves, filterSousType: 'piscine' },
  { key: 'vue_mer', label: 'Vue mer', icon: Sunset, filterSousType: 'mer' },
  { key: 'derniere_min', label: 'Dernière Min.', icon: Zap, filterDerniereMinute: true },
];

interface ExplorerCategoryRailProps {
  activeCategory: string;
  onSelect: (category: CategoryItem) => void;
}

export function ExplorerCategoryRail({ activeCategory, onSelect }: ExplorerCategoryRailProps) {
  const scrollRef = useRef<ScrollView>(null);

  const handlePress = useCallback((cat: CategoryItem, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelect(cat);
  }, [onSelect]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {EXPLORER_CATEGORIES.map((cat, index) => {
          const isActive = activeCategory === cat.key;
          const IconComponent = cat.icon;

          return (
            <TouchableOpacity
              key={cat.key}
              activeOpacity={0.7}
              onPress={() => handlePress(cat, index)}
              style={[styles.categoryItem, isActive && styles.categoryItemActive]}
            >
              <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                <IconComponent
                  size={18}
                  color={isActive ? colors.forest[950] : colors.neutral[500]}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </View>
              <Text
                style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}
                numberOfLines={1}
              >
                {cat.label}
              </Text>

              {/* Indicateur actif — barre lime sous la catégorie */}
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[0],
    paddingTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 6,
  },

  categoryItem: {
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    paddingBottom: 6,
  },
  categoryItemActive: {},

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  iconCircleActive: {
    backgroundColor: colors.lime[400],
    borderColor: colors.lime[500],
  },

  categoryLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  categoryLabelActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    right: 4,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: colors.forest[950],
  },

  separator: {
    height: 1,
    backgroundColor: colors.neutral[200],
    width: '100%',
  },
});
