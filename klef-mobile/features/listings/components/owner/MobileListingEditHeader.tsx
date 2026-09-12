import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ArrowLeft, Check, Loader2, Save } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';

export interface MobileListingEditHeaderProps {
  currentSection: number;
  onSelectSection: (sectionIndex: number) => void;
  onBack: () => void;
  onSave: () => void;
  isSaving?: boolean;
  statut?: string;
  titreLogement?: string;
  hasUnsavedChanges?: boolean;
}

export const EDIT_SECTIONS = [
  { id: 0, label: 'Logement' },
  { id: 1, label: 'Présentation' },
  { id: 2, label: 'Équipements' },
  { id: 3, label: 'Conditions & Wifi' },
  { id: 4, label: 'Photos' },
  { id: 5, label: 'Tarifs & Paliers' },
] as const;

export function MobileListingEditHeader({
  currentSection,
  onSelectSection,
  onBack,
  onSave,
  isSaving = false,
  statut = 'DRAFT',
  titreLogement,
  hasUnsavedChanges = false,
}: MobileListingEditHeaderProps) {
  const getStatusBadge = () => {
    switch (statut) {
      case 'PUBLISHED':
        return { label: 'Publiée', bg: colors.forest[50], text: colors.forest[800], border: colors.forest[200] };
      case 'PENDING_REVIEW':
        return { label: 'En révision', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'PAUSED':
        return { label: 'En pause', bg: colors.neutral[100], text: colors.neutral[700], border: colors.neutral[300] };
      case 'REJECTED':
        return { label: 'Rejetée', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      default:
        return { label: 'Brouillon', bg: colors.lime[100], text: colors.lime[800], border: colors.lime[300] };
    }
  };

  const status = getStatusBadge();

  return (
    <View style={styles.headerContainer}>
      {/* ── Top Row: Back | Status | Save Action ──────────────────────── */}
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onBack();
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={16} color={colors.forest[950]} />
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>

        {/* Status Pill */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
          <Text style={[styles.statusBadgeText, { color: status.text }]}>{status.label}</Text>
        </View>

        {/* Save Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isSaving}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onSave();
          }}
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
        >
          {isSaving ? (
            <Text style={styles.saveBtnText}>Enregistrement...</Text>
          ) : (
            <>
              <Save size={14} color={colors.forest[950]} strokeWidth={2.2} />
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Subtitle / Listing Title summary bar ───────────────────────── */}
      {titreLogement ? (
        <View style={styles.titleSummaryRow}>
          <Text style={styles.titleSummaryText} numberOfLines={1}>
            Modification : <Text style={styles.titleSummaryHighlight}>{titreLogement}</Text>
          </Text>
        </View>
      ) : null}

      {/* ── Segmented Scrollable Tab Rail ─────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {EDIT_SECTIONS.map((sec) => {
          const isActive = sec.id === currentSection;
          return (
            <TouchableOpacity
              key={sec.id}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onSelectSection(sec.id);
              }}
              style={[
                styles.tabPill,
                isActive && styles.tabPillActive,
              ]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {sec.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
    ...shadows.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  backBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  titleSummaryRow: {
    paddingHorizontal: 16,
  },
  titleSummaryText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },
  titleSummaryHighlight: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tabPillActive: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
  },
  tabText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.neutral[700],
  },
  tabTextActive: {
    color: colors.lime[400],
    fontFamily: typography.fontBodyBold,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.lime[400],
  },
});
