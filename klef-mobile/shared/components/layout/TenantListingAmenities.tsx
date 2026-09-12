import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Wifi,
  AirVent,
  Wind,
  Tv,
  Waves,
  ParkingCircle,
  Zap,
  Droplets,
  UtensilsCrossed,
  Refrigerator,
  WashingMachine,
  Flame,
  Trees,
  Dumbbell,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react-native';
import { colors, radius, typography } from '../../theme/tokens';

export interface Equipement {
  id?: string;
  nom: string;
}

interface TenantListingAmenitiesProps {
  equipements?: Equipement[];
}

const AMENITIES_VISIBLE = 6;

const ICON_RULES: Array<[RegExp, typeof Wifi]> = [
  [/wifi|internet|fibre|connexion/, Wifi],
  [/clim|air condition/, AirVent],
  [/ventilateur|brasseur/, Wind],
  [/t[ée]l[ée]|tv|canal/, Tv],
  [/piscine|pool/, Waves],
  [/parking|garage|stationnement/, ParkingCircle],
  [/groupe|g[ée]n[ée]rateur|onduleur|solaire|[ée]lectricit/, Zap],
  [/eau chaude|chauffe-eau|douche/, Droplets],
  [/cuisine|cuisini|four|micro-ondes/, UtensilsCrossed],
  [/frigo|r[ée]frig[ée]rateur|cong[ée]l/, Refrigerator],
  [/lave-linge|machine [àa] laver|buanderie/, WashingMachine],
  [/barbecue|braai|grillade/, Flame],
  [/jardin|terrasse|cour|balcon/, Trees],
  [/salle de sport|gym|fitness/, Dumbbell],
  [/gardien|s[ée]curit|vigile|surveillance/, ShieldCheck],
];

function getEquipementIcon(nom: string) {
  const n = nom.toLowerCase();
  return ICON_RULES.find(([re]) => re.test(n))?.[1] ?? CheckCircle2;
}

export function TenantListingAmenities({ equipements = [] }: TenantListingAmenitiesProps) {
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);

  const visibleEquipements = amenitiesOpen
    ? equipements
    : equipements.slice(0, AMENITIES_VISIBLE);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Équipements</Text>
        {equipements.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{equipements.length}</Text>
          </View>
        )}
      </View>

      {equipements.length > 0 ? (
        <>
          <View style={styles.grid}>
            {visibleEquipements.map((eq, index) => {
              const Icon = getEquipementIcon(eq.nom);
              return (
                <View key={eq.id || eq.nom || index} style={styles.amenityItem}>
                  <Icon size={18} color={colors.forest[600]} />
                  <Text numberOfLines={1} style={styles.amenityText}>
                    {eq.nom}
                  </Text>
                </View>
              );
            })}
          </View>

          {equipements.length > AMENITIES_VISIBLE && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setAmenitiesOpen(!amenitiesOpen)}
              style={styles.expandButton}
            >
              <Text style={styles.expandButtonText}>
                {amenitiesOpen
                  ? 'Réduire la liste'
                  : `Voir les ${equipements.length} équipements`}
              </Text>
              <ChevronDown
                size={16}
                color={colors.forest[800]}
                style={amenitiesOpen ? styles.arrowRotated : undefined}
              />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Text style={styles.emptyText}>
          L'hôte n'a pas encore renseigné les équipements pour ce logement.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 17,
    color: colors.forest[950],
  },
  countBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  countText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[600],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityItem: {
    width: '48%', // 2 colonnes
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  amenityText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.neutral[800],
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginTop: 4,
  },
  expandButtonText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[800],
  },
  arrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  emptyText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[500],
  },
});
