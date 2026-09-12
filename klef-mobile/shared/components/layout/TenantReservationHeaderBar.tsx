import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Compass, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '../../theme/tokens';

export type ReservationTabId = 'ALL' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';

export interface TabCounts {
  total: number;
  confirmed: number;
  checkedIn: number;
  completed: number;
  cancelled: number;
}

interface TenantReservationHeaderBarProps {
  activeTab: ReservationTabId;
  onTabChange: (tab: ReservationTabId) => void;
  counts: TabCounts;
}

const TABS: Array<{
  id: ReservationTabId;
  label: string;
  countKey: keyof TabCounts;
  dotColor: string;
}> = [
  { id: 'ALL', label: 'Toutes', countKey: 'total', dotColor: colors.forest[500] },
  { id: 'CONFIRMED', label: 'Confirmées', countKey: 'confirmed', dotColor: '#2563EB' },
  { id: 'CHECKED_IN', label: 'En cours', countKey: 'checkedIn', dotColor: colors.lime[400] },
  { id: 'COMPLETED', label: 'Terminées', countKey: 'completed', dotColor: colors.neutral[400] },
  { id: 'CANCELLED', label: 'Annulées', countKey: 'cancelled', dotColor: '#F43F5E' },
];

export function TenantReservationHeaderBar({
  activeTab,
  onTabChange,
  counts,
}: TenantReservationHeaderBarProps) {
  const handleTabPress = (tabId: ReservationTabId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onTabChange(tabId);
  };

  return (
    <View style={styles.container}>
      {/* ── 1. Top Contexte & Titre Principal ───────────────────────────── */}
      <View style={styles.topSection}>
        <View style={styles.contextBadge}>
          <Compass size={12} color={colors.forest[700]} />
          <Text style={styles.contextText}>Espace Locataire · Mes Séjours</Text>
        </View>

        {/* Titre Display — Même Font Style que le Web */}
        <Text style={styles.headerTitle}>Mes Séjours & Voyages</Text>

        <Text style={styles.headerSubtitle}>
          Gérez vos réservations, vos contrats et bénéficiez de la protection du séquestre Klef.
        </Text>
      </View>

      {/* ── 2. Badge Garantie Séquestre Klef ────────────────────────────── */}
      <View style={styles.sequestreBadgeCard}>
        <View style={styles.shieldCircle}>
          <ShieldCheck size={20} color={colors.forest[700]} />
        </View>

        <View style={styles.sequestreTextContainer}>
          <View style={styles.sequestreHeaderRow}>
            <Text style={styles.sequestreTitle}>Garantie Séquestre Klef</Text>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.sequestreSub}>
            Paiement débloqué uniquement à la remise des clés
          </Text>
        </View>
      </View>

      {/* ── 3. Barre d'Onglets Segmentée Défilante (Pilules) ───────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.countKey] || 0;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.85}
              onPress={() => handleTabPress(tab.id)}
              style={[
                styles.tabPill,
                isActive && styles.tabPillActive,
              ]}
            >
              <View style={[styles.tabDot, { backgroundColor: tab.dotColor }]} />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabCountPill, isActive && styles.tabCountPillActive]}>
                  <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 4,
  },

  // Top Section
  topSection: {
    gap: 6,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.forest[50],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  contextText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[800],
    letterSpacing: 0.2,
  },

  // Titre Display — Même typographie et font-style que le Web (Outfit/Plus Jakarta Sans)
  headerTitle: {
    fontFamily: typography.fontDisplay,
    fontSize: 28,
    color: colors.forest[950],
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 17,
  },

  // Badge Séquestre
  sequestreBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    padding: 12,
  },
  shieldCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sequestreTextContainer: {
    flex: 1,
    gap: 2,
  },
  sequestreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sequestreTitle: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 11,
    color: colors.forest[950],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lime[400],
  },
  sequestreSub: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[600],
  },

  // Tabs
  tabsScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tabPillActive: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[600],
    borderWidth: 1.5,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tabLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[600],
  },
  tabLabelActive: {
    color: colors.forest[950],
    fontFamily: typography.fontBodyExtraBold,
  },
  tabCountPill: {
    backgroundColor: colors.neutral[200],
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
  },
  tabCountPillActive: {
    backgroundColor: colors.forest[100],
  },
  tabCountText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[700],
  },
  tabCountTextActive: {
    color: colors.forest[800],
  },
});
