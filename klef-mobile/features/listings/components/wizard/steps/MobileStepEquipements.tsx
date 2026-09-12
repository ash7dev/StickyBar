import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Armchair,
  ChefHat,
  Wifi,
  Shield,
  Trees,
  Accessibility,
  Search,
  X,
  ChevronDown,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { useListingWizardFormStore } from '../../../stores/useListingWizardFormStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const EQUIPEMENTS_PAR_CATEGORIE: Record<string, string[]> = {
  CONFORT: [
    'Climatisation',
    'Ventilateur',
    'Chauffage',
    'Lit double',
    'Canapé-lit',
    'Draps fournis',
    'Serviettes fournies',
    'Fer à repasser',
    'Espace de travail',
    'Penderie / Placard',
  ],
  CUISINE: [
    'Cuisine équipée',
    'Réfrigérateur',
    'Micro-ondes',
    'Plaque de cuisson',
    'Four',
    'Lave-vaisselle',
    'Cafetière / Bouilloire',
    'Ustensiles de cuisine',
    'Vaisselle',
    'Machine à laver',
  ],
  CONNECTIVITE: [
    'WiFi haut débit',
    'Télévision',
    'Netflix / Streaming',
    'Enceinte Bluetooth',
    'Prises USB',
    'Chargeur universel',
  ],
  SECURITE: [
    'Détecteur de fumée',
    'Extincteur',
    'Trousse de secours',
    'Coffre-fort',
    'Serrure connectée',
    'Gardien / Concierge',
    'Caméras extérieures',
    'Interphone',
  ],
  EXTERIEUR: [
    'Parking privé',
    'Piscine',
    'Jardin',
    'Terrasse / Balcon',
    'Barbecue',
    'Salon de jardin',
    'Vue mer',
    'Accès plage',
    'Rooftop',
  ],
  ACCESSIBILITE: [
    'Ascenseur',
    'Accès PMR',
    'Douche italienne',
    'Plain-pied',
    'Rampe d\'accès',
  ],
};

export const CATEGORIE_EQUIPEMENT_LABELS: Record<string, string> = {
  CONFORT: 'Confort & Détente',
  CUISINE: 'Cuisine & Électroménager',
  CONNECTIVITE: 'Connectivité & Multimédia',
  SECURITE: 'Sécurité & Protection',
  EXTERIEUR: 'Extérieur & Cadre de vie',
  ACCESSIBILITE: 'Accessibilité & PMR',
};

