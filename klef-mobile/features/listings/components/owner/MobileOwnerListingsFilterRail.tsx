import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../../../shared/theme/tokens';

export interface ListingFilterTab {
  id: string;
  label: string;
  count: number;
}

interface Props {
  tabs: ListingFilterTab[];
  activeFilter: string;
  onSelectFilter: (id: string) => void;
}

export function MobileOwnerListingsFilterRail({
  tabs,
  activeFilter,
  onSelectFilter,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.railContainer}
    >
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSelectFilter(tab.id);
            }}
            style={[
              styles.tabPill,
              isActive ? styles.tabPillActive : styles.tabPillInactive,
            ]}
          >
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.countBadge,
                isActive ? styles.countBadgeActive : styles.countBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.countText,
                  isActive ? styles.countTextActive : styles.countTextInactive,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  railContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[800],
  },
  tabPillInactive: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[200],
  },
  tabLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
  },
  tabLabelActive: {
    color: colors.lime[400],
  },
  tabLabelInactive: {
    color: colors.neutral[600],
  },

  countBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(211, 242, 110, 0.20)',
  },
  countBadgeInactive: {
    backgroundColor: colors.neutral[100],
  },
  countText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
  },
  countTextActive: {
    color: colors.lime[400],
  },
  countTextInactive: {
    color: colors.neutral[600],
  },
});
