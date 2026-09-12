import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { TenantPriceDisplay } from './TenantPriceDisplay';

export interface ListingPhoto {
  url: string;
  estPrincipale?: boolean;
}

export interface TenantReservationLogement {
  id: string;
  titre: string;
  type: string;
  sousType?: string | null;
  ville: string;
  quartier?: string | null;
  photos?: ListingPhoto[];
}

export interface TenantReservationProprietaire {
  id: string;
  prenom?: string;
  nom?: string;
  photoUrl?: string;
  telephone?: string;
}

export interface TenantReservation {
  id: string;
  statut: 'PENDING' | 'PAID' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'EXPIRED' | string;
  dateDebut: string;
  dateFin: string;
  nbNuits?: number;
  nbPersonnes: number;
  totalLocataire: number;
  createdAt?: string;
  logement?: TenantReservationLogement;
  proprietaire?: TenantReservationProprietaire;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    Icon: React.ComponentType<{ size?: number; color?: string }>;
  }
> = {
  PENDING: {
    label: 'En attente',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
    Icon: Clock,
  },
  PAID: {
    label: 'Sous séquestre',
    bg: '#D1FAE5',
    text: '#065F46',
    border: '#A7F3D0',
    Icon: ShieldCheck,
  },
  CONFIRMED: {
    label: 'Confirmée',
    bg: '#DBEAFE',
    text: '#1E40AF',
    border: '#BFDBFE',
    Icon: CheckCircle2,
  },
  CHECKED_IN: {
    label: 'Séjour en cours',
    bg: '#D1FAE5',
    text: '#064E3B',
    border: '#34D399',
    Icon: Sparkles,
  },
  COMPLETED: {
    label: 'Terminée',
    bg: '#F1F5F9',
    text: '#334155',
    border: '#E2E8F0',
    Icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Annulée',
    bg: '#FFE4E6',
    text: '#9F1239',
    border: '#FECDD3',
    Icon: XCircle,
  },
  DISPUTED: {
    label: 'Litige',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FCA5A5',
    Icon: AlertCircle,
  },
  EXPIRED: {
    label: 'Expirée',
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#E5E7EB',
    Icon: Clock,
  },
};

function formatShortDate(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

function formatFcfa(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount || 0));
}

function calculateNights(from: string, to: string) {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round(
    (Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
      Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000,
  );
}

interface TenantReservationCardProps {
  reservation: TenantReservation;
  onPress?: () => void;
}

export function TenantReservationCard({ reservation, onPress }: TenantReservationCardProps) {
  const cfg = STATUS_CONFIG[reservation.statut] || STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.Icon;

  const photoUrl = React.useMemo(() => {
    if (reservation.logement?.photos && reservation.logement.photos.length > 0) {
      const main = reservation.logement.photos.find((p) => p.estPrincipale) || reservation.logement.photos[0];
      if (typeof main === 'string') return main;
      return (main as any)?.url || (main as any)?.uri || '';
    }
    return '';
  }, [reservation.logement?.photos]);

  const lieu = [reservation.logement?.ville, reservation.logement?.quartier].filter(Boolean).join(', ');
  const nbNuits = reservation.nbNuits ?? calculateNights(reservation.dateDebut, reservation.dateFin);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/reservation/${reservation.id}` as any);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={styles.cardContainer}
    >
      {/* Top Bar : Badge de statut + Référence */}
      <View style={styles.topBar}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
          <StatusIcon size={12} color={cfg.text} />
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>

        <Text style={styles.refText}>
          RÉF #{reservation.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      {/* Zone Milieu : Image + Infos Logement */}
      <View style={styles.middleRow}>
        <View style={styles.imageContainer}>
          {photoUrl ? (
            <ExpoImage
              source={{ uri: photoUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Building2 size={24} color={colors.neutral[400]} />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.titleText} numberOfLines={2}>
            {reservation.logement?.titre || 'Séjour réservé'}
          </Text>

          {lieu ? (
            <View style={styles.locationRow}>
              <MapPin size={12} color={colors.forest[600]} strokeWidth={2.5} />
              <Text style={styles.locationText} numberOfLines={1}>
                {lieu}
              </Text>
            </View>
          ) : null}

          {/* Dates & Voyageurs */}
          <View style={styles.datesRow}>
            <Calendar size={12} color={colors.neutral[500]} />
            <Text style={styles.datesText}>
              {formatShortDate(reservation.dateDebut)} → {formatShortDate(reservation.dateFin)} ({nbNuits} nuit{nbNuits > 1 ? 's' : ''})
            </Text>
          </View>

          <View style={styles.guestsRow}>
            <Users size={12} color={colors.neutral[500]} />
            <Text style={styles.guestsText}>
              {reservation.nbPersonnes} voyageur{reservation.nbPersonnes > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Row : Montant sous séquestre + Button */}
      <View style={styles.bottomRow}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total sous séquestre</Text>
          <View style={styles.priceValueRow}>
            <Text style={styles.priceAmount}>{formatFcfa(reservation.totalLocataire)}</Text>
            <Text style={styles.priceCurrency}>FCFA</Text>
          </View>
        </View>

        <View style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Voir le séjour</Text>
          <ChevronRight size={14} color={colors.forest[700]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    gap: 12,
    ...shadows.sm,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
  },
  refText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 0.3,
  },

  middleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.neutral[100],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
  },

  infoContainer: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[950],
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.forest[700],
    flex: 1,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  datesText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },
  guestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guestsText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  priceContainer: {
    gap: 1,
  },
  priceLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[900],
    letterSpacing: -0.3,
  },
  priceCurrency: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  actionBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[700],
  },
});