const CAT_ICONS: Record<string, any> = {
  CONFORT: Armchair,
  CUISINE: ChefHat,
  CONNECTIVITE: Wifi,
  SECURITE: Shield,
  EXTERIEUR: Trees,
  ACCESSIBILITE: Accessibility,
};

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function MobileStepEquipements() {
  const { equipements, toggleEquipement } = useListingWizardFormStore();
  const selected = equipements ?? [];
  const total = selected.length;

  const [query, setQuery] = useState('');
  const [openCats, setOpenCats] = useState<Set<string>>(
    new Set(['CONFORT', 'CUISINE', 'CONNECTIVITE', 'SECURITE', 'EXTERIEUR', 'ACCESSIBILITE'])
  );

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return Object.entries(EQUIPEMENTS_PAR_CATEGORIE)
      .map(([cat, items]) => [
        cat,
        items.filter((n) => !q || norm(n).includes(q)),
      ] as const)
      .filter(([, items]) => items.length > 0);
  }, [query]);

  const toggleCat = (cat: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const noResult = query.trim() && filtered.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.sectionCard}>
        {/* Section Card Header */}
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Armchair size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Équipements et services</Text>
            <Text style={styles.sectionDesc}>Cochez ce que vous mettez à disposition des voyageurs</Text>
          </View>
        </View>

        {/* Ultra-Premium Dark Forest Counter Hero Banner */}
        <View style={styles.darkCounterHero}>
          <View style={styles.darkHeroLeft}>
            <View style={styles.heroLimeChip}>
              <Sparkles size={11} color={colors.forest[950]} />
              <Text style={styles.heroLimeChipText}>SERVICES & COMMODITÉS</Text>
            </View>
            <Text style={styles.darkHeroCounterText}>
              <Text style={styles.darkHeroCounterNum}>{total}</Text> équipement{total > 1 ? 's' : ''} sélectionné{total > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Search size={16} color={colors.forest[700]} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un équipement (ex: WiFi, Piscine...)"
            placeholderTextColor={colors.neutral[400]}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              style={styles.clearBtn}
            >
              <X size={14} color={colors.neutral[500]} />
            </TouchableOpacity>
          )}
        </View>

        {noResult && (
          <View style={styles.noResultBox}>
            <Text style={styles.noResultText}>
              Aucun équipement ne correspond à « {query} ».
            </Text>
          </View>
        )}

        {/* Accordions List (Web Mobile Accordion Mirror Sublimé) */}
        <View style={styles.accordionsStack}>
          {filtered.map(([cat, items]) => {
            const IconComp = CAT_ICONS[cat] ?? Tag;
            const catSelectedCount = items.filter((nom) => selected.includes(nom)).length;
            const isOpen = openCats.has(cat) || Boolean(query.trim());
            const hasSelected = catSelectedCount > 0;

            return (
              <View
                key={cat}
                style={[
                  styles.accordionItem,
                  hasSelected && styles.accordionItemActiveBorder,
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    toggleCat(cat);
                  }}
                  style={[
                    styles.accordionHeader,
                    hasSelected && styles.accordionHeaderSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.accordionIconCircle,
                      hasSelected && styles.accordionIconCircleLime,
                    ]}
                  >
                    <IconComp
                      size={16}
                      color={hasSelected ? colors.forest[950] : colors.forest[800]}
                      strokeWidth={2.2}
                    />
                  </View>

                  <Text
                    style={[
                      styles.accordionTitle,
                      hasSelected && styles.accordionTitleSelected,
                    ]}
                  >
                    {CATEGORIE_EQUIPEMENT_LABELS[cat]}
                  </Text>

                  {catSelectedCount > 0 && (
                    <View style={styles.countBadgeLime}>
                      <Text style={styles.countBadgeLimeText}>{catSelectedCount}</Text>
                    </View>
                  )}

                  <ChevronDown
                    size={16}
                    color={hasSelected ? colors.forest[900] : colors.neutral[500]}
                    style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.itemsList}>
                    {items.map((nom) => {
                      const isChecked = selected.includes(nom);

                      return (
                        <TouchableOpacity
                          key={nom}
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            toggleEquipement(nom);
                          }}
                          style={[
                            styles.checkRow,
                            isChecked && styles.checkRowSelected,
                          ]}
                        >
                          <View
                            style={[
                              styles.checkboxSquare,
                              isChecked && styles.checkboxSquareLimeSelected,
                            ]}
                          >
                            {isChecked && (
                              <Check size={12} color={colors.forest[950]} strokeWidth={3.5} />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.checkItemText,
                              isChecked && styles.checkItemTextSelected,
                            ]}
                          >
                            {nom}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },

  sectionCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderStack: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
  },
  sectionDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
  },

  // Dark Counter Hero
  darkCounterHero: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 14,
    ...shadows.float,
  },
  darkHeroLeft: {
    gap: 6,
  },
  heroLimeChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[400],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  heroLimeChipText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[950],
    letterSpacing: 0.4,
  },
  darkHeroCounterText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12.5,
    color: colors.forest[200],
  },
  darkHeroCounterNum: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.neutral[0],
  },

  // Search Bar
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[200],
    paddingHorizontal: 14,
    height: 44,
    ...shadows.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[900],
  },
  clearBtn: {
    padding: 4,
  },

  noResultBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noResultText: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.neutral[500],
  },

  // Accordions Stack
  accordionsStack: {
    gap: 10,
  },
  accordionItem: {
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    backgroundColor: colors.neutral[0],
    ...shadows.xs,
  },
  accordionItemActiveBorder: {
    borderColor: colors.forest[300],
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  accordionHeaderSelected: {
    backgroundColor: colors.forest[50],
  },
  accordionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionIconCircleLime: {
    backgroundColor: colors.lime[400],
  },
  accordionTitle: {
    flex: 1,
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13.5,
    color: colors.neutral[800],
  },
  accordionTitleSelected: {
    fontFamily: typography.fontDisplaySemiBold,
    color: colors.forest[950],
  },
  countBadgeLime: {
    backgroundColor: colors.forest[950],
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.pill,
  },
  countBadgeLimeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.lime[400],
  },

  // Items List inside Accordion
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.neutral[0],
  },
  checkRowSelected: {
    backgroundColor: 'rgba(45, 87, 44, 0.05)',
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareLimeSelected: {
    backgroundColor: colors.lime[400],
    borderColor: colors.lime[400],
  },
  checkItemText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[800],
  },
  checkItemTextSelected: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
});
