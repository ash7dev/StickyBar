import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CalendarCheck, ChevronRight, User, Clock, Users, ArrowUpRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

export interface ReservationItemData {
  id: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  nombreVoyageurs?: number;
  totalLocataire?: number;
  netProprietaire?: number;
  locataire?: {
    nom?: string;
    prenom?: string;
    photoUrl?: string;
  };
}

export interface MobileOwnerDetailReservationsProps {
  listingId: string;
  reservations?: ReservationItemData[];
}

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

const fcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

const formatDateFr = (isoStr: string) => {
  if (!isoStr) return '';
  const parts = isoStr.split('T')[0].split('-');
  if (parts.length !== 3) return isoStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
};

const calcNights = (d1: string, d2: string) => {
  if (!d1 || !d2) return 0;
  const t1 = new Date(d1.split('T')[0]).getTime();
  const t2 = new Date(d2.split('T')[0]).getTime();
  const diff = Math.max(0, t2 - t1);
  return Math.round(diff / (1000 * 60 * 60 * 24));
};

export function MobileOwnerDetailReservations({
  listingId,
  reservations = [],
}: MobileOwnerDetailReservationsProps) {
  const router = useRouter();

  const getStatusBadge = (statut: string) => {
    switch (statut?.toUpperCase()) {
      case 'CONFIRMEE':
      case 'CONFIRMED':
        return { label: 'Confirmée', bg: colors.forest[50], text: colors.forest[800], border: colors.forest[200] };
      case 'EN_ATTENTE':
      case 'PENDING':
        return { label: 'En attente', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
      case 'EN_COURS':
      case 'IN_PROGRESS':
        return { label: 'En cours', bg: colors.lime[100], text: colors.forest[950], border: colors.lime[300] };
      case 'TERMINEE':
      case 'COMPLETED':
        return { label: 'Terminée', bg: colors.neutral[100], text: colors.neutral[700], border: colors.neutral[300] };
      default:
        return { label: statut || 'Réservée', bg: colors.neutral[100], text: colors.neutral[700], border: colors.neutral[200] };
    }
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.markerCircle}>
            <CalendarCheck size={16} color={colors.forest[800]} />
          </View>
          <View style={styles.titleTextContainer}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Réservations Récentes
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {reservations.length > 0
                ? `${reservations.length} séjour${reservations.length > 1 ? 's' : ''} associé${reservations.length > 1 ? 's' : ''}`
                : 'Historique des séjours'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push(`/(owner)/reservations` as any);
          }}
          style={styles.allBtn}
        >
          <Text style={styles.allBtnText}>Voir tout</Text>
          <ChevronRight size={14} color={colors.forest[800]} />
        </TouchableOpacity>
      </View>

      {/* List Content */}
      {reservations.length > 0 ? (
        <View style={styles.list}>
          {reservations.slice(0, 4).map((res) => {
            const statusCfg = getStatusBadge(res.statut);
            const locataireName =
              [res.locataire?.prenom, res.locataire?.nom].filter(Boolean).join(' ') || 'Voyageur Klef';
            
            const initials = [res.locataire?.prenom?.[0], res.locataire?.nom?.[0]]
              .filter(Boolean)
              .join('')
              .toUpperCase() || 'VK';

            const price = res.netProprietaire || res.totalLocataire || 0;
            const nights = calcNights(res.dateDebut, res.dateFin);

            return (
              <TouchableOpacity
                key={res.id}
                activeOpacity={0.75}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push({
                    pathname: '/(owner)/reservations/[id]' as any,
                    params: { id: res.id },
                  });
                }}
                style={styles.reservationItem}
              >
                <View style={styles.itemMainRow}>
                  {/* Avatar with Initials */}
                  <View style={styles.avatarCircle}>
                    <Text style={styles.initialsText}>{initials}</Text>
                  </View>

                  {/* Locataire & Dates */}
                  <View style={styles.itemInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.locataireName} numberOfLines={1}>
                        {locataireName}
                      </Text>
                      <ArrowUpRight size={13} color={colors.neutral[400]} />
                    </View>

                    <Text style={styles.datesText} numberOfLines={1}>
                      {formatDateFr(res.dateDebut)} → {formatDateFr(res.dateFin)}
                      {nights > 0 ? ` (${nights} nuit${nights > 1 ? 's' : ''})` : ''}
                    </Text>

                    {res.nombreVoyageurs ? (
                      <View style={styles.travelersRow}>
                        <Users size={11} color={colors.neutral[500]} />
                        <Text style={styles.travelersText}>
                          {res.nombreVoyageurs} voyageur{res.nombreVoyageurs > 1 ? 's' : ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Price & Status */}
                  <View style={styles.itemRight}>
                    {price > 0 ? (
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceAmount}>{fcfa(price)}</Text>
                        <Text style={styles.priceCurrency}>FCFA</Text>
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusCfg.bg, borderColor: statusCfg.border },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusCfg.text }]}>
                        {statusCfg.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Clock size={20} color={colors.neutral[400]} />
          </View>
          <Text style={styles.emptyTitle}>Aucune réservation récente</Text>
          <Text style={styles.emptySubtitle}>
            Dès que des voyageurs réserveront ce bien, leurs séjours s'afficheront ici.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 6,
  },
  markerCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  cardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  allBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: colors.forest[50],
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  allBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[800],
  },

  // List
  list: {
    gap: 8,
  },
  reservationItem: {
    backgroundColor: colors.neutral[50],
    padding: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[950],
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  initialsText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.lime[400],
  },
  itemInfo: {
    gap: 3,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locataireName: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  datesText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.neutral[600],
  },
  travelersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  travelersText: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  priceAmount: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  priceCurrency: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[500],
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  emptySubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 16,
  },
});
