import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Clock, LogIn, LogOut, MapPin, Info } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { ReservationDetail } from '../../types/reservation-detail.types';

function dateLong(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

interface MobileCheckInTimeCardProps {
  res: ReservationDetail;
}

export function MobileCheckInTimeCard({ res }: MobileCheckInTimeCardProps) {
  // Masquage si non confirmée par l'hôte ou si le logement est manquant (aligné 1:1 avec le web)
  if (!res.confirmeeLe || !res.logement) return null;

  // Masquer si le séjour a démarré, si le checkin a été fait, s'il est terminé, annulé ou si un litige est actif
  const isInactiveOrLocked =
    ['CHECKED_IN', 'CHECKED_OUT', 'COMPLETED', 'TERMINEE', 'ANNULEE', 'CANCELLED', 'REFUNDED', 'DISPUTED', 'EXPIRED'].includes(res.statut) ||
    !!res.litige ||
    !!res.checkinLocataireLe;

  if (isInactiveOrLocked) return null;

  const adresse = [res.logement?.adresse, res.logement?.quartier, res.logement?.ville]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.card}>
      {/* En-tête */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Clock size={16} color={colors.lime[300]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Horaires & Accès au séjour</Text>
          <Text style={styles.headerSubtitle}>Créneau d'accueil validé par votre hôte</Text>
        </View>
      </View>

      {/* Grille Arrivée & Départ */}
      <View style={styles.gridRow}>
        <View style={styles.timeBlock}>
          <View style={styles.timeLabelRow}>
            <LogIn size={13} color={colors.lime[300]} />
            <Text style={styles.timeLabel}>ARRIVÉE</Text>
          </View>
          <Text style={styles.timeDate}>{dateLong(res.dateDebut)}</Text>
          <Text style={styles.timeValue}>À partir de 14:00</Text>
        </View>

        <View style={styles.timeBlock}>
          <View style={styles.timeLabelRow}>
            <LogOut size={13} color={colors.text.inverseMuted} />
            <Text style={styles.timeLabel}>DÉPART</Text>
          </View>
          <Text style={styles.timeDate}>{dateLong(res.dateFin)}</Text>
          <Text style={styles.timeValue}>Avant 12:00</Text>
        </View>
      </View>

      {/* Adresse du rendez-vous */}
      {adresse ? (
        <View style={styles.addressBox}>
          <MapPin size={14} color={colors.lime[300]} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Adresse du rendez-vous</Text>
            <Text style={styles.addressValue} numberOfLines={2}>
              {adresse}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Conseil d'arrivée */}
      <View style={styles.adviceBox}>
        <Info size={14} color="#FBBF24" style={{ marginTop: 2 }} />
        <Text style={styles.adviceText}>
          <Text style={styles.adviceBold}>Accueil sur place : </Text>
          Votre hôte vous accueille à l'heure convenue. En cas de retard, prévenez-le par téléphone avant l'heure prévue.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...shadows.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.inverse,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.text.inverseDisplay,
  },
  headerSubtitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.text.inverseMuted,
    marginTop: 1,
  },

  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeBlock: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.inner,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeLabel: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.text.inverseMuted,
    letterSpacing: 0.8,
  },
  timeDate: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.text.inverseMuted,
  },
  timeValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.text.inverseDisplay,
    marginTop: 2,
  },

  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  addressLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10,
    color: colors.text.inverseMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressValue: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.text.inverse,
    marginTop: 2,
    lineHeight: 16,
  },

  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.18)',
  },
  adviceText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.text.inverseMuted,
    flex: 1,
    lineHeight: 16,
  },
  adviceBold: {
    fontFamily: typography.fontBodySemiBold,
    color: '#FBBF24',
  },
});
