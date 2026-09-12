import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Calendar, Moon, Wallet, Building2, User, Clock } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';

interface MobileOwnerReservationHeroCardProps {
  reservation: ReservationDetail;
}

export function MobileOwnerReservationHeroCard({ reservation }: MobileOwnerReservationHeroCardProps) {
  const { statut, id, dateDebut, dateFin, nbNuits, netProprietaire, logement, locataire, checkinHeure, checkoutHeureInput } = reservation;

  const locataireName = locataire
    ? `${locataire.prenom || ''} ${locataire.nom || ''}`.trim() || locataire.email || 'Voyageur'
    : 'Voyageur';

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getHourOnly = (dateStr?: string, heureStr?: string | null) => {
    if (heureStr) return heureStr;
    if (!dateStr) return '14:00';
    try {
      const d = new Date(dateStr);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    } catch {
      return '14:00';
    }
  };

  const formatPrice = (val: number) => {
    return (val || 0).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  };

  const getStatusBadge = () => {
    switch (statut) {
      case 'PENDING':
        return { label: 'En attente de paiement', bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.3)' };
      case 'PAID':
        return { label: 'Paiement sous séquestre', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' };
      case 'CONFIRMED':
        return { label: 'Check-in à venir', bg: 'rgba(211, 242, 110, 0.15)', text: colors.lime[300], border: 'rgba(211, 242, 110, 0.3)' };
      case 'CHECKED_IN':
        return { label: 'Séjour en cours', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'COMPLETED':
        return { label: 'Terminé & Payé', bg: 'rgba(255, 255, 255, 0.1)', text: colors.neutral[200], border: 'rgba(255, 255, 255, 0.18)' };
      case 'DISPUTED':
        return { label: 'Litige actif', bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'CANCELLED':
        return { label: 'Annulé', bg: 'rgba(255, 255, 255, 0.08)', text: colors.neutral[400], border: 'rgba(255, 255, 255, 0.1)' };
      default:
        return { label: statut, bg: 'rgba(255, 255, 255, 0.1)', text: colors.neutral[200], border: 'rgba(255, 255, 255, 0.15)' };
    }
  };

  const statusBadge = getStatusBadge();
  const mainImage = logement?.photos?.[0]?.url;
  const refShort = id ? `RÉF #${id.slice(0, 8).toUpperCase()}` : 'RÉF #---';

  return (
    <View style={styles.cardContainer}>
      {/* Badge statut et référence */}
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg, borderColor: statusBadge.border }]}>
          <View style={[styles.dot, { backgroundColor: statusBadge.text }]} />
          <Text style={[styles.statusText, { color: statusBadge.text }]}>{statusBadge.label}</Text>
        </View>
        <Text style={styles.refText}>{refShort}</Text>
      </View>

      {/* Info Logement & Voyageur */}
      <View style={styles.propertyRow}>
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.propertyImg} />
        ) : (
          <View style={styles.propertyImgPlaceholder}>
            <Building2 size={24} color={colors.forest[300]} />
          </View>
        )}
        <View style={styles.propertyTextCol}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {logement?.titre || 'Logement non spécifié'}
          </Text>
          <Text style={styles.propertyLocation} numberOfLines={1}>
            {logement?.ville ? `${logement.ville}${logement.quartier ? ` · ${logement.quartier}` : ''}` : 'Localisation indisponible'}
          </Text>
          <View style={styles.guestBadgeRow}>
            <User size={12} color={colors.lime[400]} />
            <Text style={styles.guestBadgeText} numberOfLines={1}>
              Voyageur : <Text style={styles.guestBadgeName}>{locataireName}</Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Grid Dates & Heures ultra aéré (Sans débordement) */}
      <View style={styles.datesGrid}>
        {/* Colonne Arrivée */}
        <View style={styles.dateCol}>
          <Text style={styles.dateLabel} numberOfLines={1}>Arrivée (Début)</Text>
          <View style={styles.dateValRow}>
            <Calendar size={12} color={colors.lime[400]} />
            <Text style={styles.dateValText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {formatDateShort(dateDebut)}
            </Text>
          </View>
          <View style={styles.timeBadgeRow}>
            <Clock size={11} color={colors.lime[300]} />
            <Text style={styles.timeValText} numberOfLines={1}>
              à {getHourOnly(dateDebut, checkinHeure)}
            </Text>
          </View>
        </View>

        {/* Pilule centrale Durée */}
        <View style={styles.durationPillCol}>
          <View style={styles.durationPill}>
            <Moon size={11} color={colors.lime[300]} />
            <Text style={styles.durationText}>{nbNuits} {nbNuits > 1 ? 'nuits' : 'nuit'}</Text>
          </View>
        </View>

        {/* Colonne Départ */}
        <View style={styles.dateColRight}>
          <Text style={styles.dateLabelRight} numberOfLines={1}>Départ (Fin)</Text>
          <View style={styles.dateValRowRight}>
            <Calendar size={12} color={colors.lime[400]} />
            <Text style={styles.dateValText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {formatDateShort(dateFin)}
            </Text>
          </View>
          <View style={styles.timeBadgeRowRight}>
            <Clock size={11} color={colors.lime[300]} />
            <Text style={styles.timeValText} numberOfLines={1}>
              à {getHourOnly(dateFin, checkoutHeureInput)}
            </Text>
          </View>
        </View>
      </View>

      {/* Highlight Revenu Net Propriétaire */}
      <View style={styles.earningsBanner}>
        <View style={styles.earningsIconBadge}>
          <Wallet size={18} color={colors.lime[400]} />
        </View>
        <View style={styles.earningsTextCol}>
          <Text style={styles.earningsLabel}>Votre revenu net hôte</Text>
          <Text style={styles.earningsAmount}>{formatPrice(netProprietaire)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },
  refText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
    letterSpacing: 0.5,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  propertyImg: {
    width: 54,
    height: 54,
    borderRadius: radius.inner,
  },
  propertyImgPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyTextCol: {
    flex: 1,
    gap: 2,
  },
  propertyTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.neutral[0],
  },
  propertyLocation: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[300],
  },
  guestBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  guestBadgeText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[300],
  },
  guestBadgeName: {
    fontFamily: typography.fontBodyBold,
    color: colors.lime[300],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  datesGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateCol: {
    flex: 1,
    gap: 3,
  },
  dateColRight: {
    flex: 1,
    gap: 3,
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
  },
  dateLabelRight: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
    textAlign: 'right',
  },
  dateValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateValRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'flex-end',
  },
  dateValText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.neutral[0],
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  timeBadgeRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
    justifyContent: 'flex-end',
  },
  timeValText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[300],
  },
  durationPillCol: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  durationText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[300],
  },
  earningsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 242, 110, 0.08)',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.2)',
    gap: 12,
  },
  earningsIconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(211, 242, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsTextCol: {
    flex: 1,
    gap: 2,
  },
  earningsLabel: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.lime[300],
  },
  earningsAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.lime[400],
  },
});
