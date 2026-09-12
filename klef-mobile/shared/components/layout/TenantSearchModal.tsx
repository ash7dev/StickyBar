import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MapPin, Calendar, Search, X, RotateCcw, Check, SlidersHorizontal } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { AppButton } from '../ui/AppButton';
import { AppDateRangeCalendar, DateRange } from '../ui/AppDateRangeCalendar';

export interface SearchParams {
  ville?: string;
  arrivee?: string;
  depart?: string;
  nbNuits?: number;
}

export interface TenantSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch?: (params: SearchParams) => void;
  initialVille?: string;
}

const DESTINATIONS_POPULAIRES = [
  { name: 'Dakar', desc: 'Capitale & vie nocturne' },
  { name: 'Saly', desc: 'Station balnéaire & plages' },
  { name: 'Ngaparou', desc: 'Calme & villas piscine' },
  { name: 'Somone', desc: 'Lagune & nature' },
  { name: 'Almadies', desc: 'Restaurants & vue mer' },
  { name: 'Ngor', desc: 'Île & surf' },
];

export function TenantSearchModal({
  visible,
  onClose,
  onSearch,
  initialVille = '',
}: TenantSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'where' | 'dates'>('where');
  const [selectedVille, setSelectedVille] = useState(initialVille);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  const handleSelectDestination = (name: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedVille(name);
    setActiveTab('dates');
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedVille('');
    setDateRange({ from: null, to: null });
    setActiveTab('where');
  };

  const calculatedNuits =
    dateRange.from && dateRange.to
      ? Math.max(1, Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000))
      : 0;

  const formatDate = (d: Date | null) => {
    if (!d) return undefined;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApplySearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (onSearch) {
      onSearch({
        ville: selectedVille.trim(),
        arrivee: formatDate(dateRange.from),
        depart: formatDate(dateRange.to),
        nbNuits: calculatedNuits || undefined,
      });
    }
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.backdropTouchable}
        />

        <View style={styles.sheetContainer}>
          {/* Poignée tactile de glissement */}
          <View style={styles.dragHandleBox}>
            <View style={styles.dragHandle} />
          </View>

          {/* En-tête de la Modale */}
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X size={18} color={colors.forest[950]} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>RECHERCHER UN SÉJOUR</Text>

            <TouchableOpacity activeOpacity={0.7} onPress={handleReset}>
              <Text style={styles.resetText}>Effacer</Text>
            </TouchableOpacity>
          </View>

          {/* Corps défilable */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── 1. Bloc Destination (Où ?) ── */}
            <View
              style={[
                styles.cardBlock,
                activeTab === 'where' && styles.cardBlockActive,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('where')}
                style={styles.cardHeader}
              >
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.iconBadge,
                      activeTab === 'where' && styles.iconBadgeActive,
                    ]}
                  >
                    <MapPin
                      size={18}
                      color={
                        activeTab === 'where'
                          ? colors.forest[950]
                          : colors.neutral[700]
                      }
                    />
                  </View>

                  <View>
                    <Text style={styles.blockLabel}>DESTINATION</Text>
                    <Text style={styles.blockValue}>
                      {selectedVille.trim()
                        ? selectedVille
                        : 'Où allez-vous ?'}
                    </Text>
                  </View>
                </View>

                {activeTab !== 'where' ? (
                  <View style={styles.editPill}>
                    <Text style={styles.editPillText}>
                      {selectedVille ? 'Modifier' : 'Sélectionner'}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              {activeTab === 'where' ? (
                <View style={styles.cardBody}>
                  {/* Champ de Saisie */}
                  <View style={styles.inputWrapper}>
                    <MapPin size={18} color={colors.neutral[700]} />
                    <TextInput
                      autoCapitalize="words"
                      onChangeText={setSelectedVille}
                      placeholder="Saisissez une ville (Dakar, Saly, Ngor...)"
                      placeholderTextColor={colors.neutral[400]}
                      style={styles.input}
                      value={selectedVille}
                    />
                    {selectedVille ? (
                      <TouchableOpacity
                        onPress={() => setSelectedVille('')}
                        style={styles.clearInputBtn}
                      >
                        <X size={14} color={colors.neutral[500]} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Grille des destinations populaires au Sénégal */}
                  <Text style={styles.sectionSubtitle}>
                    DESTINATIONS RECOMMANDÉES AU SÉNÉGAL
                  </Text>
                  <View style={styles.destGrid}>
                    {DESTINATIONS_POPULAIRES.map((item) => {
                      const isSelected = selectedVille === item.name;
                      return (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          key={item.name}
                          onPress={() => handleSelectDestination(item.name)}
                          style={[
                            styles.destCard,
                            isSelected && styles.destCardSelected,
                          ]}
                        >
                          <View style={styles.destCardHeader}>
                            <Text
                              style={[
                                styles.destName,
                                isSelected && styles.destNameSelected,
                              ]}
                            >
                              {item.name}
                            </Text>
                            {isSelected ? (
                              <Check size={14} color={colors.neutral[900]} />
                            ) : null}
                          </View>
                          <Text style={styles.destDesc}>{item.desc}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>

            {/* ── 2. Bloc Dates / Durée du séjour (Quand ?) ── */}
            <View
              style={[
                styles.cardBlock,
                activeTab === 'dates' && styles.cardBlockActive,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('dates')}
                style={styles.cardHeader}
              >
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.iconBadge,
                      activeTab === 'dates' && styles.iconBadgeActive,
                    ]}
                  >
                    <Calendar
                      size={18}
                      color={
                        activeTab === 'dates'
                          ? colors.forest[950]
                          : colors.neutral[700]
                      }
                    />
                  </View>

                  <View>
                    <Text style={styles.blockLabel}>SÉJOUR / DATES</Text>
                    <Text style={styles.blockValue}>
                      {dateRange.from && dateRange.to
                        ? `${dateRange.from.getDate()}/${dateRange.from.getMonth() + 1} - ${dateRange.to.getDate()}/${dateRange.to.getMonth() + 1} (${calculatedNuits} nuits)`
                        : dateRange.from
                        ? `Arrivée le ${dateRange.from.getDate()}/${dateRange.from.getMonth() + 1}`
                        : 'Ajouter des dates'}
                    </Text>
                  </View>
                </View>

                {activeTab !== 'dates' ? (
                  <View style={styles.editPill}>
                    <Text style={styles.editPillText}>
                      {dateRange.from ? 'Modifier' : 'Sélectionner'}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              {activeTab === 'dates' ? (
                <View style={styles.cardBody}>
                  <Text style={styles.sectionSubtitle}>CHOIX DE LA PLAGE DE DATES</Text>
                  <AppDateRangeCalendar
                    onChange={setDateRange}
                    value={dateRange}
                  />
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* Pied de Modale Fixe CTA (Bouton Lime Premium) */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleReset}
              style={styles.resetBtn}
            >
              <RotateCcw size={16} color={colors.neutral[600]} />
              <Text style={styles.resetBtnText}>Effacer</Text>
            </TouchableOpacity>

            <View style={styles.ctaWrapper}>
              <AppButton
                fullWidth
                label={
                  selectedVille
                    ? `Rechercher (${selectedVille})`
                    : calculatedNuits
                    ? `Rechercher (${calculatedNuits} n.)`
                    : 'Rechercher'
                }
                leftIcon={<Search size={18} color={colors.forest[950]} />}
                onPress={handleApplySearch}
                size="lg"
                variant="action"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: colors.neutral[50],
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '88%',
    minHeight: '65%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...shadows.lg,
  },
  dragHandleBox: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: colors.neutral[0],
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[300],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.neutral[0],
    borderBottomWidth: 1,
    borderColor: colors.neutral[200],
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.forest[950],
    letterSpacing: 1.2,
  },
  resetText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.forest[600],
    textDecorationLine: 'underline',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },

  // Card Blocks
  cardBlock: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    ...shadows.xs,
  },
  cardBlockActive: {
    borderColor: colors.forest[600],
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeActive: {
    backgroundColor: colors.lime[400],
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.neutral[400],
    letterSpacing: 1,
  },
  blockValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.forest[950],
    marginTop: 2,
  },
  editPill: {
    backgroundColor: colors.forest[50],
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  editPillText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.forest[600],
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: colors.neutral[100],
    paddingTop: 14,
    gap: 14,
  },

  // Input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  clearInputBtn: {
    padding: 4,
  },

  // Destinations Grid
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.neutral[500],
    letterSpacing: 1,
  },
  destGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  destCard: {
    width: '48%',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    padding: 12,
    gap: 4,
  },
  destCardSelected: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[600],
  },
  destCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  destName: {
    fontSize: typography.sizes.xs,
    fontWeight: '800',
    color: colors.forest[950],
  },
  destNameSelected: {
    color: colors.forest[700],
  },
  destDesc: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '500',
  },

  // Nights Chips
  nightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nightChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  nightChipSelected: {
    backgroundColor: colors.forest[800],
    borderColor: colors.forest[900],
  },
  nightChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  nightChipTextSelected: {
    color: colors.lime[400],
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.lg,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resetBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  ctaWrapper: {
    flex: 1,
  },
});
