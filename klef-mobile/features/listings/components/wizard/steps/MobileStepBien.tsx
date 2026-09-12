import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  Building2,
  TreePine,
  BedDouble,
  Home,
  Users,
  DoorOpen,
  BedSingle,
  Bath,
  MapPin,
  Check,
  CheckCircle2,
  ChevronDown,
  Navigation,
  Plus,
  Minus,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { useListingWizardFormStore } from '../../../stores/useListingWizardFormStore';

const TYPE_LOGEMENT_WEB = [
  {
    id: 'APPARTEMENT',
    label: 'Appartement',
    subtitle: 'Studio, F2, F3, Penthouse...',
    icon: Building2,
  },
  {
    id: 'VILLA',
    label: 'Villa',
    subtitle: 'Piscine, bord de mer...',
    icon: TreePine,
  },
  {
    id: 'CHAMBRE',
    label: 'Chambre',
    subtitle: 'Meublée, suite parentale...',
    icon: BedDouble,
  },
  {
    id: 'AUTRES',
    label: 'Autres',
    subtitle: 'Hôtel, résidence, gîte...',
    icon: Home,
  },
];

const SOUS_TYPES: Record<string, string[]> = {
  APPARTEMENT: ['Studio', 'Appartement F2', 'Appartement F3', 'Appartement F4+', 'Penthouse', 'Loft'],
  VILLA: ['Villa simple', 'Villa avec piscine', 'Villa bord de mer', 'Villa de luxe', 'Villa familiale', 'Villa pour événement'],
  CHAMBRE: ['Chambre meublée', 'Suite meublée'],
  AUTRES: ['Résidence hôtelière', 'Hôtel', 'Auberge / Gîte', 'Maison entière', 'Duplex', 'Riad / Maison traditionnelle', 'Cabane / Logement atypique', 'Résidence étudiante'],
};

const ZONES_SENEGAL_DATA: Record<string, string[]> = {
  'Dakar': [
    'Almadies', 'Ngor', 'Virage', 'Les Mamelles', 'Ouakam', 'Mermoz', 'Fann Résidence', 'Fann Hock',
    'Point E', 'Sacré-Cœur 1', 'Sacré-Cœur 2', 'Sacré-Cœur 3', 'Cité Keur Gorgui', 'Nord Foire',
    'Ouest Foire', 'Yoff Aéroport', 'Yoff Virage', 'Hann Maristes 1', 'Plateau', 'Médina',
    'Parcelles Assainies', 'Guédiawaye', 'Pikine', 'Rufisque', 'Diamniadio',
  ],
  'Petite Côte': [
    'Saly Portudal', 'Saly Niakh Niakhal', 'Saly Joseph', 'Ngaparou', 'Somone', 'Popenguine',
    'Toubab Dialaw', 'Mbour', 'Warang', 'Nianing', 'Pointe Sarène', 'Joal-Fadiouth',
  ],
  'Autres destinations': [
    'Saint-Louis', 'Cap Skirring', 'Ziguinchor', 'Gorée', 'Lac Rose', 'Thiès', 'Lompoul',
  ],
};

