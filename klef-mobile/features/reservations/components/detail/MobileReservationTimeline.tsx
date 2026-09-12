import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Clock, CheckCircle2, ShieldCheck, Sparkles, XCircle, AlertTriangle, CreditCard, LogIn, LogOut } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { HistoriqueReservation } from '../../types/reservation-detail.types';

// ── Traduction humaine des statuts ────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Réservation créée',
  PAID: 'Paiement reçu — sous séquestre',
  CONFIRMED: "Réservation confirmée par l'hôte",
  CHECKED_IN: 'Entrée dans les lieux validée',
  COMPLETED: 'Séjour terminé',
  CANCELLED: 'Réservation annulée',
  DISPUTED: 'Litige déclaré',
  EXPIRED: 'Réservation expirée',
  REFUNDED: 'Remboursement effectué',
};

type DotCategory = 'positive' | 'neutral' | 'negative' | 'warning';

const STATUS_CATEGORY: Record<string, DotCategory> = {
  PENDING: 'neutral',
  PAID: 'positive',
  CONFIRMED: 'positive',
  CHECKED_IN: 'positive',
  COMPLETED: 'positive',
  CANCELLED: 'negative',
  DISPUTED: 'negative',
  EXPIRED: 'warning',
  REFUNDED: 'warning',
};

const DOT_COLORS: Record<DotCategory, { bg: string; border: string; icon: string }> = {
  positive: { bg: '#D1FAE5', border: '#34D399', icon: '#065F46' },
  neutral: { bg: '#FEF3C7', border: '#FDE68A', icon: '#92400E' },
  negative: { bg: '#FEE2E2', border: '#FCA5A5', icon: '#991B1B' },
  warning: { bg: '#FEF3C7', border: '#FDE68A', icon: '#92400E' },
};

const STATUS_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  PENDING: Clock,
  PAID: CreditCard,
  CONFIRMED: ShieldCheck,
  CHECKED_IN: LogIn,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  DISPUTED: AlertTriangle,
  EXPIRED: Clock,
  REFUNDED: Sparkles,
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function humanizeStatus(raw: string): string {
  return STATUS_LABELS[raw] || raw.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

interface MobileReservationTimelineProps {
  historique?: HistoriqueReservation[];
}

export function MobileReservationTimeline({ historique = [] }: MobileReservationTimelineProps) {
  // Tri inverse : les événements les plus récents en premier
  const sortedHistory = useMemo(
    () => [...historique].sort((a, b) => new Date(b.modifieLe).getTime() - new Date(a.modifieLe).getTime()),
    [historique],
  );

  if (!sortedHistory || sortedHistory.length === 0) return null;

  return (
    <View style={styles.card}>
      {/* En-tête */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Clock size={16} color={colors.forest[700]} />
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Chronologie</Text>
          <Text style={styles.headerSub}>{sortedHistory.length} événement{sortedHistory.length > 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.timelineContainer}>
        {sortedHistory.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === sortedHistory.length - 1;
          const category = STATUS_CATEGORY[item.nouveauStatut] || 'neutral';
          const dotColor = DOT_COLORS[category];
          const DotIcon = STATUS_ICON[item.nouveauStatut] || CheckCircle2;

          return (
            <View key={item.id || index.toString()} style={styles.timelineItem}>
              {/* Indicateur vertical */}
              <View style={styles.indicatorCol}>
                <View
                  style={[
                    styles.dotCircle,
                    { backgroundColor: dotColor.bg, borderColor: dotColor.border },
                    isFirst && styles.dotCircleLatest,
                  ]}
                >
                  <DotIcon size={isFirst ? 14 : 11} color={dotColor.icon} />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.connectingLine,
                      { backgroundColor: dotColor.border },
                    ]}
                  />
                )}
              </View>

              {/* Contenu */}
              <View style={[styles.contentCol, isFirst && styles.contentColLatest]}>
                <Text style={[styles.statusName, isFirst && styles.statusNameLatest]}>
                  {humanizeStatus(item.nouveauStatut)}
                </Text>

                {item.ancienStatut && !isFirst ? (
                  <Text style={styles.transitionText}>
                    depuis {humanizeStatus(item.ancienStatut).toLowerCase()}
                  </Text>
                ) : null}

                {item.raison ? (
                  <View style={styles.raisonBox}>
                    <Text style={styles.raisonText}>« {item.raison} »</Text>
                  </View>
                ) : null}

                <Text style={styles.dateText}>{formatDateTime(item.modifieLe)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  headerSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  timelineContainer: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  dotCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCircleLatest: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  connectingLine: {
    width: 2,
    flex: 1,
    marginVertical: 3,
    borderRadius: 1,
    opacity: 0.4,
  },

  contentCol: {
    flex: 1,
    paddingBottom: 18,
    gap: 3,
  },
  contentColLatest: {
    paddingBottom: 20,
  },
  statusName: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.neutral[900],
  },
  statusNameLatest: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  transitionText: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[400],
    fontStyle: 'italic',
  },
  raisonBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 2,
    borderLeftWidth: 2,
    borderLeftColor: colors.neutral[300],
  },
  raisonText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
    fontStyle: 'italic',
    lineHeight: 16,
  },
  dateText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 1,
  },
});
