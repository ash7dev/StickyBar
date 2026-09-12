import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  MapPin,
  ShieldCheck,
  Home,
  Maximize,
  BedDouble,
  Bath,
  Users,
  Moon,
  ShieldAlert,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';

export interface TenantListingSpecProps {
  titre: string;
  type: string;
  sousType?: string | null;
  ville: string;
  quartier?: string | null;
  surface?: number | null;
  nombreChambres?: number | null;
  nombreSallesBain?: number | null;
  capaciteMax?: number;
  nuitesMinimum?: number | null;
  ageMin?: number | null;
}

export function TenantListingSpec({
  titre,
  type,
  sousType,
  ville,
  quartier,
  surface,
  nombreChambres,
  nombreSallesBain,
  capaciteMax = 1,
  nuitesMinimum = 1,
  ageMin,
}: TenantListingSpecProps) {
  const categoryLabel = (sousType || type || 'LOGEMENT').toUpperCase();
  const locationText = quartier ? `${quartier}, ${ville}` : ville;

  const minNuits = nuitesMinimum ?? 1;

  const specs = [
    surface ? { icon: Maximize, label: 'SURFACE', value: `${surface} m²` } : null,
    nombreChambres ? { icon: BedDouble, label: 'CHAMBRES', value: `${nombreChambres}` } : null,
    nombreSallesBain ? { icon: Bath, label: 'SALLES DE BAIN', value: `${nombreSallesBain}` } : null,
    { icon: Users, label: 'CAPACITÉ', value: `${capaciteMax} pers.` },
    minNuits > 0
      ? {
          icon: Moon,
          label: 'SÉJOUR MIN.',
          value: `${minNuits} nuit${minNuits > 1 ? 's' : ''}`,
        }
      : null,
    ageMin ? { icon: ShieldAlert, label: 'ÂGE MINIMUM', value: `${ageMin} ans` } : null,
  ].filter(Boolean) as Array<{ icon: typeof Users; label: string; value: string }>;

  return (
    <View style={styles.sheetContainer}>
      {/* Petit indicateur visuel de poignée (Pill Indicator) */}
      <View style={styles.dragHandle} />

      {/* ── En-tête : Catégorie, Titre & Localisation ──────────────────── */}
      <View style={styles.headerBlock}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{categoryLabel}</Text>
        </View>

        <Text style={styles.titleText}>{titre}</Text>

        <View style={styles.locationRow}>
          <MapPin size={15} color={colors.forest[600]} />
          <Text style={styles.locationText}>{locationText}</Text>
        </View>
      </View>

      {/* ── Banner Officielle Garantie Séquestre Klef ──────────────────── */}
      <View style={styles.guaranteeBanner}>
        <View style={styles.guaranteeIconCircle}>
          <ShieldCheck size={20} color={colors.lime[300]} />
        </View>

        <View style={styles.guaranteeContent}>
          <Text style={styles.guaranteeTitle}>Garantie Séquestre Klef</Text>
          <Text style={styles.guaranteeSubtext}>
            Votre paiement est bloqué en toute sécurité jusqu'à la remise des clés. Si le logement ne correspond pas, vous êtes{' '}
            <Text style={styles.guaranteeHighlight}>remboursé intégralement</Text>.
          </Text>
        </View>
      </View>

      {/* ── Grille de Caractéristiques du Bien ───────────────────────── */}
      <View style={styles.specsSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.markerCircle}>
            <Home size={15} color={colors.forest[800]} />
          </View>
          <Text style={styles.sectionTitle}>Caractéristiques du bien</Text>
        </View>

        <View style={styles.specsGrid}>
          {specs.map((item, index) => {
            const Icon = item.icon;
            return (
              <View key={item.label || index} style={styles.specCard}>
                <View style={styles.specIconBox}>
                  <Icon size={18} color={colors.forest[600]} />
                </View>
                <View style={styles.specInfo}>
                  <Text style={styles.specLabel}>{item.label}</Text>
                  <Text numberOfLines={1} style={styles.specValue}>
                    {item.value}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.neutral[0],
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    ...shadows.md,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerBlock: {
    gap: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.forest[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  categoryBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[800],
    letterSpacing: 0.5,
  },
  titleText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.forest[950],
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  locationText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.neutral[600],
  },

  // Banner Garantie Séquestre
  guaranteeBanner: {
    marginTop: 16,
    backgroundColor: colors.forest[900],
    borderRadius: radius.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.forest[800],
    ...shadows.xs,
  },
  guaranteeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(211, 242, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeContent: {
    flex: 1,
    gap: 3,
  },
  guaranteeTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.lime[300],
  },
  guaranteeSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.forest[100],
  },
  guaranteeHighlight: {
    fontFamily: typography.fontBodySemiBold,
    color: colors.lime[300],
    textDecorationLine: 'underline',
  },

  // Section Caractéristiques
  specsSection: {
    marginTop: 20,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markerCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specCard: {
    width: '48%', // 2 colonnes
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    padding: 10,
  },
  specIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  specInfo: {
    flex: 1,
    gap: 1,
  },
  specLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 9.5,
    color: colors.neutral[500],
    letterSpacing: 0.4,
  },
  specValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
});
