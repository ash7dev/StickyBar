import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Tag,
  CheckCircle2,
  Armchair,
  ChefHat,
  Wifi,
  Shield,
  Trees,
  Accessibility,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';

export interface EquipementData {
  id?: string;
  nom?: string;
  categorie?: string;
}

export interface MobileOwnerDetailAmenitiesCardProps {
  equipements?: EquipementData[] | string[];
}

const CAT_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  CONFORT: Armchair,
  CUISINE: ChefHat,
  CONNECTIVITE: Wifi,
  SECURITE: Shield,
  EXTERIEUR: Trees,
  ACCESSIBILITE: Accessibility,
};

const CAT_LABELS: Record<string, string> = {
  CONFORT: 'Confort & Mobilier',
  CUISINE: 'Cuisine & Repas',
  CONNECTIVITE: 'High-Tech & Connectivité',
  SECURITE: 'Sécurité & Accès',
  EXTERIEUR: 'Piscine & Jardin',
  ACCESSIBILITE: 'Accessibilité',
};

export function MobileOwnerDetailAmenitiesCard({ equipements = [] }: MobileOwnerDetailAmenitiesCardProps) {
  const formattedEquipements: EquipementData[] = equipements.map((eq, idx) => {
    if (typeof eq === 'string') {
      return { id: `eq-${idx}`, nom: eq, categorie: 'CONFORT' };
    }
    return eq;
  });

  const grouped = formattedEquipements.reduce<Record<string, EquipementData[]>>((acc, eq) => {
    const key = (eq.categorie || 'CONFORT').toUpperCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(eq);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleRow}>
          <View style={styles.markerCircle}>
            <Tag size={16} color={colors.forest[800]} />
          </View>
          <Text style={styles.cardTitle}>Équipements & Prestations</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{formattedEquipements.length}</Text>
        </View>
      </View>

      {categories.length > 0 ? (
        <View style={styles.categoriesList}>
          {categories.map((catKey) => {
            const Icon = CAT_ICONS[catKey] || Tag;
            const items = grouped[catKey];

            return (
              <View key={catKey} style={styles.categoryBlock}>
                <View style={styles.categoryHeader}>
                  <Icon size={14} color={colors.forest[600]} />
                  <Text style={styles.categoryTitle}>{CAT_LABELS[catKey] || catKey}</Text>
                </View>

                <View style={styles.itemsGrid}>
                  {items.map((item, idx) => (
                    <View key={item.id || idx} style={styles.amenityChip}>
                      <CheckCircle2 size={13} color={colors.forest[600]} />
                      <Text style={styles.amenityText}>{item.nom}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>Aucun équipement renseigné pour ce logement.</Text>
      )}
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
  countBadge: {
    backgroundColor: colors.neutral[100],
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },

  // Categories
  categoriesList: {
    gap: 14,
  },
  categoryBlock: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[800],
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.neutral[50],
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  amenityText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.forest[950],
  },
  emptyText: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[500],
  },
});