export function MobileStepBien() {
  const { bien, updateBien } = useListingWizardFormStore();

  const [selectedZone, setSelectedZone] = useState<string>(() => {
    for (const [z, villes] of Object.entries(ZONES_SENEGAL_DATA)) {
      if (villes.includes(bien.ville)) return z;
    }
    return 'Dakar';
  });

  const [showSousTypeDropdown, setShowSousTypeDropdown] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showVilleDropdown, setShowVilleDropdown] = useState(false);

  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const sousTypesList = bien.type ? SOUS_TYPES[bien.type] || [] : [];
  const villesList = selectedZone ? ZONES_SENEGAL_DATA[selectedZone] || [] : [];

  const handleFetchGpsLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(false);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission géolocalisation refusée.');
        setIsLocating(false);
        return;
      }

      const userLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = userLoc.coords;
      const reverseResults = await Location.reverseGeocodeAsync({ latitude, longitude });

      let detectedCity = bien.ville || 'Dakar';
      let detectedAddress = bien.adresse || '';

      if (reverseResults && reverseResults.length > 0) {
        const place = reverseResults[0];
        if (place.district || place.city || place.subregion) {
          detectedCity = place.district || place.city || place.subregion || detectedCity;
        }
        detectedAddress = [place.street, place.district, place.subregion].filter(Boolean).join(', ');
      }

      updateBien({
        latitude,
        longitude,
        ville: detectedCity,
        adresse: detectedAddress || bien.adresse || 'Coordonnées GPS capturées',
      });

      setLocationSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      console.warn('[MobileStepBien] Erreur GPS :', err);
      setLocationError('Impossible de détecter la position GPS.');
    } finally {
      setIsLocating(false);
    }
  };

  const updateCounter = (field: 'nombreChambres' | 'nombreSallesBain' | 'nombrePieces' | 'capaciteMax', delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const current = bien[field] ?? 1;
    const updated = Math.max(0, current + delta);
    updateBien({ [field]: updated });
  };

  return (
    <View style={styles.container}>
      {/* ── SECTION 1 : Type de logement ───────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Building2 size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Type de logement</Text>
            <Text style={styles.sectionDesc}>La catégorie qui décrit le mieux votre bien</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>
          Type principal <Text style={styles.asterisk}>*</Text>
        </Text>

        {/* 4 Ultra-Premium Category Cards */}
        <View style={styles.typeGrid}>
          {TYPE_LOGEMENT_WEB.map((t) => {
            const isSelected = bien.type === t.id;
            const IconComp = t.icon;

            return (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.82}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  updateBien({ type: t.id, sousType: '' });
                }}
                style={[styles.typeCardPremium, isSelected && styles.typeCardPremiumSelected]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.typeIconBoxPremium, isSelected && styles.typeIconBoxPremiumSelected]}>
                    <IconComp size={20} color={isSelected ? colors.forest[950] : colors.forest[800]} strokeWidth={2.2} />
                  </View>

                  {isSelected && (
                    <View style={styles.checkBadgeLime}>
                      <Check size={11} color={colors.forest[950]} strokeWidth={3} />
                    </View>
                  )}
                </View>

                <View style={styles.cardTextStack}>
                  <Text style={[styles.typeLabelPremium, isSelected && styles.typeLabelPremiumSelected]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.typeSubtitlePremium, isSelected && styles.typeSubtitlePremiumSelected]} numberOfLines={1}>
                    {t.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Type précis (Sous-type Dropdown Scrollable) */}
        {sousTypesList.length > 0 && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Type précis <Text style={styles.asterisk}>*</Text>
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSousTypeDropdown((prev) => !prev)}
              style={styles.dropdownSelectBtn}
            >
              <Text style={bien.sousType ? styles.dropdownValText : styles.dropdownPlaceholderText}>
                {bien.sousType || 'Sélectionnez le sous-type'}
              </Text>
              <ChevronDown size={18} color={colors.neutral[500]} />
            </TouchableOpacity>

            {showSousTypeDropdown && (
              <ScrollView
                style={styles.dropdownMenu}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {sousTypesList.map((st) => (
                  <TouchableOpacity
                    key={st}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      updateBien({ sousType: st });
                      setShowSousTypeDropdown(false);
                    }}
                    style={styles.dropdownMenuItem}
                  >
                    <Text style={[styles.dropdownMenuText, bien.sousType === st && styles.dropdownMenuTextSelected]}>
                      {st}
                    </Text>
                    {bien.sousType === st && <Check size={16} color={colors.forest[800]} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* ── SECTION 2 : Capacité et composition ─────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Users size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Capacité et composition</Text>
            <Text style={styles.sectionDesc}>Personnes accueillies, pièces et salles de bain</Text>
          </View>
        </View>

        {/* Grouped Counter Card */}
        <View style={styles.counterGroupCard}>
          {/* Capacité Max */}
          <View style={styles.counterItemRow}>
            <View style={styles.counterLeftStack}>
              <View style={styles.counterLeftTitleGroup}>
                <Users size={16} color={colors.forest[800]} />
                <Text style={styles.counterTitle}>Capacité d’accueil</Text>
              </View>
              <Text style={styles.counterHint}>Nombre maximum de voyageurs</Text>
            </View>

            <View style={styles.stepperBox}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateCounter('capaciteMax', -1)}
                style={styles.stepBtn}
              >
                <Minus size={15} color={colors.forest[950]} />
              </TouchableOpacity>
              <Text style={styles.stepValueText}>{bien.capaciteMax}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateCounter('capaciteMax', 1)}
                style={styles.stepBtn}
              >
                <Plus size={15} color={colors.forest[950]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Pièces */}
          <View style={styles.counterItemRow}>
            <View style={styles.counterLeftTitleGroup}>
              <DoorOpen size={16} color={colors.forest[800]} />
              <Text style={styles.counterTitle}>Pièces</Text>
            </View>

            <View style={styles.stepperBox}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateCounter('nombrePieces', -1)}
                style={styles.stepBtn}
              >
                <Minus size={15} color={colors.forest[950]} />
              </TouchableOpacity>
              <Text style={styles.stepValueText}>{bien.nombrePieces}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateCounter('nombrePieces', 1)}
                style={styles.stepBtn}
              >
                <Plus size={15} color={colors.forest[950]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Chambres */}
          <View style={styles.counterItemRow}>
            <View style={styles.counterLeftTitleGroup}>
              <BedSingle size={16} color={colors.forest[800]} />
              <Text style={styles.counterTitle}>Chambres</Text>
            </View>

            <View style={styles.stepperBox}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateCounter('nombreChambres', -1)}
                style={styles.stepBtn}
              >
                <Minus size={15} color={colors.forest[950]} />
              </TouchableOpacity>
              <Text style={styles.stepValueText}>{bien.nombreChambres}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateCounter('nombreChambres', 1)}
                style={styles.stepBtn}
              >
                <Plus size={15} color={colors.forest[950]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Salles de bain */}
          <View style={styles.counterItemRow}>
            <View style={styles.counterLeftTitleGroup}>
              <Bath size={16} color={colors.forest[800]} />
              <Text style={styles.counterTitle}>Salles de bain</Text>
            </View>

            <View style={styles.stepperBox}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateCounter('nombreSallesBain', -1)}
                style={styles.stepBtn}
              >
                <Minus size={15} color={colors.forest[950]} />
              </TouchableOpacity>
              <Text style={styles.stepValueText}>{bien.nombreSallesBain}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => updateCounter('nombreSallesBain', 1)}
                style={styles.stepBtn}
              >
                <Plus size={15} color={colors.forest[950]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* ── SECTION 3 : Localisation ───────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <MapPin size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <Text style={styles.sectionDesc}>Zone, quartier et adresse précise</Text>
          </View>
        </View>

        {/* Zone ou Région */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Zone ou région <Text style={styles.asterisk}>*</Text>
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowZoneDropdown((prev) => !prev)}
            style={styles.dropdownSelectBtn}
          >
            <Text style={selectedZone ? styles.dropdownValText : styles.dropdownPlaceholderText}>
              {selectedZone || 'Sélectionnez la zone'}
            </Text>
            <ChevronDown size={18} color={colors.neutral[500]} />
          </TouchableOpacity>

          {showZoneDropdown && (
            <ScrollView
              style={styles.dropdownMenu}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {Object.keys(ZONES_SENEGAL_DATA).map((z) => (
                <TouchableOpacity
                  key={z}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedZone(z);
                    setShowZoneDropdown(false);
                    updateBien({ ville: '' });
                  }}
                  style={styles.dropdownMenuItem}
                >
                  <Text style={[styles.dropdownMenuText, selectedZone === z && styles.dropdownMenuTextSelected]}>
                    {z}
                  </Text>
                  {selectedZone === z && <Check size={16} color={colors.forest[800]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Ville ou Quartier */}
        {selectedZone && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {selectedZone === 'Dakar' ? 'Quartier' : 'Ville ou destination'} <Text style={styles.asterisk}>*</Text>
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowVilleDropdown((prev) => !prev)}
              style={styles.dropdownSelectBtn}
            >
              <Text style={bien.ville ? styles.dropdownValText : styles.dropdownPlaceholderText}>
                {bien.ville || (selectedZone === 'Dakar' ? 'Sélectionnez le quartier' : 'Sélectionnez la destination')}
              </Text>
              <ChevronDown size={18} color={colors.neutral[500]} />
            </TouchableOpacity>

            {showVilleDropdown && (
              <ScrollView
                style={styles.dropdownMenu}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {villesList.map((v) => (
                  <TouchableOpacity
                    key={v}
                    activeOpacity={0.7}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      updateBien({ ville: v });
                      setShowVilleDropdown(false);
                    }}
                    style={styles.dropdownMenuItem}
                  >
                    <Text style={[styles.dropdownMenuText, bien.ville === v && styles.dropdownMenuTextSelected]}>
                      {v}
                    </Text>
                    {bien.ville === v && <Check size={16} color={colors.forest[800]} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Adresse précise */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Adresse précise <Text style={styles.asterisk}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={bien.adresse}
              onChangeText={(txt) => updateBien({ adresse: txt })}
              placeholder="Rue, résidence ou point de repère"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </View>

        {/* GPS Location Capture Option */}
        <View style={styles.gpsBoxCard}>
          <View style={styles.gpsBoxContent}>
            <Text style={styles.gpsBoxTitle}>Coordonnées GPS (Optionnel)</Text>
            <Text style={styles.gpsBoxDesc}>
              Si vous êtes sur place, capturez la position exacte de ce logement pour maximiser vos réservations.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleFetchGpsLocation}
            disabled={isLocating}
            style={styles.gpsCaptureBtnWeb}
          >
            {isLocating ? (
              <ActivityIndicator color={colors.forest[800]} size="small" />
            ) : (
              <MapPin size={15} color={colors.forest[600]} />
            )}
            <Text style={styles.gpsCaptureBtnWebText}>
              {bien.latitude && bien.longitude
                ? `📍 Capturé (${Number(bien.latitude).toFixed(3)}, ${Number(bien.longitude).toFixed(3)})`
                : '📍 Capturer ma position GPS'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },

  // Section Card
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

  // Field Labels
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  asterisk: {
    color: colors.error[600],
  },

  // 4 Ultra-Premium Main Category Cards
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCardPremium: {
    width: '48%',
    minHeight: 112,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  typeCardPremiumSelected: {
    backgroundColor: colors.forest[950],
    borderColor: colors.lime[400],
    borderWidth: 1.5,
    ...shadows.action,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeIconBoxPremium: {
    width: 38,
    height: 38,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconBoxPremiumSelected: {
    backgroundColor: colors.lime[400],
  },
  checkBadgeLime: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextStack: {
    gap: 3,
    marginTop: 10,
  },
  typeLabelPremium: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 14,
    color: colors.forest[950],
  },
  typeLabelPremiumSelected: {
    color: colors.neutral[0],
  },
  typeSubtitlePremium: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },
  typeSubtitlePremiumSelected: {
    color: colors.lime[300],
  },

  // Dropdowns
  dropdownSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 14,
    height: 46,
  },
  dropdownValText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  dropdownPlaceholderText: {
    fontFamily: typography.fontBody,
    fontSize: 13.5,
    color: colors.neutral[400],
  },
  dropdownMenu: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    maxHeight: 220,
    marginTop: 4,
    ...shadows.float,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  dropdownMenuText: {
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[700],
  },
  dropdownMenuTextSelected: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  // Counter Group Card
  counterGroupCard: {
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
    overflow: 'hidden',
  },
  counterItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  counterLeftStack: {
    gap: 2,
    flex: 1,
    paddingRight: 8,
  },
  counterLeftTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  counterHint: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginLeft: 24,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  stepValueText: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    minWidth: 20,
    textAlign: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },

  // Inputs
  inputWrapper: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
  },
  textInput: {
    fontFamily: typography.fontBody,
    fontSize: 13.5,
    color: colors.neutral[900],
  },

  // GPS Box Web Mirror
  gpsBoxCard: {
    backgroundColor: colors.forest[50],
    borderRadius: radius.inner,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.forest[100],
    gap: 12,
    marginTop: 4,
  },
  gpsBoxContent: {
    gap: 2,
  },
  gpsBoxTitle: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  gpsBoxDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[600],
    lineHeight: 16,
  },
  gpsCaptureBtnWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.neutral[0],
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignSelf: 'flex-start',
    ...shadows.xs,
  },
  gpsCaptureBtnWebText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[800],
  },
});
