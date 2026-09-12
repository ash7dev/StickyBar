import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { XCircle, Clock, AlertCircle } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';

interface MobileOwnerCancelledBannerCardProps {
  reservation: ReservationDetail;
}

export function MobileOwnerCancelledBannerCard({ reservation }: MobileOwnerCancelledBannerCardProps) {
  const { statut, raisonAnnulation, annuleLe } = reservation;

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const isExpired = statut === 'EXPIRED';

  return (
    <View style={[styles.cardContainer, isExpired ? styles.expiredBorder : styles.cancelledBorder]}>
      <View style={styles.contentRow}>
        <View style={[styles.iconCircle, isExpired ? styles.expiredIconBg : styles.cancelledIconBg]}>
          {isExpired ? (
            <Clock size={20} color="#F59E0B" />
          ) : (
            <XCircle size={20} color="#EF4444" />
          )}
        </View>

        <View style={styles.textCol}>
          <Text style={[styles.title, isExpired ? styles.expiredText : styles.cancelledText]}>
            {isExpired ? 'Demande de réservation expirée' : 'Séjour annulé'}
          </Text>

          <Text style={styles.subtitle}>
            {isExpired
              ? 'Le délai de règlement par le locataire est dépassé (30 min max). La réservation a été automatiquement libérée.'
              : raisonAnnulation
              ? `Motif : ${raisonAnnulation}`
              : 'La réservation a été annulée. Aucune somme n\'a été débitée.'}
          </Text>

          {annuleLe && (
            <Text style={styles.dateText}>
              Annulé le {formatDateTime(annuleLe)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    ...shadows.sm,
  },
  cancelledBorder: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  expiredBorder: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.inner,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cancelledIconBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  expiredIconBg: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
  },
  cancelledText: {
    color: '#FCA5A5',
  },
  expiredText: {
    color: '#FBBF24',
  },
  subtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[200],
    lineHeight: 17,
  },
  dateText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
    marginTop: 2,
  },
});
