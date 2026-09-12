import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Gavel, Clock, CheckCircle2, XCircle, ShieldAlert, AlertTriangle, User } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { LitigeReservation } from '../../../types/reservation-detail.types';

const MOTIFS_LITIGE: Record<string, string> = {
  DEPASSEMENT_PERSONNES: 'Dépassement du nombre de voyageurs',
  DEGRADATION: 'Dégâts matériels / Casse',
  LOGEMENT_NON_CONFORME: "Logement non conforme à l'annonce",
  NON_PAIEMENT: 'Non-paiement de frais supplémentaires',
  NUISANCES: 'Nuisances ou fête non autorisée',
  AUTRE: 'Autre motif ou manquement',
};

function formatDateTime(iso?: string) {
  if (!iso) return '—';
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
}

interface MobileOwnerLitigeCardProps {
  litige: LitigeReservation;
}

export function MobileOwnerLitigeCard({ litige }: MobileOwnerLitigeCardProps) {
  const isEnAttente = litige.statut === 'EN_ATTENTE';
  const isFonde = litige.statut === 'FONDE';
  const isNonFonde = litige.statut === 'NON_FONDE';

  const motifLabel = MOTIFS_LITIGE[litige.motif] || (litige.motif ? litige.motif.replace(/_/g, ' ') : 'Autre motif');
  const declaredBy = litige.declarePar === 'LOCATAIRE' ? 'Signalé par le locataire' : 'Ouvert par vous (Hôte)';

  // Animation de pulsation pour litiges en attente
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
      {/* Banner Supérieure */}
      <View style={styles.bannerHeader}>
        <View style={styles.iconWrapper}>
          {isEnAttente && <Animated.View style={[styles.pulseRing, { opacity: pulseAnim }]} />}
          <Gavel size={18} color="#F59E0B" />
        </View>

        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerTitle}>
            {isEnAttente
              ? "Dossier de Litige & Arbitrage Klef"
              : isFonde
              ? "Litige Fondé — Décision Validée"
              : "Litige Non Fondé — Clôturé"}
          </Text>
          <Text style={styles.bannerSub}>
            {isEnAttente
              ? "Les fonds restent gelés le temps de l'examen par les juristes Klef."
              : isFonde
              ? "Les pénalités ou indemnités ont été appliquées au dossier."
              : "Aucun manquement retenu. Les fonds ont été débloqués."}
          </Text>
        </View>
      </View>

      <View style={styles.bodyContent}>
        {/* Ligne Statut et Déclarant */}
        <View style={styles.statusRow}>
          <View style={styles.declarantChip}>
            <User size={12} color={colors.forest[300]} />
            <Text style={styles.declarantText}>{declaredBy}</Text>
          </View>

          <View
            style={[
              styles.statusPill,
              isEnAttente && styles.statusPillWarning,
              isFonde && styles.statusPillDanger,
              isNonFonde && styles.statusPillSuccess,
            ]}
          >
            {isEnAttente ? (
              <Clock size={11} color="#F59E0B" />
            ) : isFonde ? (
              <CheckCircle2 size={11} color="#EF4444" />
            ) : (
              <XCircle size={11} color="#34D399" />
            )}
            <Text
              style={[
                styles.statusText,
                isEnAttente && styles.statusTextWarning,
                isFonde && styles.statusTextDanger,
                isNonFonde && styles.statusTextSuccess,
              ]}
            >
              {isEnAttente ? 'En cours' : isFonde ? 'Fondé' : 'Non fondé'}
            </Text>
          </View>
        </View>

        {/* Motif du Litige */}
        <View style={styles.motifBox}>
          <AlertTriangle size={15} color="#F59E0B" />
          <View style={styles.motifTextCol}>
            <Text style={styles.motifLabelHeader}>MOTIF CONSTATÉ</Text>
            <Text style={styles.motifTitle}>{motifLabel}</Text>
          </View>
        </View>

        {/* Description détaillée */}
        {litige.description ? (
          <View style={styles.descriptionBox}>
            <Text style={styles.descLabel}>EXPLICATION DES FAITS :</Text>
            <Text style={styles.descText}>{litige.description}</Text>
          </View>
        ) : null}

        {/* Date d'ouverture */}
        <View style={styles.footerRow}>
          <Clock size={12} color={colors.forest[300]} />
          <Text style={styles.dateText}>Ouvert le {formatDateTime(litige.creeLe)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    overflow: 'hidden',
    ...shadows.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.inner,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  bannerTextCol: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#FBBF24',
  },
  bannerSub: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: 'rgba(253, 230, 138, 0.85)',
    lineHeight: 15,
  },
  bodyContent: {
    padding: 16,
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  declarantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  declarantText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[300],
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusPillWarning: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  statusPillDanger: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  statusPillSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },
  statusTextWarning: { color: '#FBBF24' },
  statusTextDanger: { color: '#FCA5A5' },
  statusTextSuccess: { color: '#34D399' },
  motifBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  motifTextCol: {
    flex: 1,
    gap: 2,
  },
  motifLabelHeader: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
    color: colors.forest[300],
    letterSpacing: 0.5,
  },
  motifTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[0],
  },
  descriptionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  descLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[300],
  },
  descText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[200],
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
  },
  dateText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
  },
});
