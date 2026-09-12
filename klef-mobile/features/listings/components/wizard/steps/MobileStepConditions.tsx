import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import {
  ScrollText,
  Zap,
  BatteryCharging,
  Plug,
  Smartphone,
  ShieldCheck,
  Wifi,
  KeyRound,
  Info,
  Check,
  Users,
  TrendingDown,
  Plus,
  Trash2,
  Moon,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import {
  useListingWizardFormStore,
  TarifPersonnes,
  TarifNuits,
} from '../../../stores/useListingWizardFormStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const REGLES_MAX = 1000;
const fcfaFormatter = (val: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(val);

const ELECTRICITY_MODES = [
  {
    id: 'INCLUS',
    label: '100% Inclus',
    desc: 'Électricité entièrement comprise dans le prix.',
    icon: Zap,
  },
  {
    id: 'FORFAIT_RECHARGE',
    label: 'Forfait offert',
    desc: 'Recharge initiale fournie à l’arrivée.',
    icon: BatteryCharging,
  },
  {
    id: 'WOYOFAL_LOCATAIRE',
    label: 'Woyofal voyageur',
    desc: 'Le voyageur recharge le compteur directement.',
    icon: Plug,
  },
] as const;

export function MobileStepConditions() {
  const {
    conditions,
    updateConditions,
    bien,
    annonce,
    tarifsPersonnes,
    addTarifPersonnes,
    removeTarifPersonnes,
    tarifsNuits,
    addTarifNuits,
    removeTarifNuits,
  } = useListingWizardFormStore();

  const capaciteMax = bien.capaciteMax ?? 1;
  const nuitesMinimum = annonce.nuitesMinimum ?? 1;
  const prixBase = annonce.prixBase ?? 0;

  const reglesLength = conditions.reglesMaison?.length ?? 0;
  const regimeElec = conditions.regimeElectricite ?? 'INCLUS';

  // Collapsible section states
  const [showPersonnes, setShowPersonnes] = useState<boolean>(tarifsPersonnes.length > 0);
  const [showNuits, setShowNuits] = useState<boolean>(tarifsNuits.length > 0);

  const togglePersonnes = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowPersonnes((prev) => !prev);
  };

  const toggleNuits = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowNuits((prev) => !prev);
  };

  // State for adding guest supplement tier
  const [pMin, setPMin] = useState<string>('');
  const [pMax, setPMax] = useState<string>('');
  const [pSup, setPSup] = useState<string>('');
  const [errP, setErrP] = useState<string | null>(null);

  // State for adding night discount tier
  const [discountInputMode, setDiscountInputMode] = useState<'pct' | 'fcfa'>('pct');
  const [nMin, setNMin] = useState<string>('');
  const [nMax, setNMax] = useState<string>('');
  const [nPrix, setNPrix] = useState<string>('');
  const [nPct, setNPct] = useState<string>('');
  const [errN, setErrN] = useState<string | null>(null);

  // Apply intelligent discount preset (or toggle off if already active)
  const handleApplyPreset = (minNuits: number, pctDiscount: number) => {
    if (!prixBase || prixBase <= 0) {
      Alert.alert(
        'Prix de base manquant',
        'Veuillez d’abord indiquer le tarif de base par nuitée à l’étape "Votre annonce" pour calculer les réductions.'
      );
      return;
    }
    const existingIndex = tarifsNuits.findIndex((t) => t.nuitsMin === minNuits);
    if (existingIndex >= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      removeTarifNuits(existingIndex);
    } else {
      const reducedPrice = Math.round(prixBase * (1 - pctDiscount / 100));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      addTarifNuits({ nuitsMin: minNuits, nuitsMax: null, prix: reducedPrice });
    }
  };

  const handleAddTarifPersonnes = () => {
    const minVal = parseInt(pMin, 10);
    const maxVal = parseInt(pMax, 10);
    const supVal = parseInt(pSup, 10);

    if (isNaN(minVal) || isNaN(maxVal) || isNaN(supVal)) {
      setErrP('Renseignez les trois champs numériques.');
      return;
    }
    if (maxVal < minVal) {
      setErrP('Le maximum doit être supérieur ou égal au minimum.');
      return;
    }
    const overlap = tarifsPersonnes.some(
      (t) => minVal <= t.personnesMax && maxVal >= t.personnesMin
    );
    if (overlap) {
      setErrP('Ce palier chevauche un palier existant.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addTarifPersonnes({ personnesMin: minVal, personnesMax: maxVal, supplement: supVal });
    setPMin('');
    setPMax('');
    setPSup('');
    setErrP(null);
  };

  const handleAddTarifNuits = () => {
    const minVal = parseInt(nMin, 10);
    const maxVal = nMax ? parseInt(nMax, 10) : null;
    let prixVal: number | typeof NaN = NaN;

    if (discountInputMode === 'pct') {
      const pctVal = parseFloat(nPct);
      if (!isNaN(pctVal) && pctVal > 0 && pctVal < 100 && prixBase > 0) {
        prixVal = Math.round(prixBase * (1 - pctVal / 100));
      }
    } else {
      prixVal = parseInt(nPrix, 10);
    }

    if (isNaN(minVal) || isNaN(prixVal)) {
      setErrN(
        discountInputMode === 'pct'
          ? 'Renseignez le nombre de nuits minimum et un pourcentage de réduction valide (ex: 15).'
          : 'Renseignez le nombre de nuits minimum et le prix réduit en FCFA.'
      );
      return;
    }
    if (maxVal !== null && maxVal < minVal) {
      setErrN('Le maximum doit être supérieur ou égal au minimum.');
      return;
    }
    if (prixBase > 0 && prixVal >= prixBase) {
      setErrN(`Le prix réduit doit être inférieur au prix de base (${fcfaFormatter(prixBase)} FCFA).`);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addTarifNuits({ nuitsMin: minVal, nuitsMax: maxVal, prix: prixVal });
    setNMin('');
    setNMax('');
    setNPrix('');
    setNPct('');
    setErrN(null);
  };

  const remisePreview = useMemo(() => {
    if (!prixBase || prixBase <= 0) return null;

    if (discountInputMode === 'pct') {
      const pct = parseFloat(nPct);
      if (isNaN(pct) || pct <= 0 || pct >= 100) return null;
      const calcPrice = Math.round(prixBase * (1 - pct / 100));
      const saving = prixBase - calcPrice;
      return { pct, price: calcPrice, saving };
    } else {
      const pVal = parseInt(nPrix, 10);
      if (isNaN(pVal) || pVal <= 0 || pVal >= prixBase) return null;
      const pct = Math.round(((prixBase - pVal) / prixBase) * 100);
      const saving = prixBase - pVal;
      return { pct, price: pVal, saving };
    }
  }, [prixBase, nPrix, nPct, discountInputMode]);

  return (
    <View style={styles.container}>
      {/* ── SECTION 1 : Règles de la maison ───────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <ScrollText size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Règles de la maison</Text>
            <Text style={styles.sectionDesc}>Consignes affichées au voyageur avant la réservation</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Règles intérieures</Text>
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textarea}
              value={conditions.reglesMaison}
              maxLength={REGLES_MAX}
              onChangeText={(txt) => updateConditions({ reglesMaison: txt })}
              placeholder={"Ex :\n• Pas de fêtes ni d'événements bruyants\n• Animaux non admis\n• Interdiction de fumer à l'intérieur\n• Respect du calme du quartier après 22h"}
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
          <View style={styles.helperRow}>
            <Text style={styles.helperText}>Ces consignes seront lues et acceptées avant le paiement.</Text>
            <Text style={[styles.counterText, reglesLength > REGLES_MAX - 50 && styles.warningCounter]}>
              {reglesLength} / {REGLES_MAX}
            </Text>
          </View>
        </View>
      </View>

      {/* ── SECTION 2 : Gestion de l'Électricité & Woyofal ───────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Zap size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Gestion de l’Électricité & Woyofal</Text>
            <Text style={styles.sectionDesc}>Précisez le mode de gestion de l’électricité pour le séjour</Text>
          </View>
        </View>

        {/* Info Banner Woyofal */}
        <View style={styles.infoBanner}>
          <Info size={16} color={colors.forest[700]} />
          <Text style={styles.infoBannerText}>
            Au Sénégal, la clarté sur la gestion du compteur Woyofal prévient tout malentendu lors de l’utilisation de la climatisation.
          </Text>
        </View>

        {/* 3 Choice Cards Stack */}
        <View style={styles.elecStack}>
          {ELECTRICITY_MODES.map((mode) => {
            const isSelected = regimeElec === mode.id;
            const ModeIcon = mode.icon;

            return (
              <TouchableOpacity
                key={mode.id}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  updateConditions({ regimeElectricite: mode.id as any });
                }}
                style={[
                  styles.elecCard,
                  isSelected && styles.elecCardSelected,
                ]}
              >
                <View style={[styles.elecIconBox, isSelected && styles.elecIconBoxSelected]}>
                  <ModeIcon
                    size={18}
                    color={isSelected ? colors.forest[950] : colors.neutral[600]}
                    strokeWidth={2.2}
                  />
                </View>

                <View style={styles.elecTextStack}>
                  <Text style={[styles.elecTitle, isSelected && styles.elecTitleSelected]}>
                    {mode.label}
                  </Text>
                  <Text style={styles.elecDesc}>{mode.desc}</Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleLimeActive]}>
                  {isSelected && <Check size={11} color={colors.forest[950]} strokeWidth={3.5} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Details Textarea if NOT INCLUS */}
        {regimeElec !== 'INCLUS' && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Précisions ou quota (ex: Recharge de 5 000 FCFA offerte)
            </Text>
            <View style={styles.textareaWrapper}>
              <TextInput
                style={styles.textareaSmall}
                value={conditions.detailsElectricite ?? ''}
                maxLength={500}
                onChangeText={(txt) => updateConditions({ detailsElectricite: txt })}
                placeholder="Ex : Une recharge Woyofal de 5 000 FCFA est mise à disposition à votre arrivée. Les recharges supplémentaires sont achetées via Wave ou Orange Money."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}
      </View>

      {/* ── SECTION 3 : Suppléments Voyageurs ──────────────────────────── */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={togglePersonnes}
          style={[styles.sectionCardHeader, !showPersonnes && styles.sectionCardHeaderClosed]}
        >
          <View style={styles.sectionIconCircle}>
            <Users size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.sectionTitle}>Suppléments voyageurs</Text>
              {tarifsPersonnes.length > 0 ? (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>
                    {tarifsPersonnes.length} PALIER{tarifsPersonnes.length > 1 ? 'S' : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>OPTIONNEL</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionDesc}>
              Au-delà de {capaciteMax} personne{capaciteMax > 1 ? 's' : ''} incluse{capaciteMax > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.chevronBox}>
            {showPersonnes ? (
              <ChevronUp size={18} color={colors.neutral[500]} />
            ) : (
              <ChevronDown size={18} color={colors.neutral[500]} />
            )}
          </View>
        </TouchableOpacity>

        {showPersonnes && (
          <View style={styles.sectionContentStack}>
            <View style={styles.infoBanner}>
              <Info size={16} color={colors.forest[700]} />
              <Text style={styles.infoBannerText}>
                Le tarif de base couvre <Text style={styles.boldText}>{capaciteMax}</Text> voyageur{capaciteMax > 1 ? 's' : ''}. Vous pouvez définir un tarif additionnel par palier.
              </Text>
            </View>

            {/* Existing Tiers List */}
            {tarifsPersonnes.length > 0 && (
              <View style={styles.tiersStack}>
                {tarifsPersonnes.map((t, idx) => (
                  <View key={`${t.personnesMin}-${t.personnesMax}`} style={styles.tierRow}>
                    <View style={styles.tierLeft}>
                      <Users size={15} color={colors.forest[700]} />
                      <Text style={styles.tierLabel}>
                        {t.personnesMin} à {t.personnesMax} personnes
                      </Text>
                    </View>
                    <View style={styles.tierRight}>
                      <Text style={styles.tierValue}>+{fcfaFormatter(t.supplement)} FCFA</Text>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          removeTarifPersonnes(idx);
                        }}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={14} color={colors.error[600]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Form Add Guest Tier */}
            <View style={styles.addTierBox}>
              <Text style={styles.addTierHeader}>AJOUTER UN PALIER DE VOYAGEURS</Text>
              <View style={styles.threeInputsRow}>
                <View style={styles.colInput}>
                  <Text style={styles.inputMicroLabel}>Pers. min</Text>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="numeric"
                    value={pMin}
                    onChangeText={setPMin}
                    placeholder={String(capaciteMax + 1)}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={styles.colInput}>
                  <Text style={styles.inputMicroLabel}>Pers. max</Text>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="numeric"
                    value={pMax}
                    onChangeText={setPMax}
                    placeholder="Max"
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
                <View style={styles.colInputFlex}>
                  <Text style={styles.inputMicroLabel}>Suppl. (FCFA)</Text>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="numeric"
                    value={pSup}
                    onChangeText={setPSup}
                    placeholder="5000"
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>
              </View>

              {errP && <Text style={styles.errorMsg}>{errP}</Text>}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAddTarifPersonnes}
                style={styles.addTierBtn}
              >
                <Plus size={14} color={colors.forest[950]} strokeWidth={3} />
                <Text style={styles.addTierBtnText}>Ajouter ce palier</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ── SECTION 4 : Réductions Longs Séjours (Tarifs Dégressifs) ──── */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={toggleNuits}
          style={[styles.sectionCardHeader, !showNuits && styles.sectionCardHeaderClosed]}
        >
          <View style={styles.sectionIconCircleLime}>
            <TrendingDown size={18} color={colors.forest[950]} strokeWidth={2.2} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.sectionTitle}>Tarifs dégressifs & Longs séjours</Text>
              {tarifsNuits.length > 0 ? (
                <View style={styles.activeDegressifBadge}>
                  <Sparkles size={10} color={colors.forest[950]} strokeWidth={3} />
                  <Text style={styles.activeDegressifBadgeText}>
                    {tarifsNuits.length} RÉDUCTION{tarifsNuits.length > 1 ? 'S' : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.optionBadge}>
                  <Text style={styles.optionBadgeText}>OPTIONNEL</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionDesc}>
              Attirez les voyageurs longue durée et maximisez votre taux d'occupation
            </Text>
          </View>
          <View style={styles.chevronBox}>
            {showNuits ? (
              <ChevronUp size={18} color={colors.neutral[500]} />
            ) : (
              <ChevronDown size={18} color={colors.neutral[500]} />
            )}
          </View>
        </TouchableOpacity>

        {showNuits && (
          <View style={styles.sectionContentStack}>
            {/* Banner Conseil Pro */}
            <View style={styles.degressifInfoBanner}>
              <Sparkles size={16} color={colors.forest[900]} strokeWidth={2.2} />
              <Text style={styles.degressifInfoText}>
                <Text style={styles.boldText}>Conseil Klef :</Text> Offrir 10% à 20% de réduction à partir de 7 nuits augmente vos réservations confirmées de 35%.
              </Text>
            </View>

            {/* ── Presets Intelligents (One-Tap) ── */}
            <View style={styles.presetsWrapper}>
              <Text style={styles.presetsHeader}>RACCOURCIS POPULAIRES (1 CLIC POUR ACTIVER / DÉSACTIVER)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsScrollContainer}
              >
                {[
                  { n: 7, pct: 15, label: '7+ nuits', sub: 'Tarif Semaine' },
                  { n: 14, pct: 20, label: '14+ nuits', sub: '2 Semaines' },
                  { n: 30, pct: 30, label: '30+ nuits', sub: 'Tarif Mensuel' },
                ].map(({ n, pct, label, sub }) => {
                  const isActive = tarifsNuits.some((t) => t.nuitsMin === n);
                  return (
                    <TouchableOpacity
                      key={n}
                      activeOpacity={0.8}
                      onPress={() => handleApplyPreset(n, pct)}
                      style={[styles.presetChip, isActive && styles.presetChipActive]}
                    >
                      <View style={styles.presetTopRow}>
                        <Text style={[styles.presetTitle, isActive && styles.presetTitleActive]}>{label}</Text>
                        <View style={[styles.presetTagLime, isActive && styles.presetTagActive]}>
                          <Text style={[styles.presetTagText, isActive && styles.presetTagTextActive]}>
                            {isActive ? '✓ -' + pct + '%' : '-' + pct + '%'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.presetSubtitle, isActive && styles.presetSubtitleActive]}>
                        {isActive ? 'Actif sur l’annonce' : sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* ── Paliers Dégressifs Déjà Ajoutés ── */}
            {tarifsNuits.length > 0 && (
              <View style={styles.degressifTiersStack}>
                <Text style={styles.addTierHeader}>PALIERS ACTIVÉS ({tarifsNuits.length})</Text>
                {tarifsNuits.map((t, idx) => {
                  const pctRemise = prixBase > 0 ? Math.round(((prixBase - t.prix) / prixBase) * 100) : null;
                  const economieParNuit = prixBase > 0 ? prixBase - t.prix : 0;
                  const isSemaine = t.nuitsMin === 7;
                  const isMois = t.nuitsMin === 30;

                  return (
                    <View key={`${t.nuitsMin}-${t.nuitsMax ?? 'inf'}`} style={styles.degressifCard}>
                      <View style={styles.degressifCardHeader}>
                        <View style={styles.degressifBadgeGroup}>
                          <View style={styles.degressifIconBox}>
                            <Moon size={15} color={colors.forest[800]} strokeWidth={2.2} />
                          </View>
                          <View style={styles.degressifTitleStack}>
                            <Text style={styles.degressifNuitsTitle}>
                              Dès {t.nuitsMin}{t.nuitsMax ? ` à ${t.nuitsMax}` : '+'} nuits
                            </Text>
                            <Text style={styles.degressifSubBadge}>
                              {isSemaine ? 'Semaine complète' : isMois ? 'Mois complet' : 'Séjour prolongé'}
                            </Text>
                          </View>
                        </View>

                        {pctRemise !== null && pctRemise > 0 && (
                          <View style={styles.remisePillBadge}>
                            <Sparkles size={11} color={colors.forest[800]} strokeWidth={2.5} />
                            <Text style={styles.remisePillText}>-{pctRemise}% DE REMISE</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.degressifCardDivider} />

                      <View style={styles.degressifPriceRow}>
                        <View style={styles.degressifPriceStack}>
                          {prixBase > 0 && t.prix < prixBase && (
                            <Text style={styles.degressifOldPrice}>{fcfaFormatter(prixBase)} FCFA</Text>
                          )}
                          <View style={styles.degressifNewPriceGroup}>
                            <Text style={styles.degressifNewPrice}>{fcfaFormatter(t.prix)} FCFA</Text>
                            <Text style={styles.degressifPerNight}>/ nuit</Text>
                          </View>
                        </View>

                        {economieParNuit > 0 && (
                          <View style={styles.economieBox}>
                            <Text style={styles.economieLabel}>Rabais voyageur</Text>
                            <Text style={styles.economieVal}>-{fcfaFormatter(economieParNuit)} F/nuit</Text>
                          </View>
                        )}

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            removeTarifNuits(idx);
                          }}
                          style={styles.deleteTierBtn}
                        >
                          <Trash2 size={15} color={colors.error[600]} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Formulaire de Saisie Personnalisé ── */}
            <View style={styles.addDegressifBox}>
              <View style={styles.degressifHeaderStack}>
                <Text style={styles.addTierHeader}>PERSONNALISER UN PALIER DÉGRESSIF</Text>

                {/* Mode Switcher (% / FCFA) */}
                <View style={styles.modeSwitchBox}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setDiscountInputMode('pct');
                    }}
                    style={[styles.modeSwitchBtn, discountInputMode === 'pct' && styles.modeSwitchBtnActive]}
                  >
                    <Text style={[styles.modeSwitchText, discountInputMode === 'pct' && styles.modeSwitchTextActive]}>
                      % Réduction
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setDiscountInputMode('fcfa');
                    }}
                    style={[styles.modeSwitchBtn, discountInputMode === 'fcfa' && styles.modeSwitchBtnActive]}
                  >
                    <Text style={[styles.modeSwitchText, discountInputMode === 'fcfa' && styles.modeSwitchTextActive]}>
                      Prix FCFA
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.threeInputsRow}>
                <View style={styles.colInputFlex}>
                  <Text style={styles.inputMicroLabel} numberOfLines={1}>Nuits min *</Text>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="numeric"
                    value={nMin}
                    onChangeText={setNMin}
                    placeholder={String(nuitesMinimum + 1)}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>

                <View style={styles.colInputFlex}>
                  <Text style={styles.inputMicroLabel} numberOfLines={1}>Nuits max</Text>
                  <TextInput
                    style={styles.numInput}
                    keyboardType="numeric"
                    value={nMax}
                    onChangeText={setNMax}
                    placeholder="Max"
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>

                <View style={styles.colInputFlex}>
                  <Text style={styles.inputMicroLabel} numberOfLines={1}>
                    {discountInputMode === 'pct' ? 'Réduction %' : 'Prix FCFA'}
                  </Text>
                  {discountInputMode === 'pct' ? (
                    <TextInput
                      style={styles.numInputBold}
                      keyboardType="numeric"
                      value={nPct}
                      onChangeText={setNPct}
                      placeholder="Ex : 15"
                      placeholderTextColor={colors.neutral[400]}
                    />
                  ) : (
                    <TextInput
                      style={styles.numInputBold}
                      keyboardType="numeric"
                      value={nPrix}
                      onChangeText={setNPrix}
                      placeholder={prixBase ? String(Math.round(prixBase * 0.85)) : 'Prix FCFA'}
                      placeholderTextColor={colors.neutral[400]}
                    />
                  )}
                </View>
              </View>

              {/* Simulateur de remise en direct */}
              {remisePreview && !errN && (
                <View style={styles.liveSimulatorCard}>
                  <Sparkles size={14} color={colors.forest[800]} strokeWidth={2.2} />
                  <View style={styles.liveSimulatorStack}>
                    <Text style={styles.liveSimulatorTitle}>
                      Prix réduit : <Text style={styles.boldText}>{fcfaFormatter(remisePreview.price)} FCFA / nuit</Text> ( Remise -{remisePreview.pct}% )
                    </Text>
                    <Text style={styles.liveSimulatorDesc}>
                      Le voyageur économise {fcfaFormatter(remisePreview.saving)} FCFA par nuitée sur son séjour.
                    </Text>
                  </View>
                </View>
              )}

              {errN && <Text style={styles.errorMsg}>{errN}</Text>}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleAddTarifNuits}
                style={styles.addTierBtnLime}
              >
                <Plus size={15} color={colors.forest[950]} strokeWidth={3} />
                <Text style={styles.addTierBtnTextLime}>Valider et ajouter ce tarif dégressif</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ── SECTION 5 : Livret d'accueil digital & Accès ───────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Smartphone size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.sectionTitle}>Livret d’accueil digital & Accès</Text>
              <View style={styles.recomBadge}>
                <Text style={styles.recomBadgeText}>RECOMMANDÉ</Text>
              </View>
            </View>
            <Text style={styles.sectionDesc}>
              Informations d’arrivée communiquées en toute sécurité au voyageur après réservation
            </Text>
          </View>
        </View>

        {/* Confidentiality Shield Info Box */}
        <View style={styles.shieldBanner}>
          <ShieldCheck size={18} color={colors.forest[800]} />
          <Text style={styles.shieldBannerText}>
            Ces données confidentielles ne seront jamais publiques et seront transmises uniquement au voyageur dont la réservation est confirmée et réglée.
          </Text>
        </View>

        {/* Wifi SSID */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nom du réseau Wi-Fi</Text>
          <View style={styles.inputWrapper}>
            <Wifi size={18} color={colors.forest[700]} />
            <TextInput
              style={styles.textInput}
              value={conditions.nomReseauWifi}
              onChangeText={(txt) => updateConditions({ nomReseauWifi: txt })}
              placeholder="Ex : Klef_Residence_5G"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </View>

        {/* Wifi Code */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Mot de passe Wi-Fi</Text>
          <View style={styles.inputWrapper}>
            <KeyRound size={18} color={colors.forest[700]} />
            <TextInput
              style={styles.textInput}
              value={conditions.codeWifi}
              onChangeText={(txt) => updateConditions({ codeWifi: txt })}
              placeholder="Ex : Dakar2026!"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </View>

        {/* Digicode / Keybox */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Digicode / Boîte à clés</Text>
          <View style={styles.inputWrapper}>
            <ShieldCheck size={18} color={colors.forest[700]} />
            <TextInput
              style={styles.textInput}
              value={conditions.instructionsDigicode}
              onChangeText={(txt) => updateConditions({ instructionsDigicode: txt })}
              placeholder="Ex : Code portail #4829 - Boîte à clés code 1234"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </View>

        {/* Instructions d'accès */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Instructions d'accès & arrivée</Text>
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textareaSmall}
              value={conditions.instructionsAcces}
              maxLength={1000}
              onChangeText={(txt) => updateConditions({ instructionsAcces: txt })}
              placeholder="Ex : Ascenseur jusqu'au 3ème étage, porte de droite. La clé se trouve dans le boîtier sécurisé à côté de la porte."
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
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
  sectionCardHeaderClosed: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContentStack: {
    gap: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
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
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 16,
    color: colors.forest[950],
    flex: 1,
  },
  recomBadge: {
    backgroundColor: colors.forest[100],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  recomBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[800],
    letterSpacing: 0.4,
  },
  optionBadge: {
    backgroundColor: colors.neutral[100],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  optionBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[600],
    letterSpacing: 0.4,
  },
  activeBadge: {
    backgroundColor: colors.forest[100],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  activeBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[800],
    letterSpacing: 0.4,
  },
  activeDegressifBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lime[200],
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  activeDegressifBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[950],
    letterSpacing: 0.4,
  },
  sectionDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
  },

  // Field Labels & Groups
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  boldText: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  // Textarea & Inputs
  textareaWrapper: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    minHeight: 110,
  },
  textarea: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[900],
    lineHeight: 19,
  },
  textareaSmall: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 13,
    color: colors.neutral[900],
    lineHeight: 19,
    minHeight: 70,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 14,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 13.5,
    color: colors.neutral[900],
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  helperText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    flex: 1,
  },
  counterText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.neutral[400],
  },
  warningCounter: {
    color: colors.warning[600],
  },

  // Info Banners
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.forest[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.forest[200],
    padding: 12,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.forest[900],
    lineHeight: 17,
  },
  shieldBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.forest[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.forest[200],
    padding: 12,
  },
  shieldBannerText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.forest[900],
    lineHeight: 17,
  },

  // Elec Cards Stack
  elecStack: {
    gap: 10,
  },
  elecCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  elecCardSelected: {
    borderColor: colors.forest[600],
    backgroundColor: colors.forest[50],
  },
  elecIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  elecIconBoxSelected: {
    backgroundColor: colors.lime[400],
  },
  elecTextStack: {
    flex: 1,
    gap: 2,
  },
  elecTitle: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13.5,
    color: colors.neutral[900],
  },
  elecTitleSelected: {
    fontFamily: typography.fontDisplaySemiBold,
    color: colors.forest[950],
  },
  elecDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    lineHeight: 15,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleLimeActive: {
    backgroundColor: colors.lime[400],
    borderColor: colors.lime[400],
  },

  // Section 4 : Tarifs Dégressifs Premium Styles
  sectionIconCircleLime: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  degressifInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.forest[50],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.forest[200],
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  degressifInfoText: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[950],
    lineHeight: 17,
  },

  // Presets Intelligents
  presetsWrapper: {
    gap: 8,
    marginTop: 4,
  },
  presetsHeader: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: colors.neutral[500],
    letterSpacing: 0.6,
  },
  presetsScrollContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  presetChip: {
    minWidth: 125,
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 12,
    gap: 6,
    ...shadows.xs,
  },
  presetChipActive: {
    borderColor: colors.forest[600],
    backgroundColor: colors.forest[50],
  },
  presetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  presetTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13,
    color: colors.forest[950],
  },
  presetTitleActive: {
    color: colors.forest[950],
  },
  presetSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  presetSubtitleActive: {
    fontFamily: typography.fontBodyMedium,
    color: colors.forest[700],
  },
  presetTagLime: {
    backgroundColor: colors.lime[400],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  presetTagActive: {
    backgroundColor: colors.forest[800],
  },
  presetTagText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[950],
  },
  presetTagTextActive: {
    color: colors.neutral[0],
  },
  degressifHeaderStack: {
    gap: 8,
    marginBottom: 4,
  },
  modeSwitchBox: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[200],
    borderRadius: radius.pill,
    padding: 3,
    alignSelf: 'flex-start',
  },
  modeSwitchBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  modeSwitchBtnActive: {
    backgroundColor: colors.neutral[0],
    ...shadows.xs,
  },
  modeSwitchText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[600],
  },
  modeSwitchTextActive: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },

  // Degressif Tiers Stack & Cards
  degressifTiersStack: {
    gap: 10,
    marginTop: 4,
  },
  degressifCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    gap: 12,
    ...shadows.xs,
  },
  degressifCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  degressifBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  degressifIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  degressifTitleStack: {
    gap: 1,
  },
  degressifNuitsTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  degressifSubBadge: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[500],
  },
  remisePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.lime[100],
    borderWidth: 1,
    borderColor: colors.lime[300],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  remisePillText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: colors.forest[900],
    letterSpacing: 0.3,
  },
  degressifCardDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
  },
  degressifPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  degressifPriceStack: {
    gap: 1,
  },
  degressifOldPrice: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.neutral[400],
    textDecorationLine: 'line-through',
  },
  degressifNewPriceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  degressifNewPrice: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  degressifPerNight: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },
  economieBox: {
    backgroundColor: colors.lime[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.inner,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: colors.lime[200],
  },
  economieLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 9.5,
    color: colors.forest[700],
  },
  economieVal: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[900],
  },
  deleteTierBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tiers Voyageurs (Section 3)
  tiersStack: {
    gap: 8,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  tierRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tierValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[600],
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTierBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginTop: 4,
  },
  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.lime[400],
    borderRadius: radius.pill,
    height: 40,
    paddingHorizontal: 16,
    ...shadows.xs,
  },
  addTierBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },

  // Add Degressif Box
  addDegressifBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginTop: 4,
  },
  addTierHeader: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: colors.neutral[500],
    letterSpacing: 0.6,
  },
  threeInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colInput: {
    width: 76,
    gap: 4,
  },
  colInputFlex: {
    flex: 1,
    gap: 4,
  },
  inputMicroLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10.5,
    color: colors.neutral[600],
  },
  numInput: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingHorizontal: 10,
    height: 42,
    fontFamily: typography.fontBodySemiBold,
    fontSize: 13,
    color: colors.neutral[900],
  },
  numInputBold: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.field,
    borderWidth: 1,
    borderColor: colors.forest[600],
    paddingHorizontal: 12,
    height: 42,
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
  liveSimulatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.lime[100],
    borderRadius: radius.inner,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.lime[300],
  },
  liveSimulatorStack: {
    flex: 1,
    gap: 2,
  },
  liveSimulatorTitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.forest[950],
  },
  liveSimulatorDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[800],
  },
  addTierBtnLime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    borderRadius: radius.pill,
    height: 44,
    paddingHorizontal: 16,
    marginTop: 2,
    ...shadows.xs,
  },
  addTierBtnTextLime: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  errorMsg: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11.5,
    color: colors.error[600],
  },
});
