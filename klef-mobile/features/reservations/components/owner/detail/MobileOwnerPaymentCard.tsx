import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Info,
  Tag,
  Banknote,
  Wallet,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { ReservationDetail } from '../../../types/reservation-detail.types';

const waveLogoImg = require('../../../../../assets/images/wavelogo.jpeg');
const orangeLogoImg = require('../../../../../assets/images/orangeMoneylogo.png');

const FOURNISSEUR_LABEL: Record<string, string> = {
  WAVE: 'Wave Money',
  ORANGE_MONEY: 'Orange Money',
  CARD: 'Carte Bancaire',
  ESPECES: 'Espèces (Sur place)',
};

/** Composant Badge/Logo officiel du fournisseur de paiement */
function PaymentProviderBadge({ fournisseur }: { fournisseur?: string | null }) {
  const code = (fournisseur || '').toUpperCase();

  if (code.includes('WAVE')) {
    return (
      <View style={styles.providerBadgeWave}>
        <Image source={waveLogoImg} style={styles.providerLogoImg} resizeMode="cover" />
        <Text style={styles.providerTextWave}>Wave Money</Text>
      </View>
    );
  }

  if (code.includes('ORANGE')) {
    return (
      <View style={styles.providerBadgeOrange}>
        <Image source={orangeLogoImg} style={styles.providerLogoImg} resizeMode="contain" />
        <Text style={styles.providerTextOrange}>Orange Money</Text>
      </View>
    );
  }

  if (code.includes('CARD') || code.includes('CARTE') || code.includes('CB')) {
    return (
      <View style={styles.providerBadgeCard}>
        <View style={styles.providerIconCard}>
          <CreditCard size={13} color="#FFFFFF" />
        </View>
        <Text style={styles.providerTextCard}>Carte Bancaire</Text>
      </View>
    );
  }

  if (code.includes('ESPECES') || code.includes('CASH')) {
    return (
      <View style={styles.providerBadgeCash}>
        <View style={styles.providerIconCash}>
          <Banknote size={13} color="#FFFFFF" />
        </View>
        <Text style={styles.providerTextCash}>Espèces (Sur place)</Text>
      </View>
    );
  }

  return (
    <View style={styles.providerBadgeDefault}>
      <Wallet size={13} color="#334155" />
      <Text style={styles.providerTextDefault}>
        {FOURNISSEUR_LABEL[code] || fournisseur || 'Wave / Orange / CB'}
      </Text>
    </View>
  );
}

interface MobileOwnerPaymentCardProps {
  reservation: ReservationDetail;
}

