import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Compass } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';

export interface CategoryFilterItem {
  type: string;
  sousType: string;
  label: string;
}

export const CATEGORIES_FILTERS: CategoryFilterItem[] = [
  { type: '', sousType: '', label: 'Tous' },
  { type: 'APPARTEMENT', sousType: 'Studio', label: 'Studio' },
  { type: 'VILLA', sousType: 'Villa simple', label: 'Villa simple' },
  { type: 'APPARTEMENT', sousType: 'Appartement F2', label: 'Appartement F2' },
  { type: 'CHAMBRE', sousType: 'Chambre meublée', label: 'Chambre meublée' },
  { type: 'VILLA', sousType: 'Villa avec piscine', label: 'Villa avec piscine' },
  { type: 'APPARTEMENT', sousType: 'Appartement F3', label: 'Appartement F3' },
  { type: 'AUTRES', sousType: 'Résidence hôtelière', label: 'Résidence hôtelière' },
  { type: 'APPARTEMENT', sousType: 'Appartement F4+', label: 'Appartement F4+' },
  { type: 'VILLA', sousType: 'Villa bord de mer', label: 'Villa bord de mer' },
  { type: 'APPARTEMENT', sousType: 'Penthouse', label: 'Penthouse' },
  { type: 'AUTRES', sousType: 'Hôtel', label: 'Hôtel' },
  { type: 'VILLA', sousType: 'Villa de luxe', label: 'Villa de luxe' },
  { type: 'CHAMBRE', sousType: 'Suite meublée', label: 'Suite meublée' },
  { type: 'APPARTEMENT', sousType: 'Loft', label: 'Loft' },
  { type: 'AUTRES', sousType: 'Auberge / Gîte', label: 'Auberge / Gîte' },
  { type: 'VILLA', sousType: 'Villa familiale', label: 'Villa familiale' },
  { type: 'AUTRES', sousType: 'Maison entière', label: 'Maison entière' },
  { type: 'VILLA', sousType: 'Villa pour événement', label: 'Villa pour événement' },
  { type: 'AUTRES', sousType: 'Duplex', label: 'Duplex' },
  { type: 'AUTRES', sousType: 'Riad / Maison traditionnelle', label: 'Riad' },
  { type: 'AUTRES', sousType: 'Cabane / Logement atypique', label: 'Logement atypique' },
  { type: 'AUTRES', sousType: 'Résidence étudiante', label: 'Résidence étudiante' },
];

interface TenantSubtypeFilterBarProps {
  selectedType?: string;
  selectedSousType?: string;
  onSelectCategory: (category: { type: string; sousType: string }) => void;
  isGpsActive?: boolean;
  onGpsPress?: () => void;
}

export function TenantSubtypeFilterBar({
  selectedType = '',
  selectedSousType = '',
  onSelectCategory,
  isGpsActive = false,
  onGpsPress,
}: TenantSubtypeFilterBarProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Pilule spéciale "Autour de moi (GPS)" */}
        {onGpsPress && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onGpsPress}
            style={[
              styles.chip,
              isGpsActive ? styles.gpsActiveChip : styles.gpsInactiveChip,
            ]}
          >
            <Compass
              size={15}
              color={isGpsActive ? colors.lime[300] : colors.forest[700]}
            />
            <Text
              style={[
                styles.chipText,
                isGpsActive ? styles.gpsActiveText : styles.gpsInactiveText,
              ]}
            >
              Autour de moi
            </Text>
          </TouchableOpacity>
        )}

        {/* Liste des chips de sous-types */}
        {CATEGORIES_FILTERS.map((cat) => {
          const isActive =
            selectedType === cat.type && selectedSousType === cat.sousType;

          return (
            <TouchableOpacity
              key={`${cat.type}-${cat.sousType}-${cat.label}`}
              activeOpacity={0.75}
              onPress={() =>
                onSelectCategory({ type: cat.type, sousType: cat.sousType })
              }
              style={[
                styles.chip,
                isActive ? styles.activeChip : styles.inactiveChip,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive ? styles.activeChipText : styles.inactiveChipText,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 6,
  },
  activeChip: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
    ...shadows.xs,
  },
  inactiveChip: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[200],
  },
  gpsActiveChip: {
    backgroundColor: colors.forest[950],
    borderColor: colors.forest[950],
    ...shadows.xs,
  },
  gpsInactiveChip: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[200],
  },
  chipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
  },
  activeChipText: {
    color: colors.neutral[0],
  },
  inactiveChipText: {
    color: colors.forest[950],
  },
  gpsActiveText: {
    color: colors.neutral[0],
  },
  gpsInactiveText: {
    color: colors.forest[800],
  },
});
