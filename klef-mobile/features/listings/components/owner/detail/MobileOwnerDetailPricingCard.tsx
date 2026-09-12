import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Tag, TrendingDown, Moon, ShieldCheck, Zap, AlertCircle, Users, UserPlus, Sparkles } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

export interface TarifNuitData {
  dureeMinNuits?: number;
  nuitsMin?: number;
  pourcentageReduction?: number;
  prix?: number;
}

export interface TarifPersonneData {
  personnesMin?: number;
  personnesMax?: number;
  supplement?: number;
}

export interface MobileOwnerDetailPricingCardProps {
  prixBase: number;
  personnesBase?: number;
  capaciteMax?: number;
  nuitesMinimum?: number;
  caution?: number;
  fraisMenage?: number;
  derniereMinuteActive?: boolean;
  acomptePourcentage?: number;
  tarifsNuits?: TarifNuitData[];
  tarifsPersonnes?: TarifPersonneData[];
}

const fcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

export function MobileOwnerDetailPricingCard({
  prixBase = 0,
  personnesBase = 2,
  capaciteMax = 2,
  nuitesMinimum = 1,
  caution,
  fraisMenage,
  derniereMinuteActive = false,
  acomptePourcentage = 30,
  tarifsNuits = [],
  tarifsPersonnes = [],
}: MobileOwnerDetailPricingCardProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.markerCircle}>
            <Tag size={16} color={colors.forest[800]} />
          </View>
          <Text style={styles.cardTitle}>Grille Tarifaire & Conditions</Text>
        </View>

        {derniereMinuteActive && (
          <View style={styles.lastMinBadge}>
            <Zap size={11} color="#7D5200" fill="#FBBF24" />
            <Text style={styles.lastMinText}>-15% Dern. Min.</Text>
          </View>
        )}
      </View>

      {/* Base Price Hero Box */}
      <View style={styles.priceHeroBox}>
        <View style={styles.priceStack}>
          <Text style={styles.eyebrow}>TARIF DE RÉFÉRENCE</Text>
          <View style={styles.priceValueRow}>
            <Text style={styles.priceValue}>{fcfa(prixBase)}</Text>
            <Text style={styles.priceUnit}>FCFA / nuit</Text>
          </View>
          <Text style={styles.priceSubtext}>
            {personnesBase} pers. incluses · Min. {nuitesMinimum} nuit{nuitesMinimum > 1 ? 's' : ''} · Acompte {acomptePourcentage}%
          </Text>
        </View>
      </View>

      {/* Tarifs par nombre de personnes */}
      <View style={styles.paliersSection}>
        <Text style={styles.sectionSubtitle}>TARIFICATION SELON CAPACITÉ VOYAGEURS</Text>
        <View style={styles.personnesBox}>
          {/* Base Capacity Row */}
          <View style={styles.personneBaseRow}>
            <View style={styles.personneLeftCol}>
              <View style={styles.personneIconBadge}>
                <Users size={14} color={colors.forest[800]} />
              </View>
              <View style={styles.personneTextStack}>
                <Text style={styles.personneTitle}>
                  {personnesBase} personne{personnesBase > 1 ? 's' : ''} incluses
                </Text>
                <Text style={styles.personneSub}>Comprises dans le tarif de base</Text>
              </View>
            </View>
            <View style={styles.baseIncludedBadge}>
              <Text style={styles.baseIncludedText}>{fcfa(prixBase)} FCFA/nuit</Text>
            </View>
          </View>

          {/* Extra Persons Tier Rows or Max Capacity Banner */}
          {tarifsPersonnes && tarifsPersonnes.length > 0 ? (
            tarifsPersonnes.map((tp, i) => {
              const minP = tp.personnesMin || personnesBase + 1;
              const maxP = tp.personnesMax ? ` à ${tp.personnesMax}` : '';
              const labelRange = tp.personnesMin && tp.personnesMax && tp.personnesMin === tp.personnesMax
                ? `${tp.personnesMin}e personne`
                : `Au-delà de ${minP - 1} pers.${maxP}`;

              return (
                <View key={i} style={styles.personneExtraRow}>
                  <View style={styles.personneLeftCol}>
                    <View style={styles.personneExtraIconBadge}>
                      <UserPlus size={13} color={colors.forest[700]} />
                    </View>
                    <View style={styles.personneTextStack}>
                      <Text style={styles.personneExtraTitle}>{labelRange}</Text>
                      <Text style={styles.personneSub}>Supplément par nuit & par pers.</Text>
                    </View>
                  </View>
                  <View style={styles.extraPriceBadge}>
                    <Text style={styles.extraPriceText}>+{fcfa(tp.supplement || 0)} FCFA</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.personneExtraRow}>
              <View style={styles.personneLeftCol}>
                <View style={styles.personneExtraIconBadge}>
                  <UserPlus size={13} color={colors.forest[700]} />
                </View>
                <View style={styles.personneTextStack}>
                  <Text style={styles.personneExtraTitle}>Jusqu'à {capaciteMax} voyageurs max.</Text>
                  <Text style={styles.personneSub}>Aucun supplément configuré</Text>
                </View>
              </View>
              <View style={styles.noExtraBadge}>
                <Text style={styles.noExtraText}>Sans supplément</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Extra Charges (Deposit & Cleaning) */}
      {(caution || fraisMenage) ? (
        <View style={styles.extraChargesRow}>
          {caution ? (
            <View style={styles.extraChargeItem}>
              <ShieldCheck size={14} color={colors.forest[600]} />
              <Text style={styles.extraChargeText}>
                Caution : <Text style={styles.extraChargeValue}>{fcfa(caution)} FCFA</Text>
              </Text>
            </View>
          ) : null}

          {fraisMenage ? (
            <View style={styles.extraChargeItem}>
              <Tag size={14} color={colors.forest[600]} />
              <Text style={styles.extraChargeText}>
                Ménage : <Text style={styles.extraChargeValue}>{fcfa(fraisMenage)} FCFA</Text>
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Degressive Discounts List */}
      <View style={styles.paliersSection}>
        <View style={styles.paliersSectionHeader}>
          <Text style={styles.sectionSubtitle}>PALIERS DE RÉDUCTION DÉGRESSIFS (NUITÉES)</Text>
        </View>

        {tarifsNuits && tarifsNuits.length > 0 ? (
          <View style={styles.paliersGrid}>
            {tarifsNuits.map((tarif, idx) => {
              const nuits = tarif.nuitsMin || tarif.dureeMinNuits || 7;
              const reduction = tarif.pourcentageReduction || (tarif.prix ? Math.round(((prixBase - tarif.prix) / prixBase) * 100) : 0);
              const calculatedPrice = tarif.prix || Math.round(prixBase * (1 - reduction / 100));
              const economie = Math.max(0, prixBase - calculatedPrice);

              return (
                <View key={idx} style={styles.palierCardPremium}>
                  {/* Top Bar: Duration Pill & Discount Tag */}
                  <View style={styles.palierCardTopRow}>
                    <View style={styles.durationPill}>
                      <Moon size={13} color={colors.forest[800]} />
                      <Text style={styles.durationPillText}>Dès {nuits} nuitées</Text>
                    </View>

                    {reduction > 0 && (
                      <View style={styles.discountPillLime}>
                        <Sparkles size={11} color={colors.forest[950]} />
                        <Text style={styles.discountPillLimeText}>-{reduction}%</Text>
                      </View>
                    )}
                  </View>

                  {/* Middle: Price Comparison */}
                  <View style={styles.palierPriceComparisonRow}>
                    <View style={styles.oldPriceBox}>
                      <Text style={styles.oldPriceLabel}>Tarif normal</Text>
                      <Text style={styles.oldPriceValue}>{fcfa(prixBase)} FCFA</Text>
                    </View>

                    <Text style={styles.priceArrow}>→</Text>

                    <View style={styles.newPriceBox}>
                      <Text style={styles.newPriceLabel}>Tarif remisé</Text>
                      <Text style={styles.newPriceValue}>{fcfa(calculatedPrice)} FCFA</Text>
                    </View>
                  </View>

                  {/* Bottom Economy Banner */}
                  {economie > 0 && (
                    <View style={styles.palierEconomyBanner}>
                      <TrendingDown size={12} color={colors.forest[700]} />
                      <Text style={styles.palierEconomyBannerText}>
                        Économie de <Text style={styles.boldText}>{fcfa(economie)} FCFA</Text> par nuitée
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.noPaliersBox}>
            <AlertCircle size={16} color={colors.neutral[500]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.noPaliersTitle}>Aucune réduction dégressive</Text>
              <Text style={styles.noPaliersText}>
                Proposez une remise (ex: -10% dès 7 jours) pour attirer les séjours de longue durée et augmenter votre taux d'occupation.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 18,
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
    gap: 8,
  },
  markerCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  lastMinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lastMinText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: '#92400E',
  },

  // Base Price Hero
  priceHeroBox: {
    backgroundColor: colors.neutral[50],
    padding: 16,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  priceStack: {
    gap: 4,
  },
  eyebrow: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.lime[800],
    letterSpacing: 0.8,
  },
  priceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 26,
    color: colors.forest[950],
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[600],
  },
  priceSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },

  // Tarification Personnes
  personnesBox: {
    backgroundColor: colors.neutral[50],
    padding: 10,
    borderRadius: radius.inner,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  personneBaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  personneExtraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.forest[50],
    padding: 10,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  personneLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 6,
  },
  personneIconBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  personneExtraIconBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    justifyContent: 'center',
    alignItems: 'center',
  },
  personneTextStack: {
    gap: 1,
    flex: 1,
  },
  personneTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  personneExtraTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  personneSub: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
  baseIncludedBadge: {
    backgroundColor: colors.forest[50],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  baseIncludedText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[800],
  },
  extraPriceBadge: {
    backgroundColor: colors.lime[400],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  extraPriceText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[950],
  },
  noExtraBadge: {
    backgroundColor: colors.neutral[100],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  noExtraText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[600],
  },

  // Extra Charges
  extraChargesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  extraChargeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest[50],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  extraChargeText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.forest[800],
  },
  extraChargeValue: {
    fontFamily: typography.fontBodyBold,
  },

  // Paliers
  paliersSection: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  paliersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[500],
    letterSpacing: 0.6,
  },
  paliersGrid: {
    gap: 10,
  },
  palierCardPremium: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  palierCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[0],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  durationPillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  discountPillLime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[400],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  discountPillLimeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  palierPriceComparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  oldPriceBox: {
    gap: 2,
  },
  oldPriceLabel: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.neutral[400],
    textTransform: 'uppercase',
  },
  oldPriceValue: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12.5,
    color: colors.neutral[500],
    textDecorationLine: 'line-through',
  },
  priceArrow: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14,
    color: colors.neutral[400],
  },
  newPriceBox: {
    alignItems: 'flex-end',
    gap: 2,
  },
  newPriceLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[800],
    textTransform: 'uppercase',
  },
  newPriceValue: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  palierEconomyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest[50],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  palierEconomyBannerText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[800],
  },
  boldText: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
  noPaliersBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.neutral[50],
    padding: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
  },
  noPaliersTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  noPaliersText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    lineHeight: 16,
  },
});
