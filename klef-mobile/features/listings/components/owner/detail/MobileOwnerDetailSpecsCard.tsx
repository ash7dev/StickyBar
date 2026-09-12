import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Home, MapPin, Users, Bed, Bath, Maximize2, Shield } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

export interface MobileOwnerDetailSpecsCardProps {
  titre: string;
  type?: string;
  sousType?: string;
  ville?: string;
  commune?: string;
  quartier?: string;
  adresse?: string;
  surface?: number;
  nombreChambres?: number;
  nombreSallesBain?: number;
  nombrePieces?: number;
  capaciteMax?: number;
}

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA: 'Villa',
  CHAMBRE: 'Chambre',
  AUTRES: 'Autre bien',
};

export function MobileOwnerDetailSpecsCard({
  titre,
  type = 'APPARTEMENT',
  sousType,
  ville,
  commune,
  quartier,
  adresse,
  surface,
  nombreChambres = 1,
  nombreSallesBain = 1,
  nombrePieces,
  capaciteMax = 2,
}: MobileOwnerDetailSpecsCardProps) {
  const locationText = [quartier, commune, ville].filter(Boolean).join(', ') || ville || 'Sénégal';
  const typeLabel = TYPE_LABELS[type?.toUpperCase()] || type;

  return (
    <View style={styles.card}>
      {/* Type & Location Header */}
      <View style={styles.headerBox}>
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Home size={11} color={colors.lime[800]} />
            <Text style={styles.typeBadgeText}>
              {typeLabel} {sousType ? `• ${sousType}` : ''}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{titre}</Text>

        <View style={styles.locationRow}>
          <MapPin size={13} color={colors.forest[600]} />
          <Text style={styles.locationText}>{locationText}</Text>
        </View>

        {adresse ? (
          <Text style={styles.adresseText}>Adresse : {adresse}</Text>
        ) : null}
      </View>

      {/* Grid of Key Specs (4 Capsules) */}
      <View style={styles.specsGrid}>
        <View style={styles.specCapsule}>
          <Users size={16} color={colors.forest[800]} />
          <View style={styles.specTextStack}>
            <Text style={styles.specValue}>{capaciteMax} pers.</Text>
            <Text style={styles.specLabel}>Capacité max</Text>
          </View>
        </View>

        <View style={styles.specCapsule}>
          <Bed size={16} color={colors.forest[800]} />
          <View style={styles.specTextStack}>
            <Text style={styles.specValue}>{nombreChambres} ch.</Text>
            <Text style={styles.specLabel}>Chambre{nombreChambres > 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.specCapsule}>
          <Bath size={16} color={colors.forest[800]} />
          <View style={styles.specTextStack}>
            <Text style={styles.specValue}>{nombreSallesBain} sdb</Text>
            <Text style={styles.specLabel}>Salle{nombreSallesBain > 1 ? 's' : ''} de bain</Text>
          </View>
        </View>

        {surface ? (
          <View style={styles.specCapsule}>
            <Maximize2 size={16} color={colors.forest[800]} />
            <View style={styles.specTextStack}>
              <Text style={styles.specValue}>{surface} m²</Text>
              <Text style={styles.specLabel}>Surface habitable</Text>
            </View>
          </View>
        ) : null}
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
  headerBox: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[100],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lime[300],
  },
  typeBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[900],
  },
  title: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.forest[950],
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.neutral[700],
  },
  adresseText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 2,
  },

  // Specs Grid
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  specCapsule: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[50],
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  specTextStack: {
    gap: 1,
  },
  specValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  specLabel: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
});
