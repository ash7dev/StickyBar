import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Tag, ShieldCheck, Coins, Sparkles, KeyRound, Users, TrendingDown } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import type { PaymentTiming } from './MobileCheckoutPaymentSection';

interface MobileCheckoutPriceDetailCardProps {
  prixParNuit: number;
  nights: number;
  sousTotalNuits: number;
  supplementPersonnes?: number;
  nbPersonnes?: number;
  reductionNuits?: number;
  typePaiement: PaymentTiming;
  acomptePct?: number;
  useCoins: boolean;
  coinsDeducted: number;
  totalFinal: number;
  aDebiter: number;
}

function formatFcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export function MobileCheckoutPriceDetailCard({
  prixParNuit,
  nights,
  sousTotalNuits,
  supplementPersonnes = 0,
  nbPersonnes = 1,
  reductionNuits = 0,
  typePaiement,
  acomptePct = 30,
  useCoins,
  coinsDeducted,
  totalFinal,
  aDebiter,
}: MobileCheckoutPriceDetailCardProps) {
  const soldeRestant = Math.max(0, totalFinal - aDebiter);

  return (
    <View style={styles.card}>
      {/* ── En-tête de section ─────────────────────────────────────── */}
      <View style={styles.cardHeader}>
        <View style={styles.headerIconCircle}>
          <Tag size={16} color={colors.forest[700]} />
        </View>
        <Text style={styles.cardTitle}>Détail du prix</Text>
      </View>

      {/* ── Contenu Tarifaire ───────────────────────────────────────── */}
      <View style={styles.priceRowsStack}>
        {/* Nuits × Tarif de base */}
        <View style={styles.row}>
          <Text style={styles.label}>
            {formatFcfa(prixParNuit)} FCFA × {nights} nuit{nights > 1 ? 's' : ''}
          </Text>
          <Text style={styles.value}>{formatFcfa(sousTotalNuits)} FCFA</Text>
        </View>

        {/* Supplément voyageurs (si applicable) */}
        {supplementPersonnes > 0 && (
          <View style={styles.row}>
            <View style={styles.labelGroupWithIcon}>
              <Users size={14} color={colors.neutral[600]} />
              <Text style={styles.label}>
                Supplément ({nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''})
              </Text>
            </View>
            <Text style={styles.value}>+ {formatFcfa(supplementPersonnes)} FCFA</Text>
          </View>
        )}

        {/* Réduction durée / séjour long (si applicable) */}
        {reductionNuits > 0 && (
          <View style={styles.discountRow}>
            <View style={styles.discountLabelRow}>
              <TrendingDown size={14} color={colors.success[700]} />
              <Text style={styles.discountLabel}>Réduction séjour long</Text>
            </View>
            <Text style={styles.discountValue}>- {formatFcfa(reductionNuits)} FCFA</Text>
          </View>
        )}

        {/* Déduction Klef Coins (si activée) */}
        {useCoins && coinsDeducted > 0 && (
          <View style={styles.coinsRow}>
            <View style={styles.coinsLabelRow}>
              <Coins size={14} color="#B45309" />
              <Text style={styles.coinsLabel}>Réduction Klef Coins</Text>
            </View>
            <Text style={styles.coinsValue}>- {formatFcfa(coinsDeducted)} FCFA</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* Total du séjour */}
        <View style={styles.rowTotal}>
          <Text style={styles.labelTotal}>Total du séjour</Text>
          <Text style={styles.valueTotal}>{formatFcfa(totalFinal)} FCFA</Text>
        </View>

        {/* ── Encadré Acompte & Solde à l'arrivée ──────────────────────── */}
        {typePaiement === 'DEPOSIT' ? (
          <View style={styles.depositBox}>
            <View style={styles.depositHeaderRow}>
              <Sparkles size={14} color={colors.forest[700]} />
              <Text style={styles.depositBadgeTitle}>
                Paiement par acompte ({acomptePct}%)
              </Text>
            </View>

            <View style={styles.depositDetailRow}>
              <Text style={styles.depositLabel}>À régler aujourd'hui</Text>
              <Text style={styles.depositAmountHighlight}>
                {formatFcfa(aDebiter)} FCFA
              </Text>
            </View>

            {soldeRestant > 0 && (
              <View style={styles.soldeRestantRow}>
                <View style={styles.soldeLeftGroup}>
                  <KeyRound size={13} color={colors.neutral[500]} />
                  <Text style={styles.soldeLabel}>Solde à la remise des clés</Text>
                </View>
                <Text style={styles.soldeValue}>{formatFcfa(soldeRestant)} FCFA</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.fullPaymentNotice}>
            <Text style={styles.fullPaymentText}>
              Réservation payée en totalité aujourd'hui. Aucun frais supplémentaire sur place.
            </Text>
          </View>
        )}
      </View>

      {/* ── Sceau de sécurité Klef ───────────────────────────────────── */}
      <View style={styles.trustBadge}>
        <ShieldCheck size={15} color={colors.forest[700]} style={styles.trustIcon} />
        <Text style={styles.trustText}>
          Klef conserve les fonds en séquestre jusqu'à votre arrivée dans le logement.
        </Text>
      </View>
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
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  priceRowsStack: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
  },
  labelGroupWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },

  // Discount Row (Séjour long)
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.success[50],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(46, 158, 82, 0.20)',
  },
  discountLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.success[700],
  },
  discountValue: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12.5,
    color: colors.success[700],
  },

  // Coins Row
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  coinsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinsLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: '#B45309',
  },
  coinsValue: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12.5,
    color: '#B45309',
  },

  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },

  // Total
  rowTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  labelTotal: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  valueTotal: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.forest[950],
  },

  // Encadré Acompte
  depositBox: {
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    borderRadius: radius.inner,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  depositHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  depositBadgeTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[800],
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  depositDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  depositLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12.5,
    color: colors.forest[900],
  },
  depositAmountHighlight: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  soldeRestantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.forest[100],
  },
  soldeLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soldeLabel: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
  },
  soldeValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[900],
  },

  fullPaymentNotice: {
    backgroundColor: colors.neutral[50],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginTop: 2,
  },
  fullPaymentText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[600],
    textAlign: 'center',
  },

  // Sceau de sécurité
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.forest[50],
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.forest[100],
    marginTop: 4,
  },
  trustIcon: {
    marginTop: 1,
  },
  trustText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.forest[900],
    lineHeight: 16,
  },
});
