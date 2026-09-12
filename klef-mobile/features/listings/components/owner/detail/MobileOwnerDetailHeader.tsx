import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Pencil, Pause, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

export interface MobileOwnerDetailHeaderProps {
  listingId: string;
  titre: string;
  statut: string;
  slug?: string;
  onToggleStatus?: (newStatus: 'PUBLISHED' | 'PAUSED') => void;
  isTogglingStatus?: boolean;
}

export function MobileOwnerDetailHeader({
  listingId,
  titre,
  statut,
  onToggleStatus,
  isTogglingStatus = false,
}: MobileOwnerDetailHeaderProps) {
  const router = useRouter();

  const getStatusBadge = () => {
    switch (statut) {
      case 'PUBLISHED':
        return { label: 'Publiée', bg: colors.forest[50], text: colors.forest[800], border: colors.forest[200], dot: colors.forest[600] };
      case 'PENDING_REVIEW':
        return { label: 'En révision', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#D97706' };
      case 'PAUSED':
        return { label: 'En pause', bg: colors.neutral[100], text: colors.neutral[700], border: colors.neutral[300], dot: colors.neutral[500] };
      case 'REJECTED':
        return { label: 'Rejetée', bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', dot: '#DC2626' };
      default:
        return { label: 'Brouillon', bg: colors.lime[100], text: colors.lime[800], border: colors.lime[300], dot: colors.lime[600] };
    }
  };

  const statusCfg = getStatusBadge();
  const isPublished = statut === 'PUBLISHED';
  const isPaused = statut === 'PAUSED';

  const handleToggleStatusClick = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!onToggleStatus) return;

    if (isPublished) {
      Alert.alert(
        'Mettre l’annonce en pause ?',
        'Votre bien ne sera plus visible par les voyageurs dans la recherche.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Mettre en pause',
            style: 'destructive',
            onPress: () => onToggleStatus('PAUSED'),
          },
        ]
      );
    } else if (isPaused) {
      Alert.alert(
        'Republier l’annonce ?',
        'Votre bien sera immédiatement visible dans la recherche par tous les voyageurs.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Republier',
            onPress: () => onToggleStatus('PUBLISHED'),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        {/* Back Button -> Navigates to owner listings tab */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push('/(owner)/listings' as any);
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={16} color={colors.forest[950]} />
        </TouchableOpacity>

        {/* Status Pill Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!onToggleStatus || isTogglingStatus || (!isPublished && !isPaused)}
          onPress={handleToggleStatusClick}
          style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.border }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
          <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          {(isPublished || isPaused) && (
            <View style={styles.statusActionIcon}>
              {isPublished ? (
                <Pause size={10} color={statusCfg.text} />
              ) : (
                <Play size={10} color={statusCfg.text} />
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Right Action Cluster */}
        <View style={styles.actionsCluster}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push(`/(owner)/add-listing?id=${listingId}` as any);
            }}
            style={styles.editBtn}
          >
            <Pencil size={13} color={colors.forest[950]} strokeWidth={2.2} />
            <Text style={styles.editBtnText}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 16,
    ...shadows.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 42,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
  statusActionIcon: {
    marginLeft: 2,
    opacity: 0.7,
  },
  actionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    ...shadows.xs,
  },
  editBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
});
