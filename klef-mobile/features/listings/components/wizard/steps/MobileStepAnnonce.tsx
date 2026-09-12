import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Pen,
  CircleDollarSign,
  Moon,
  Zap,
  Minus,
  Plus,
  Clock,
  ShieldCheck,
  TrendingUp,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { useListingWizardFormStore } from '../../../stores/useListingWizardFormStore';

const TITRE_MAX = 80;
const DESC_MAX = 2000;
const XOF_PER_EUR = 655.957;

const PRESETS = [
  { n: 1, label: '1 nuit' },
  { n: 2, label: '2 nuits' },
  { n: 3, label: '3 nuits' },
  { n: 7, label: '1 sem.' },
  { n: 14, label: '2 sem.' },
  { n: 30, label: '1 mois' },
] as const;

export function MobileStepAnnonce() {
  const { annonce, updateAnnonce } = useListingWizardFormStore();

  const titreLength = annonce.titre?.length ?? 0;
  const descLength = annonce.description?.length ?? 0;
  const prixBase = annonce.prixBase ?? 0;
  const minNuits = annonce.nuitesMinimum ?? 1;
  const isInstant = annonce.isInstantBooking ?? true;

  return (
    <View style={styles.container}>
      {/* ── SECTION 1 : Présentation ───────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Pen size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Présentation</Text>
            <Text style={styles.sectionDesc}>Le titre et la description que verront vos voyageurs</Text>
          </View>
        </View>

        {/* Titre de l'annonce */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Titre de l’annonce <Text style={styles.asterisk}>*</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={annonce.titre}
              maxLength={TITRE_MAX}
              onChangeText={(txt) => updateAnnonce({ titre: txt })}
              placeholder="Ex : Villa avec piscine à Saly, vue mer"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
          <View style={styles.helperRow}>
            <Text style={styles.helperText}>Mentionnez le quartier et l’atout principal</Text>
            <Text style={[styles.counterText, titreLength > TITRE_MAX - 10 && styles.warningCounter]}>
              {titreLength} / {TITRE_MAX}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Description <Text style={styles.asterisk}>*</Text>
          </Text>
          <View style={styles.textareaWrapper}>
            <TextInput
              style={styles.textarea}
              value={annonce.description}
              maxLength={DESC_MAX}
              onChangeText={(txt) => updateAnnonce({ description: txt })}
              placeholder="Ambiance, aménagements, points forts, accès, voisinage…"
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          <View style={styles.helperRow}>
            <Text style={styles.helperText}>
              {descLength < 100 ? '100 caractères minimum recommandés' : 'Bonne longueur'}
            </Text>
            <Text style={[styles.counterText, descLength > DESC_MAX - 100 && styles.warningCounter]}>
              {descLength} / {DESC_MAX}
            </Text>
          </View>
        </View>
      </View>

      {/* ── SECTION 2 : Tarif de base ──────────────────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <CircleDollarSign size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Tarif de base</Text>
            <Text style={styles.sectionDesc}>Votre prix par nuit, hors suppléments et réductions</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            Prix par nuit <Text style={styles.asterisk}>*</Text>
          </Text>

          {/* Dark Forest Card Container (Section-Inverse Web Mirror) */}
          <View style={styles.darkPriceCard}>
            <View style={styles.darkPriceHeaderRow}>
              <Text style={styles.darkPriceEyebrow}>PRIX DE BASE PAR NUITÉE</Text>
              <Text style={styles.darkPriceRequired}>Saisie obligatoire *</Text>
            </View>

            <View style={styles.darkPriceInputBox}>
              <TextInput
                style={styles.darkPriceInput}
                value={prixBase ? String(prixBase) : ''}
                onChangeText={(txt) => {
                  const cleaned = txt.replace(/\D/g, '');
                  updateAnnonce({ prixBase: cleaned ? Number(cleaned) : undefined });
                }}
                keyboardType="number-pad"
                placeholder="Ex : 45000"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
              />
              <View style={styles.darkCurrencyPill}>
                <Text style={styles.darkCurrencyText}>FCFA / nuit</Text>
              </View>
            </View>

            {prixBase > 0 ? (
              <Text style={styles.darkEuroConversion}>
                Environ {new Intl.NumberFormat('fr-FR').format(Math.round(prixBase / XOF_PER_EUR))} € par nuit
              </Text>
            ) : (
              <Text style={styles.darkPriceHint}>
                👉 Indiquez ici le tarif d’une nuitée pour votre logement en FCFA.
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ── SECTION 3 : Durée minimale de séjour ───────────────────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Moon size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Durée minimale de séjour</Text>
            <Text style={styles.sectionDesc}>
              Le nombre de nuits en dessous duquel vous n’acceptez pas de réservation
            </Text>
          </View>
        </View>

        {/* Display Stepper Box */}
        <View style={styles.stepperDisplayCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={minNuits <= 1}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              updateAnnonce({ nuitesMinimum: Math.max(1, minNuits - 1) });
            }}
            style={[styles.stepperCircleBtn, minNuits <= 1 && styles.stepperCircleBtnDisabled]}
          >
            <Minus size={16} color={minNuits <= 1 ? colors.neutral[300] : colors.forest[950]} />
          </TouchableOpacity>

          <View style={styles.stepperCenterStack}>
            <Text style={styles.stepperBigNum}>{minNuits}</Text>
            <Text style={styles.stepperSubtext}>
              nuit{minNuits > 1 ? 's' : ''} minimum
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={minNuits >= 365}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              updateAnnonce({ nuitesMinimum: Math.min(365, minNuits + 1) });
            }}
            style={[styles.stepperCircleBtn, minNuits >= 365 && styles.stepperCircleBtnDisabled]}
          >
            <Plus size={16} color={minNuits >= 365 ? colors.neutral[300] : colors.forest[950]} />
          </TouchableOpacity>
        </View>

        {/* 6 Preset Quick Pills */}
        <View style={styles.presetsGrid}>
          {PRESETS.map(({ n, label }) => {
            const isSelected = minNuits === n;
            return (
              <TouchableOpacity
                key={n}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  updateAnnonce({ nuitesMinimum: n });
                }}
                style={[styles.presetPill, isSelected && styles.presetPillSelected]}
              >
                <Text style={[styles.presetPillText, isSelected && styles.presetPillTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── SECTION 4 : Mode de Réservation (Réservation Instantanée Sublimée) ───────── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionCardHeader}>
          <View style={styles.sectionIconCircle}>
            <Zap size={18} color={colors.forest[800]} />
          </View>
          <View style={styles.sectionHeaderStack}>
            <Text style={styles.sectionTitle}>Mode de Réservation</Text>
            <Text style={styles.sectionDesc}>Choisissez comment vos voyageurs valident leurs réservations</Text>
          </View>
        </View>

        {/* Dual Mode Choice Cards */}
        <View style={styles.modeCardsStack}>
          {/* Mode 1: Instant Booking (Recommandé) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              updateAnnonce({ isInstantBooking: true });
            }}
            style={[styles.modeCard, isInstant && styles.modeCardInstantSelected]}
          >
            <View style={styles.modeCardTopRow}>
              <View style={styles.modeHeaderLeftGroup}>
                <View style={[styles.modeIconCircle, isInstant && styles.modeIconCircleLime]}>
                  <Zap size={18} color={isInstant ? colors.forest[950] : colors.forest[800]} strokeWidth={2.4} />
                </View>

                <View style={styles.badgeLimeRecommended}>
                  <Text style={styles.badgeLimeRecommendedText}>⚡ RECOMMANDÉ (+35% BOOST)</Text>
                </View>
              </View>

              <View style={[styles.radioCircle, isInstant && styles.radioCircleLimeActive]}>
                {isInstant && <Check size={12} color={colors.forest[950]} strokeWidth={3} />}
              </View>
            </View>

            <View style={styles.modeTextStack}>
              <Text style={[styles.modeTitle, isInstant && styles.modeTitleSelected]}>
                Réservation Instantanée
              </Text>
              <Text style={[styles.modeSubtitle, isInstant && styles.modeSubtitleLime]}>
                Les voyageurs vérifiés réservent directement sans attente de confirmation 24h.
              </Text>
            </View>

            {/* Perks Bullet List when Instant is Active */}
            {isInstant && (
              <View style={styles.perksContainer}>
                <View style={styles.perkRow}>
                  <Zap size={13} color={colors.lime[400]} />
                  <Text style={styles.perkText}>Confirmation immédiate 24/7 pour l'hôte et le voyageur</Text>
                </View>
                <View style={styles.perkRow}>
                  <ShieldCheck size={13} color={colors.lime[400]} />
                  <Text style={styles.perkText}>Réservé exclusivement aux profils vérifiés (KYC validé)</Text>
                </View>
                <View style={styles.perkRow}>
                  <TrendingUp size={13} color={colors.lime[400]} />
                  <Text style={styles.perkText}>Priorité de mise en avant dans les résultats de recherche Klef</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Mode 2: Demande Manuelle */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              updateAnnonce({ isInstantBooking: false });
            }}
            style={[styles.modeCard, !isInstant && styles.modeCardManualSelected]}
          >
            <View style={styles.modeCardTopRow}>
              <View style={styles.modeHeaderLeftGroup}>
                <View style={[styles.modeIconCircle, !isInstant && styles.modeIconCircleForest]}>
                  <Clock size={18} color={!isInstant ? colors.neutral[0] : colors.neutral[600]} strokeWidth={2.2} />
                </View>

                <View style={styles.badgeNeutral}>
                  <Text style={styles.badgeNeutralText}>VALIDATION SOUS 24H</Text>
                </View>
              </View>

              <View style={[styles.radioCircle, !isInstant && styles.radioCircleActive]}>
                {!isInstant && <Check size={12} color={colors.neutral[0]} strokeWidth={3} />}
              </View>
            </View>

            <View style={styles.modeTextStack}>
              <Text style={[styles.modeTitle, !isInstant && styles.modeTitleManualSelected]}>
                Demande de Réservation Manuelle
              </Text>
              <Text style={styles.modeSubtitle}>
                Vous recevez une notification et validez ou refusez chaque demande dans un délai de 24h.
              </Text>
            </View>
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
  textareaWrapper: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 14,
    minHeight: 120,
  },
  textarea: {
    flex: 1,
    fontFamily: typography.fontBody,
    fontSize: 13.5,
    color: colors.neutral[900],
    lineHeight: 20,
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
  },
  counterText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: colors.neutral[400],
  },
  warningCounter: {
    color: colors.warning[600],
  },

  // Dark Price Card (Section-Inverse Web Mirror)
  darkPriceCard: {
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    ...shadows.float,
  },
  darkPriceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkPriceEyebrow: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10.5,
    color: colors.forest[300],
    letterSpacing: 0.8,
  },
  darkPriceRequired: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.forest[200],
  },
  darkPriceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  darkPriceInput: {
    flex: 1,
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 22,
    color: colors.neutral[0],
  },
  darkCurrencyPill: {
    backgroundColor: colors.lime[400],
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  darkCurrencyText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11.5,
    color: colors.forest[950],
  },
  darkEuroConversion: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.forest[200],
  },
  darkPriceHint: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.forest[200],
  },

  // Stepper Display Card
  stepperDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  stepperCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  stepperCircleBtnDisabled: {
    opacity: 0.4,
    backgroundColor: colors.neutral[100],
  },
  stepperCenterStack: {
    alignItems: 'center',
    gap: 2,
  },
  stepperBigNum: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 28,
    color: colors.forest[950],
  },
  stepperSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[500],
  },

  // Presets Grid
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  presetPillSelected: {
    backgroundColor: colors.forest[100],
    borderColor: colors.forest[600],
  },
  presetPillText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 12,
    color: colors.neutral[600],
  },
  presetPillTextSelected: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[800],
  },

  // Mode Cards Stack (Section 4 Sublimée)
  modeCardsStack: {
    gap: 12,
  },
  modeCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },
  modeCardInstantSelected: {
    backgroundColor: colors.forest[950],
    borderColor: colors.lime[400],
    borderWidth: 1.5,
    ...shadows.action,
  },
  modeCardManualSelected: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.forest[600],
    borderWidth: 1.5,
    ...shadows.sm,
  },
  modeCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeHeaderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconCircleLime: {
    backgroundColor: colors.lime[400],
  },
  modeIconCircleForest: {
    backgroundColor: colors.forest[950],
  },
  badgeLimeRecommended: {
    backgroundColor: colors.lime[400],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  badgeLimeRecommendedText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.forest[950],
    letterSpacing: 0.3,
  },
  badgeNeutral: {
    backgroundColor: colors.neutral[100],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  badgeNeutralText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[700],
    letterSpacing: 0.3,
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
  radioCircleActive: {
    backgroundColor: colors.forest[800],
    borderColor: colors.forest[800],
  },

  modeTextStack: {
    gap: 4,
  },
  modeTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  modeTitleSelected: {
    color: colors.neutral[0],
  },
  modeTitleManualSelected: {
    color: colors.forest[950],
  },
  modeSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
    lineHeight: 16,
  },
  modeSubtitleLime: {
    color: colors.lime[300],
  },

  perksContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.inner,
    padding: 12,
    gap: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.neutral[100],
    flex: 1,
  },
});
