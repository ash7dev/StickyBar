import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Wallet, AlertTriangle, TrendingUp, Info, ArrowUpRight } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { WalletData } from '../types/wallet.types';

interface MobileWalletBalanceCardProps {
  wallet: WalletData;
  onOpenWithdrawalModal?: () => void;
}

export function MobileWalletBalanceCard({
  wallet,
  onOpenWithdrawalModal,
}: MobileWalletBalanceCardProps) {
  const { soldeDisponible, soldeProprietaire, soldeLocataire = 0, dettePenalites } = wallet;

  const displaySolde = soldeProprietaire !== undefined ? soldeProprietaire : soldeDisponible;
  const hasDebt = dettePenalites > 0;
  const canWithdraw = displaySolde >= 10000;

  const formatPrice = (val: number) => {
    return (val || 0).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  };

  return (
    <View style={styles.outerContainer}>
      {/* ── Main Host Revenue Balance Card (Inverse Forest 950 Theme) ── */}
      <View style={styles.cardContainer}>
        {/* Background Radial Decor Highlights */}
        <View style={styles.radialHaloTop} />
        <View style={styles.radialHaloBottom} />

        <View style={styles.cardContent}>
          {/* Header Row: Icon, Title & Portefeuille Tag */}
          <View style={styles.topRow}>
            <View style={styles.titleStack}>
              <View style={styles.iconBadge}>
                <Wallet size={18} color={colors.lime[400]} />
              </View>
              <Text style={styles.eyebrowText}>
                SOLDE REVENUS HÔTE (RETIRABLE)
              </Text>
            </View>

            <View style={styles.tagPill}>
              <TrendingUp size={12} color={colors.lime[300]} />
              <Text style={styles.tagText}>Portefeuille Hôte</Text>
            </View>
          </View>

          {/* Solde Display */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {formatPrice(displaySolde)}
            </Text>
            <Text style={styles.balanceSubtext}>
              Disponibilité immédiate · Retrait sous 2h par Wave & Orange Money
            </Text>
          </View>

          {/* Alerte Dette / Pénalités si présent */}
          {hasDebt && (
            <View style={styles.debtBanner}>
              <AlertTriangle size={15} color="#F87171" />
              <Text style={styles.debtText}>
                Dette en cours : <Text style={styles.debtAmount}>{formatPrice(dettePenalites)}</Text>
              </Text>
            </View>
          )}

          {/* Action Row: Demander un retrait */}
          {onOpenWithdrawalModal && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={onOpenWithdrawalModal}
                style={[styles.btnWithdraw, !canWithdraw && styles.btnWithdrawDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Demander un retrait"
              >
                <ArrowUpRight size={18} color={canWithdraw ? colors.forest[950] : colors.neutral[500]} strokeWidth={2.5} />
                <Text style={[styles.btnWithdrawText, !canWithdraw && styles.btnWithdrawTextDisabled]}>
                  {canWithdraw ? 'Demander un retrait' : 'Solde minimum 10 000 FCFA'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ── Banner Avoir / Remboursement Voyageur (si soldeLocataire > 0) ── */}
      {soldeLocataire > 0 && (
        <View style={styles.tenantCreditCard}>
          <View style={styles.tenantCreditIconCircle}>
            <Info size={16} color={colors.forest[700]} />
          </View>
          <View style={styles.tenantCreditTextCol}>
            <Text style={styles.tenantCreditTitle}>
              Avoir / Remboursement Voyageur :{' '}
              <Text style={styles.tenantCreditAmount}>{formatPrice(soldeLocataire)}</Text>
            </Text>
            <Text style={styles.tenantCreditSub}>
              Ce montant provient de l’annulation de vos réservations en tant que client/locataire et reste disponible pour vos futurs voyages ou remboursement.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    gap: 12,
  },
  cardContainer: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
    overflow: 'hidden',
    ...shadows.md,
  },
  radialHaloTop: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(211, 242, 110, 0.08)',
  },
  radialHaloBottom: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  cardContent: {
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[300],
    letterSpacing: 0.5,
    flex: 1,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tagText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[300],
  },
  balanceContainer: {
    gap: 4,
    marginTop: 4,
  },
  balanceAmount: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 34,
    color: colors.lime[400],
    letterSpacing: -0.5,
  },
  balanceSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[300],
  },
  debtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignSelf: 'flex-start',
  },
  debtText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: '#F87171',
  },
  debtAmount: {
    fontFamily: typography.fontBodyBold,
    color: '#EF4444',
  },
  actionRow: {
    marginTop: 4,
  },
  btnWithdraw: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.action,
  },
  btnWithdrawDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnWithdrawText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  btnWithdrawTextDisabled: {
    color: colors.neutral[400],
  },

  // Banner Avoir Voyageur
  tenantCreditCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 12,
    ...shadows.xs,
  },
  tenantCreditIconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tenantCreditTextCol: {
    flex: 1,
    gap: 3,
  },
  tenantCreditTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[900],
  },
  tenantCreditAmount: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[700],
  },
  tenantCreditSub: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    lineHeight: 16,
  },
});
