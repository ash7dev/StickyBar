import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Wallet } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';

interface MobileOwnerFinancialBreakdownCardProps {
  reservation: ReservationDetail;
}

export function MobileOwnerFinancialBreakdownCard({ reservation }: MobileOwnerFinancialBreakdownCardProps) {
  const {
    prixBase,
    nbNuits,
    supplementPersonnes = 0,
    reductionNuits = 0,
    totalLocataire,
    tauxCommission,
    montantCommission,
    netProprietaire,
  } = reservation;

  const rawTaux = Number(tauxCommission ?? 0.07);
  const commissionPct = rawTaux < 1 ? Math.round(rawTaux * 100) : Math.round(rawTaux);
  const ownPct = Math.max(0, 100 - commissionPct);

  const formatPrice = (val: number) => {
    return val.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  };

  const ligneMontants: {
    label: string;
    value: string;
    kind?: 'total' | 'deduction' | 'net';
  }[] = [
    {
      label: 'Prix de base',
      value: `${formatPrice(prixBase * nbNuits)}`,
    },
    ...(supplementPersonnes > 0
      ? [
          {
            label: 'Supplément voyageurs',
            value: `+${formatPrice(supplementPersonnes)}`,
          },
        ]
      : []),
    {
      label: `Réduction séjour (${nbNuits} ${nbNuits > 1 ? 'nuits' : 'nuit'})`,
      value: Number(reductionNuits) > 0 ? `−${formatPrice(reductionNuits)}` : '—',
    },
    {
      label: 'Total payé par le locataire',
      value: `${formatPrice(totalLocataire)}`,
      kind: 'total',
    },
    {
      label: `Commission Klef (${commissionPct} %)`,
      value: `−${formatPrice(montantCommission)}`,
      kind: 'deduction',
    },
    {
      label: 'Votre revenu net',
      value: `${formatPrice(netProprietaire)}`,
      kind: 'net',
    },
  ];

  return (
    <View style={styles.cardContainer}>
      {/* En-tête (Wallet icon + Titre + Sous-titre) */}
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <Wallet size={20} color={colors.lime[400]} />
        </View>
        <View style={styles.headerTitleCol}>
          <Text style={styles.cardTitle}>Détail financier</Text>
          <Text style={styles.cardSubtitle}>Répartition du montant réglé</Text>
        </View>
      </View>

      {/* Liste des lignes de ventilation */}
      <View style={styles.breakdownList}>
        {ligneMontants.map((row, index) => {
          const isTotal = row.kind === 'total';
          const isDeduction = row.kind === 'deduction';
          const isNet = row.kind === 'net';
          const hasTopBorder = isTotal || isDeduction || isNet;

          return (
            <View
              key={index}
              style={[
                styles.rowItem,
                hasTopBorder && styles.rowWithBorder,
              ]}
            >
              <Text
                style={[
                  styles.itemLabel,
                  isNet && styles.itemLabelNet,
                  isTotal && styles.itemLabelTotal,
                ]}
              >
                {row.label}
              </Text>

              {isNet ? (
                /* Badge Lime pour le revenu net hôte */
                <View style={styles.netPillBadge}>
                  <Text style={styles.netPillText}>{row.value}</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.itemVal,
                    isDeduction && styles.itemValDeduction,
                    isTotal && styles.itemValTotal,
                  ]}
                >
                  {row.value}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Barre de répartition des pourcentages (Votre part vs Klef) */}
      <View style={styles.barSection}>
        <View style={styles.barLabelsRow}>
          <Text style={styles.barLabelOwner}>VOTRE PART — {ownPct} %</Text>
          <Text style={styles.barLabelPlatform}>COMMISSION KLEF — {commissionPct} %</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFillOwner, { width: `${ownPct}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
    gap: 18,
  },

  /* En-tête */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.forest[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: '#0F172A',
  },
  cardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  /* Liste des ventilations */
  breakdownList: {
    gap: 4,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowWithBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    marginTop: 6,
  },

  /* Labels */
  itemLabel: {
    fontFamily: typography.fontBody,
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  itemLabelTotal: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: '#334155',
  },
  itemLabelNet: {
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    color: '#0F172A',
  },

  /* Valeurs */
  itemVal: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
    color: '#0F172A',
    fontVariant: ['tabular-nums'],
  },
  itemValTotal: {
    fontFamily: typography.fontBodyBold,
    fontSize: 15,
    color: '#0F172A',
  },
  itemValDeduction: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 14,
    color: '#64748B',
  },

  /* Badge Lime pour Revenu Net */
  netPillBadge: {
    backgroundColor: colors.lime[400],
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  netPillText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },

  /* Barre de pourcentage */
  barSection: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 18,
    marginTop: 4,
  },
  barLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  barLabelOwner: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.forest[950],
  },
  barLabelPlatform: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#64748B',
  },
  barTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[950],
    overflow: 'hidden',
  },
  barFillOwner: {
    height: '100%',
    backgroundColor: colors.lime[400],
    borderRadius: radius.pill,
  },
});
