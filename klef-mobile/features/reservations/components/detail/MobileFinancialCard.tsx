import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Banknote, Shield, CalendarCheck, CalendarX, Users, Moon } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../shared/theme/tokens';
import { ReservationDetail } from '../../types/reservation-detail.types';

function formatFcfa(amount?: number | null) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0';
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount));
}

function dateLong(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface MobileFinancialCardProps {
  res: ReservationDetail;
}

export function MobileFinancialCard({ res }: MobileFinancialCardProps) {
  const total = Number(res.totalLocataire) || 0;
  const nuits = Number(res.nbNuits) || 0;
  const supplement = Number(res.supplementPersonnes) || 0;
  const reduction = Number(res.reductionNuits) || 0;

  const montantAcompte = Number(res.montantAcompte) || 0;
  const rawSolde = Number(res.montantSoldeRestant) || 0;
  const isDeposit =
    res.typePaiement === 'DEPOSIT' ||
    rawSolde > 0 ||
    (montantAcompte > 0 && total > 0 && montantAcompte < total);

  const montantRegleEnLigne = res.paiement?.montant
    ? Number(res.paiement.montant)
    : isDeposit
    ? montantAcompte
    : total;
  const soldeRestant = isDeposit
    ? rawSolde > 0
      ? rawSolde
      : Math.max(0, total - montantRegleEnLigne)
    : 0;

  const pctAcompte = total > 0 ? Math.min(100, Math.round((montantRegleEnLigne / total) * 100)) : 100;
  const pctSolde = 100 - pctAcompte;

  const hebergementTotal = total > 0 ? total - supplement + reduction : (res.totalBase || 0);
  const moyenneParNuit = nuits > 0 ? Math.round(hebergementTotal / nuits) : null;
  const hasBreakdown = hebergementTotal > 0;

  const details = [
    { icon: CalendarCheck, label: 'Arrivée', value: dateLong(res.dateDebut) },
    { icon: CalendarX, label: 'Départ', value: dateLong(res.dateFin) },
    { icon: Moon, label: 'Durée', value: `${nuits} nuit${nuits > 1 ? 's' : ''}` },
    { icon: Users, label: 'Voyageurs', value: `${res.nbPersonnes} personne${res.nbPersonnes > 1 ? 's' : ''}` },
  ];

  return (
    <View style={styles.card}>
      {/* En-tête avec icône surbrillante */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Banknote size={16} color={colors.lime[400]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Récapitulatif du séjour</Text>
          {isDeposit && (
            <Text style={styles.headerSubtitle}>Formule Acompte en ligne + Solde le jour J</Text>
          )}
        </View>
      </View>

      {/* Grille de 4 détails (Arrivée, Départ, Durée, Voyageurs) */}
      <View style={styles.detailsGrid}>
        {details.map(({ icon: Icon, label, value }) => (
          <View key={label} style={styles.detailTile}>
            <Icon size={14} color="#64748B" style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel} numberOfLines={1}>{label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Indicateur prix par nuit */}
      {moyenneParNuit !== null && moyenneParNuit > 0 && (
        <View style={styles.perNightBanner}>
          <Moon size={14} color={colors.forest[700]} />
          <Text style={styles.perNightText} numberOfLines={1}>
            <Text style={styles.perNightHighlight}>{formatFcfa(moyenneParNuit)} FCFA</Text>
            {' '}par nuit en moyenne
          </Text>
        </View>
      )}

      {/* Barre de répartition Acompte / Solde si Formule Acompte */}
      {isDeposit && (
        <View style={styles.depositBox}>
          <View style={styles.depositGrid}>
            <View style={styles.depositCol}>
              <View style={styles.depositTagRow}>
                <View style={styles.dotPaid} />
                <Text style={styles.depositColLabel} numberOfLines={1}>1. Acompte en ligne ({pctAcompte}%)</Text>
              </View>
              <Text style={styles.depositColValuePaid} numberOfLines={1}>{formatFcfa(montantRegleEnLigne)} FCFA</Text>
            </View>

            <View style={styles.depositColDivider} />

            <View style={styles.depositCol}>
              <View style={styles.depositTagRow}>
                <View style={styles.dotDue} />
                <Text style={styles.depositColLabel} numberOfLines={1}>2. Solde le jour J ({pctSolde}%)</Text>
              </View>
              <Text style={styles.depositColValueDue} numberOfLines={1}>{formatFcfa(soldeRestant)} FCFA</Text>
            </View>
          </View>

          <View style={styles.depositTrack}>
            <View style={[styles.depositBarPaid, { width: `${pctAcompte}%` }]} />
            <View style={[styles.depositBarDue, { width: `${pctSolde}%` }]} />
          </View>
        </View>
      )}

      {/* Lignes de décomposition des montants */}
      <View style={styles.breakdownSection}>
        {hasBreakdown ? (
          <View style={styles.linesContainer}>
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>
                Hébergement · {nuits} nuit{nuits > 1 ? 's' : ''}
              </Text>
              <Text style={styles.lineValue}>{formatFcfa(hebergementTotal)} FCFA</Text>
            </View>

            {supplement > 0 && (
              <>
                <View style={styles.lineDivider} />
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabel}>Supplément voyageurs</Text>
                  <Text style={styles.lineValue}>+{formatFcfa(supplement)} FCFA</Text>
                </View>
              </>
            )}

            {reduction > 0 && (
              <>
                <View style={styles.lineDivider} />
                <View style={styles.lineRow}>
                  <Text style={styles.lineLabelDiscount}>Réduction séjour long</Text>
                  <Text style={styles.lineValueDiscount}>-{formatFcfa(reduction)} FCFA</Text>
                </View>
              </>
            )}
          </View>
        ) : null}

        {/* Total card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{isDeposit ? 'MONTANT TOTAL' : 'TOTAL RÉGLÉ'}</Text>
          <View style={styles.totalAmountBlock}>
            <Text style={styles.totalAmount}>{formatFcfa(total)}</Text>
            <Text style={styles.totalCurrency}>FCFA</Text>
          </View>
        </View>
      </View>

      {/* Bannière Garantie Séquestre & Acompte */}
      <View style={styles.escrowBanner}>
        <Shield size={16} color={colors.forest[700]} style={styles.escrowIcon} />
        <Text style={styles.escrowText}>
          {isDeposit ? (
            <>
              <Text style={styles.escrowBold}>Acompte sous séquestre : </Text>
              {formatFcfa(montantRegleEnLigne)} FCFA réglés en ligne. Le solde de{' '}
              <Text style={styles.escrowBold}>{formatFcfa(soldeRestant)} FCFA</Text> sera à régler le jour de votre arrivée.
            </>
          ) : (
            <>
              <Text style={styles.escrowBold}>Paiement sous séquestre. </Text>
              Les fonds ne sont versés à l’hôte qu’après confirmation de votre entrée dans les lieux.
            </>
          )}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[950],
    borderWidth: 1,
    borderColor: colors.forest[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  depositBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.inner,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  depositGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  depositCol: {
    flex: 1,
    gap: 3,
  },
  depositColDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  depositTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dotPaid: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#047857',
  },
  dotDue: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#D97706',
  },
  depositColLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: '#64748B',
    flex: 1,
  },
  depositColValuePaid: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: '#047857',
  },
  depositColValueDue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: '#D97706',
  },
  depositTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  depositBarPaid: {
    height: '100%',
    backgroundColor: '#047857',
  },
  depositBarDue: {
    height: '100%',
    backgroundColor: '#D97706',
  },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.inner,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailIcon: {
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: '#0F172A',
    marginTop: 2,
  },

  perNightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7FEE7',
    borderRadius: radius.inner,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D9F99D',
  },
  perNightText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  perNightHighlight: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 12,
    color: '#3F6212',
  },

  breakdownSection: {
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  linesContainer: {
    gap: 8,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineLabel: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  lineValue: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: '#0F172A',
  },
  lineLabelDiscount: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: '#047857',
  },
  lineValueDiscount: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#047857',
  },
  lineDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  averageNotice: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  averageNoticeHighlight: {
    fontFamily: typography.fontBodySemiBold,
    color: '#0F172A',
  },

  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.forest[950],
    borderRadius: radius.inner,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.forest[900],
  },
  totalLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.forest[300],
    letterSpacing: 0.5,
  },
  totalAmountBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  totalAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.lime[400],
  },
  totalCurrency: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.lime[400],
  },

  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  escrowIcon: {
    marginTop: 1,
  },
  escrowText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
  },
  escrowBold: {
    fontFamily: typography.fontBodySemiBold,
    color: '#0F172A',
  },
});
