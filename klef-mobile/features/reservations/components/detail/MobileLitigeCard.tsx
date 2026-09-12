import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Gavel, Clock, CheckCircle2, XCircle, ShieldAlert, AlertTriangle } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { LitigeReservation } from '../../types/reservation-detail.types';

const MOTIFS_LITIGE: Record<string, string> = {
  DEPASSEMENT_PERSONNES: 'Dépassement du nombre de personnes',
  DEGRADATION: 'Dégradation du logement',
  LOGEMENT_NON_CONFORME: "Logement non conforme à l'annonce",
  NON_PAIEMENT: 'Non-paiement de frais supplémentaires',
  NUISANCES: 'Nuisances ou comportement inapproprié',
  AUTRE: 'Autre motif',
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface MobileLitigeCardProps {
  litige: LitigeReservation;
}

export function MobileLitigeCard({ litige }: MobileLitigeCardProps) {
  const isEnAttente = litige.statut === 'EN_ATTENTE';
  const isFonde = litige.statut === 'FONDE';
  const isNonFonde = litige.statut === 'NON_FONDE';

  const motifLabel = MOTIFS_LITIGE[litige.motif] || (litige.motif ? litige.motif.replace(/_/g, ' ') : 'Autre motif');

  // Pulsing urgency indicator for pending disputes
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isEnAttente) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isEnAttente]);

  return (
    <View style={styles.cardContainer}>
      {/* Alert Banner */}
      <View style={styles.alertBanner}>
        <View style={styles.alertIconWrapper}>
          {isEnAttente && (
            <Animated.View style={[styles.pulseRing, { opacity: pulseAnim }]} />
          )}
          <Gavel size={18} color="#991B1B" />
        </View>
        <View style={styles.alertTextContainer}>
          <Text style={styles.alertTitle}>
            {isEnAttente ? 'Dossier de Litige en Cours' : isFonde ? 'Litige Fondé — Résolu' : 'Litige Non Fondé — Clôturé'}
          </Text>
          <Text style={styles.alertSub}>
            {isEnAttente
              ? "Les fonds sous séquestre restent intégralement gelés jusqu'à arbitrage par l'équipe support Klef."
              : isFonde
              ? "Le litige a été jugé fondé. Les mesures correctives ont été appliquées."
              : "Le litige a été examiné et jugé non fondé. Les fonds ont été libérés."}
          </Text>
        </View>
      </View>

      <View style={styles.contentBox}>
        {/* Status Badge */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>STATUT</Text>
          <View
            style={[
              styles.statusBadge,
              isEnAttente && styles.statusBadgeWarning,
              isFonde && styles.statusBadgeDanger,
              isNonFonde && styles.statusBadgeSuccess,
            ]}
          >
            {isEnAttente ? (
              <Clock size={12} color="#92400E" />
            ) : isFonde ? (
              <CheckCircle2 size={12} color="#991B1B" />
            ) : (
              <XCircle size={12} color="#065F46" />
            )}
            <Text
              style={[
                styles.statusBadgeText,
                isEnAttente && styles.statusTextWarning,
                isFonde && styles.statusTextDanger,
                isNonFonde && styles.statusTextSuccess,
              ]}
            >
              {isEnAttente ? "En cours d'examen" : isFonde ? 'Litige fondé' : 'Litige non fondé'}
            </Text>
          </View>
        </View>

        {/* Motif */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>MOTIF DU LITIGE</Text>
          <View style={styles.motifBox}>
            <AlertTriangle size={14} color="#991B1B" />
            <Text style={styles.motifText}>{motifLabel}</Text>
          </View>
        </View>

        {/* Description */}
        {litige.description ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>DESCRIPTION DÉTAILLÉE</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{litige.description}</Text>
            </View>
          </View>
        ) : null}

        {/* Date */}
        <View style={styles.dateRow}>
          <Clock size={13} color={colors.neutral[500]} />
          <Text style={styles.dateText}>Déclaré le {formatDateTime(litige.creeLe)}</Text>
        </View>

        {/* Processing notice */}
        {isEnAttente && (
          <View style={styles.supportInfoBox}>
            <View style={styles.supportIconCircle}>
              <Clock size={14} color="#92400E" />
            </View>
            <View style={styles.supportInfoContent}>
              <Text style={styles.supportInfoTitle}>Délai de traitement</Text>
              <Text style={styles.supportInfoText}>
                48 à 72h. Nos équipes analysent les pièces justificatives et prendront contact par téléphone.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    overflow: 'hidden',
    ...shadows.md,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  alertIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(153, 27, 27, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#991B1B',
  },
  alertTextContainer: {
    flex: 1,
    gap: 3,
  },
  alertTitle: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13,
    color: '#991B1B',
  },
  alertSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#7F1D1D',
    lineHeight: 16,
  },

  contentBox: {
    padding: 18,
    gap: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.neutral[500],
    letterSpacing: 0.8,
  },

  motifBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  motifText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: '#991B1B',
    flex: 1,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusBadgeWarning: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  statusBadgeDanger: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  statusBadgeSuccess: { backgroundColor: '#D1FAE5', borderColor: '#A7F3D0' },
  statusTextWarning: { color: '#92400E' },
  statusTextDanger: { color: '#991B1B' },
  statusTextSuccess: { color: '#065F46' },
  statusBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },

  descriptionBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
  },
  descriptionText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[800],
    lineHeight: 18,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  dateText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },

  supportInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  supportIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(146, 64, 14, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportInfoContent: {
    flex: 1,
    gap: 2,
  },
  supportInfoTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#92400E',
  },
  supportInfoText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
});
