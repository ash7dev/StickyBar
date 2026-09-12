import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, typography } from '../../../../shared/theme/tokens';

export type OwnerStatusTabId =
  | 'ALL'
  | 'PAID'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface StatusTabConfig {
  id: OwnerStatusTabId;
  label: string;
  dotColor: string;
  isUrgent?: boolean;
}

export const STATUS_TABS: StatusTabConfig[] = [
  { id: 'ALL', label: 'Toutes', dotColor: colors.forest[600] },
  { id: 'PAID', label: 'À décider', dotColor: '#EAB308', isUrgent: true },
  { id: 'PENDING', label: 'En attente', dotColor: '#F59E0B', isUrgent: true },
  { id: 'CONFIRMED', label: 'Confirmées', dotColor: colors.forest[500] },
  { id: 'CHECKED_IN', label: 'En séjour', dotColor: '#10B981', isUrgent: true },
  { id: 'COMPLETED', label: 'Terminées', dotColor: colors.forest[300] },
  { id: 'DISPUTED', label: 'Litiges', dotColor: '#EF4444', isUrgent: true },
  { id: 'CANCELLED', label: 'Annulées', dotColor: colors.neutral[400] },
];

interface Props {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  activeTab: OwnerStatusTabId;
  onTabChange: (tab: OwnerStatusTabId) => void;
  counts: Map<string, number>;
  totalCount: number;
}

export function MobileOwnerReservationHeaderBar({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  counts,
  totalCount,
}: Props) {
  return (
    <View style={styles.container}>
      {/* ── Search Bar ───────────────────────────────────────── */}
      <View style={styles.searchBox}>
        <Search size={18} color={colors.neutral[400]} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Rechercher un logement ou locataire..."
          placeholderTextColor={colors.neutral[400]}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            style={styles.clearBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={colors.neutral[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Status Filter Tabs Carousel ────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === 'ALL' ? totalCount : (counts.get(tab.id) ?? 0);

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.8}
              style={[
                styles.tabPill,
                isActive ? styles.tabPillActive : styles.tabPillInactive,
              ]}
            >
              {/* Dot indicator */}
              <View
                style={[
                  styles.tabDot,
                  { backgroundColor: isActive ? colors.lime[400] : tab.dotColor },
                ]}
              />

              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>

              {/* Count badge */}
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
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 14,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    fontFamily: typography.fontBodyMedium,
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.neutral[900],
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  tabsScroll: {
    paddingHorizontal: 2,
    gap: 8,
    alignItems: 'center',
    paddingBottom: 4,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 7,
    borderWidth: 1,
  },
  tabPillActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[900],
  },
  tabPillInactive: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[200],
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tabLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.xs,
  },
  tabLabelActive: {
    color: colors.neutral[0],
  },
  tabLabelInactive: {
    color: colors.neutral[700],
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countBadgeInactive: {
    backgroundColor: colors.neutral[100],
  },
  countText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },
  countTextActive: {
    color: colors.lime[300],
  },
  countTextInactive: {
    color: colors.neutral[600],
  },
});
