import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronRight,
  ImageOff,
  User,
} from 'lucide-react-native';
import { colors, typography } from '../../../../shared/theme/tokens';

export interface OwnerReservationItem {
  id: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  nbNuits?: number;
  totalLocataire?: number;
  netProprietaire?: number;
  logement?: {
    id?: string;
    titre?: string;
    ville?: string;
    quartier?: string;
    photos?: Array<{ url: string; estPrincipale?: boolean }>;
  };
  locataire?: {
    id?: string;
    prenom?: string;
    nom?: string;
    telephone?: string;
    avatarUrl?: string;
  };
}

interface Props {
  reservation: OwnerReservationItem;
  onConfirm?: (id: string) => Promise<void> | void;
  onCancel?: (id: string, reason: string) => Promise<void> | void;
}

const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PAID: { label: 'À décider', bg: '#FEF9C3', text: '#854D0E', dot: '#EAB308' },
  PENDING: { label: 'En attente', bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  CONFIRMED: { label: 'Confirmée', bg: '#ECFDF5', text: '#065F46', dot: '#10B981' },
  CHECKED_IN: { label: 'En séjour', bg: '#D1FAE5', text: '#064E3B', dot: '#059669' },
  COMPLETED: { label: 'Terminée', bg: colors.neutral[100], text: colors.neutral[700], dot: colors.neutral[400] },
  DISPUTED: { label: 'Litige', bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
  CANCELLED: { label: 'Annulée', bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  EXPIRED: { label: 'Expirée', bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
};

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function formatFcfa(amount?: number | string | null): string {
  if (amount == null) return '0';
  return Math.round(Number(amount)).toLocaleString('fr-FR');
}

export function MobileOwnerReservationCard({
  reservation,
}: Props) {
  const router = useRouter();

  const statusCfg = STATUT_CONFIG[reservation.statut] ?? STATUT_CONFIG.COMPLETED;

  const photos = reservation.logement?.photos ?? [];
  const mainPhoto = photos.find((p) => p.estPrincipale)?.url ?? photos[0]?.url;

  const prenom = reservation.locataire?.prenom ?? '';
  const nom = reservation.locataire?.nom ?? '';
  const guestName = `${prenom} ${nom}`.trim() || 'Locataire';

  const dateDeb = new Date(reservation.dateDebut);
  const dateFin = new Date(reservation.dateFin);
  const nuits = reservation.nbNuits
    ?? Math.max(1, Math.round((dateFin.getTime() - dateDeb.getTime()) / 86_400_000));

  const hostRevenue = reservation.netProprietaire ?? reservation.totalLocataire ?? 0;

  const handlePressCard = () => {
    router.push(`/(owner)/reservations/${reservation.id}` as any);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onPress={handlePressCard}
        activeOpacity={0.85}
        style={styles.cardTouchable}
      >
        {/* ── Top Bar: Status Badge + City/Quartier ───────────────── */}
        <View style={styles.topHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>

          <ChevronRight size={18} color={colors.neutral[400]} />
        </View>

        {/* ── Main Content: Image & Listing Title ──────────────────── */}
        <View style={styles.contentRow}>
          {mainPhoto ? (
            <Image source={{ uri: mainPhoto }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailFallback]}>
              <ImageOff size={20} color={colors.neutral[400]} />
            </View>
          )}

          <View style={styles.infoCol}>
            <Text style={styles.listingTitle} numberOfLines={2}>
              {reservation.logement?.titre ?? 'Réservation Logement'}
            </Text>

            {/* Guest details */}
            <View style={styles.guestRow}>
              <User size={13} color={colors.forest[700]} />
              <Text style={styles.guestName} numberOfLines={1}>
                {guestName}
              </Text>
            </View>

            {/* Dates & Duration */}
            <View style={styles.datesRow}>
              <Calendar size={13} color={colors.neutral[500]} />
              <Text style={styles.datesText}>
                {formatDateShort(reservation.dateDebut)} → {formatDateShort(reservation.dateFin)}
              </Text>
              <Text style={styles.durationChip}>· {nuits} nuit{nuits > 1 ? 's' : ''}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer: Revenue Amount Highlight ───────────────────── */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.revenueLabel}>Revenu hôte net</Text>
            <View style={styles.revenuePriceRow}>
              <Text style={styles.revenueAmount}>{formatFcfa(hostRevenue)}</Text>
              <Text style={styles.revenueCurrency}>FCFA</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    shadowColor: '#141812',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  cardTouchable: {
    padding: 16,
    gap: 12,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
  },
  thumbnailFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 5,
  },
  listingTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[950],
    lineHeight: 19,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9,
    color: colors.forest[800],
  },
  guestName: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
    flex: 1,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  datesText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },
  durationChip: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.neutral[400],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  revenueLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.neutral[500],
    letterSpacing: 0.5,
  },
  revenuePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  revenueAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
    letterSpacing: -0.3,
  },
  revenueCurrency: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },
});
