import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';

export interface TenantSearchBarPillProps {
  onPress: () => void;
  onFilterPress?: () => void;
  destination?: string;
  subtitle?: string;
}

export function TenantSearchBarPill({
  onPress,
  onFilterPress,
  destination,
  subtitle = 'Destination • Dates • Tout Sénégal',
}: TenantSearchBarPillProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const handleFilterPress = (e: any) => {
    e?.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onFilterPress) {
      onFilterPress();
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.pillContainer}
    >
      {/* Left Search Icon Badge */}
      <View style={styles.searchBadge}>
        <Search size={18} color={colors.forest[950]} strokeWidth={2.2} />
      </View>

      {/* Center Text Info */}
      <View style={styles.textColumn}>
        <Text style={styles.titleText} numberOfLines={1}>
          {destination && destination.trim() ? destination : 'Où allez-vous ?'}
        </Text>
        <Text numberOfLines={1} style={styles.subtitleText}>
          {subtitle}
        </Text>
      </View>

      {/* Right Filter Icon Tile */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleFilterPress}
        style={styles.filterTile}
      >
        <SlidersHorizontal size={16} color={colors.forest[900]} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 8,
    height: 56,
    gap: 10,
    ...shadows.sm,
  },
  searchBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.sm,
    color: colors.forest[950],
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  filterTile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