export function MobileOwnerPaymentCard({ reservation }: MobileOwnerPaymentCardProps) {
  const p = reservation.paiement;

  const totalLocataire = Number(reservation.totalLocataire ?? 0);
  const reductionNuits = Number(reservation.reductionNuits ?? 0);
  const montantAcompte = Number(reservation.montantAcompte ?? 0);
  const rawSolde = Number(reservation.montantSoldeRestant ?? 0);

  const isDeposit =
    reservation.typePaiement === 'DEPOSIT' ||
    rawSolde > 0 ||
    (montantAcompte > 0 && totalLocataire > 0 && montantAcompte < totalLocataire);

  const montantRegleEnLigne = p?.montant
    ? Number(p.montant)
    : isDeposit
      ? montantAcompte
      : totalLocataire;

  const soldeRestant = isDeposit
    ? rawSolde > 0
      ? rawSolde
      : Math.max(0, totalLocataire - montantRegleEnLigne)
    : 0;

  const pctAcompte =
    totalLocataire > 0
      ? Math.min(100, Math.round((montantRegleEnLigne / totalLocataire) * 100))
      : 100;

  const formatPrice = (val: number) => {
    return val.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' FCFA';
  };

  const providerCode = p?.fournisseur || reservation.typePaiement;

  return (
    <View style={styles.cardContainer}>
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <CreditCard size={20} color={colors.lime[400]} />
        </View>
        <View style={styles.headerTitleCol}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            Détails du paiement
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {isDeposit
              ? 'Formule Acompte en ligne + Solde le jour J'
              : 'Réservation intégralement réglée en ligne'}
          </Text>
        </View>

        <View style={styles.headerBadge}>
          {isDeposit ? (
            <Clock size={12} color="#D97706" />
          ) : (
            <ShieldCheck size={12} color="#059669" />
          )}
          <Text style={styles.headerBadgeText} numberOfLines={1}>
            {isDeposit ? 'Acompte en ligne' : 'Paiement intégral'}
          </Text>
        </View>
      </View>

      {/* ── Répartition Acompte / Solde ───────────────────────────────────── */}
      {isDeposit && (
        <View style={styles.breakdownSection}>
          {/* Bloc Acompte réglé */}
          <View style={styles.acompteBox}>
            <CheckCircle2 size={18} color="#059669" style={styles.tileIcon} />
            <View style={styles.tileTextCol}>
              <Text style={styles.acompteLabel}>Acompte payé en ligne ({pctAcompte}%)</Text>
              <Text style={styles.acompteValue}>{formatPrice(montantRegleEnLigne)}</Text>
            </View>
          </View>

          {/* Bloc Solde à percevoir */}
          <View style={styles.soldeBox}>
            <Clock size={18} color="#D97706" style={styles.tileIcon} />
            <View style={styles.tileTextCol}>
              <Text style={styles.soldeLabel}>Solde à la remise des clés</Text>
              <Text style={styles.soldeValue}>
                {formatPrice(soldeRestant)} · sur place (espèces / mobile)
              </Text>
            </View>
          </View>

          {/* Barre de progression de l'acompte */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${pctAcompte}%` }]} />
          </View>
        </View>
      )}

      {/* ── Total du séjour & moyen de paiement (Empilés verticalement) ── */}
      <View style={styles.detailsGrid}>
        <View style={styles.gridTile}>
          <Text style={styles.tileHeaderLabel}>TOTAL SÉJOUR</Text>
          <Text style={styles.tileHeaderValue}>{formatPrice(totalLocataire)}</Text>
          {reductionNuits > 0 && (
            <View style={styles.discountRow}>
              <Tag size={11} color="#059669" />
              <Text style={styles.discountText}>−{formatPrice(reductionNuits)} remisés</Text>
            </View>
          )}
        </View>

        <View style={styles.gridTile}>
          <Text style={styles.tileHeaderLabel}>MOYEN DE PAIEMENT</Text>
          <PaymentProviderBadge fournisseur={providerCode} />
          <View style={styles.statusRow}>
            <ShieldCheck size={11} color="#059669" />
            <Text style={styles.statusText}>Séquestré & confirmé</Text>
          </View>
        </View>
      </View>

      {/* ── Explication Acompte ───────────────────────────────────────────── */}
      {isDeposit && (
        <View style={styles.noticeBox}>
          <Info size={15} color="#047857" style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            <Text style={styles.noticeBold}>Acompte sous séquestre · </Text>
            Solde de <Text style={styles.noticeBold}>{formatPrice(soldeRestant)}</Text> à percevoir sur place à l’arrivée.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
    gap: 16,
  },

  /* En-tête */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 16,
    color: colors.neutral[900],
  },
  cardSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  headerBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[700],
  },

  /* Répartition acompte / solde */
  breakdownSection: {
    gap: 10,
  },
  acompteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  acompteLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#047857',
  },
  acompteValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: '#065F46',
    marginTop: 1,
  },
  soldeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  soldeLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#92400E',
  },
  soldeValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: '#78350F',
    marginTop: 1,
  },
  tileIcon: {
    marginTop: 1,
  },
  tileTextCol: {
    flex: 1,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.forest[600],
  },

  /* Grille empilée */
  detailsGrid: {
    gap: 10,
  },
  gridTile: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 4,
  },
  tileHeaderLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.neutral[500],
  },
  tileHeaderValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.neutral[900],
  },
  providerNameText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.neutral[900],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: '#059669',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  discountText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: '#059669',
  },

  /* Badges & Logos Officiels des moyens de paiement */
  providerLogoImg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  providerBadgeWave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F7FE',
    borderWidth: 1,
    borderColor: '#90E0EF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  providerIconWave: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00A3E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerTextWave: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#0077B6',
  },

  providerBadgeOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3EB',
    borderWidth: 1,
    borderColor: '#FFD8C2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  providerIconOrange: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerTextOrange: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#C65100',
  },

  providerBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  providerIconCard: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerTextCard: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#3730A3',
  },

  providerBadgeCash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  providerIconCash: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerTextCash: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#047857',
  },

  providerBadgeDefault: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginVertical: 2,
  },
  providerTextDefault: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: '#334155',
  },

  /* Notice information */
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: radius.inner,
    padding: 14,
  },
  noticeIcon: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 12,
    lineHeight: 18,
    color: '#065F46',
  },
  noticeBold: {
    fontFamily: typography.fontBodyBold,
    color: '#047857',
  },
});