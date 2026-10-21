import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Minus,
  Plus,
  Send,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../theme/tokens';
import { apiClient } from '../../api/api-client';

interface MobileKlefManagedModalProps {
  visible: boolean;
  onClose: () => void;
}

const TYPES_BIEN = [
  'Appartement',
  'Studio',
  'Villa',
  'Chambre meublée',
  'Autre',
];

export function MobileKlefManagedModal({
  visible,
  onClose,
}: MobileKlefManagedModalProps) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('');
  const [typeBien, setTypeBien] = useState('Appartement');
  const [nombreLogements, setNombreLogements] = useState(1);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // --- Présentation animée (remplace le Modal.animationType par défaut) ---
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(420)).current;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          speed: 14,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 420,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsMounted(false);
        handleReset();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // --- Refs pour l'enchaînement clavier ---
  const nomRef = useRef<TextInput>(null);
  const telephoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // --- Rebond du stepper ---
  const stepperScale = useRef(new Animated.Value(1)).current;
  const bumpStepper = () => {
    stepperScale.setValue(1.18);
    Animated.spring(stepperScale, {
      toValue: 1,
      speed: 18,
      bounciness: 9,
      useNativeDriver: true,
    }).start();
  };

  // --- Pop de l'icône de succès ---
  const successScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (submitted) {
      Animated.spring(successScale, {
        toValue: 1,
        speed: 10,
        bounciness: 12,
        useNativeDriver: true,
      }).start();
    } else {
      successScale.setValue(0);
    }
  }, [submitted, successScale]);

  // --- Feedback tactile bouton principal ---
  const submitScale = useRef(new Animated.Value(1)).current;
  const handleSubmitPressIn = () => {
    Animated.spring(submitScale, { toValue: 0.97, speed: 40, bounciness: 4, useNativeDriver: true }).start();
  };
  const handleSubmitPressOut = () => {
    Animated.spring(submitScale, { toValue: 1, speed: 40, bounciness: 4, useNativeDriver: true }).start();
  };

  const handleReset = () => {
    setSubmitted(false);
    setPrenom('');
    setNom('');
    setTelephone('');
    setEmail('');
    setVille('');
    setTypeBien('Appartement');
    setNombreLogements(1);
    setErrorMsg(null);
    setFocusedField(null);
  };

  const handleClose = () => {
    Haptics.selectionAsync().catch(() => { });
    onClose();
  };

  const handleSubmit = async () => {
    if (!prenom.trim() || !nom.trim() || !telephone.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => { });
      setErrorMsg('Veuillez remplir votre prénom, nom et numéro de téléphone.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });

    try {
      await apiClient.post('/concierge-leads', {
        prenom: prenom.trim(),
        nom: nom.trim(),
        telephone: telephone.trim(),
        ...(email.trim() && { email: email.trim() }),
        ...(ville.trim() && { ville: ville.trim() }),
        typeBien,
        nombreLogements,
      });

      setSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    } catch (err: any) {
      const rawMsg = err.response?.data?.message;
      const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || 'Erreur lors de l’envoi de votre demande.');
      setErrorMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => { });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <Modal
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      transparent
      visible={isMounted}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdropWrapper}
      >
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable onPress={handleClose} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          {/* Poignée tactile */}
          <View style={styles.dragHandleBox}>
            <View style={styles.dragHandle} />
          </View>

          {/* En-tête Sombre Gradient Conciergerie */}
          <View style={styles.darkHeader}>
            <TouchableOpacity
              accessibilityLabel="Fermer"
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={handleClose}
              style={styles.closeBtn}
            >
              <X size={16} color={colors.forest[200]} />
            </TouchableOpacity>

            <View style={styles.headerContentRow}>
              <View style={styles.sparkleBadgeCircle}>
                <Sparkles size={22} color={colors.lime[300]} />
              </View>

              <View style={styles.headerTitleBox}>
                <Text style={styles.headerTitle}>PAIXI MANAGED</Text>
                <Text style={styles.headerSubtitle}>
                  Prise en charge conciergerie 100% déléguée sous 24h
                </Text>
              </View>
            </View>

            {/* Badges de confiance */}
            <View style={styles.trustBadgesRow}>
              <View style={styles.trustBadge}>
                <CheckCircle2 size={10} color={colors.lime[400]} />
                <Text style={styles.trustBadgeText}>SANS ENGAGEMENT</Text>
              </View>
              <View style={styles.trustBadge}>
                <CheckCircle2 size={10} color={colors.lime[400]} />
                <Text style={styles.trustBadgeText}>GRATUIT</Text>
              </View>
              <View style={styles.trustBadge}>
                <CheckCircle2 size={10} color={colors.lime[400]} />
                <Text style={styles.trustBadgeText}>CONFIDENTIEL</Text>
              </View>
            </View>
          </View>

          {/* Corps défilable */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {submitted ? (
              /* Vue Succès */
              <View style={styles.successContainer}>
                <Animated.View
                  style={[
                    styles.successIconCircle,
                    { transform: [{ scale: successScale }] },
                  ]}
                >
                  <CheckCircle2 size={40} color={colors.forest[800]} />
                </Animated.View>

                <Text style={styles.successTitle}>Demande enregistrée !</Text>
                <Text style={styles.successMessage}>
                  Merci <Text style={styles.boldText}>{prenom} {nom}</Text>. Notre équipe conciergerie vous recontactera au{' '}
                  <Text style={styles.boldText}>{telephone}</Text> sous 24h pour étudier votre bien.
                </Text>

                <TouchableOpacity
                  accessibilityLabel="Fermer"
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  onPress={handleClose}
                  style={styles.successDoneBtn}
                >
                  <Text style={styles.successDoneBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Formulaire */
              <View style={styles.formContainer}>
                {errorMsg && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                {/* Section Coordonnées */}
                <View style={styles.fieldSection}>
                  <Text style={styles.sectionTitle}>VOS COORDONNÉES</Text>

                  <View style={styles.nameRow}>
                    {/* Prénom */}
                    <View style={styles.halfInputContainer}>
                      <Text style={styles.inputLabel}>
                        Prénom <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputBox,
                          focusedField === 'prenom' && styles.inputBoxFocused,
                        ]}
                      >
                        <User size={16} color={colors.neutral[400]} />
                        <TextInput
                          accessibilityLabel="Prénom"
                          onBlur={() => setFocusedField(null)}
                          onChangeText={setPrenom}
                          onFocus={() => setFocusedField('prenom')}
                          onSubmitEditing={() => nomRef.current?.focus()}
                          placeholder="Moussa"
                          placeholderTextColor={colors.neutral[400]}
                          returnKeyType="next"
                          style={styles.input}
                          value={prenom}
                        />
                      </View>
                    </View>

                    {/* Nom */}
                    <View style={styles.halfInputContainer}>
                      <Text style={styles.inputLabel}>
                        Nom <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View
                        style={[
                          styles.inputBox,
                          focusedField === 'nom' && styles.inputBoxFocused,
                        ]}
                      >
                        <User size={16} color={colors.neutral[400]} />
                        <TextInput
                          accessibilityLabel="Nom"
                          onBlur={() => setFocusedField(null)}
                          onChangeText={setNom}
                          onFocus={() => setFocusedField('nom')}
                          onSubmitEditing={() => telephoneRef.current?.focus()}
                          placeholder="Diallo"
                          placeholderTextColor={colors.neutral[400]}
                          ref={nomRef}
                          returnKeyType="next"
                          style={styles.input}
                          value={nom}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Téléphone WhatsApp */}
                  <View style={styles.fullInputContainer}>
                    <Text style={styles.inputLabel}>
                      Téléphone (WhatsApp) <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputBox,
                        focusedField === 'telephone' && styles.inputBoxFocused,
                      ]}
                    >
                      <Phone size={16} color={colors.neutral[400]} />
                      <TextInput
                        accessibilityLabel="Téléphone WhatsApp"
                        keyboardType="phone-pad"
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setTelephone}
                        onFocus={() => setFocusedField('telephone')}
                        onSubmitEditing={() => emailRef.current?.focus()}
                        placeholder="+221 77 000 00 00"
                        placeholderTextColor={colors.neutral[400]}
                        ref={telephoneRef}
                        returnKeyType="next"
                        style={styles.input}
                        value={telephone}
                      />
                    </View>
                  </View>

                  {/* Email optionnel */}
                  <View style={styles.fullInputContainer}>
                    <Text style={styles.inputLabel}>
                      Email <Text style={styles.optionalText}>(optionnel)</Text>
                    </Text>
                    <View
                      style={[
                        styles.inputBox,
                        focusedField === 'email' && styles.inputBoxFocused,
                      ]}
                    >
                      <Mail size={16} color={colors.neutral[400]} />
                      <TextInput
                        accessibilityLabel="Email"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedField('email')}
                        placeholder="moussa@exemple.sn"
                        placeholderTextColor={colors.neutral[400]}
                        ref={emailRef}
                        returnKeyType="done"
                        style={styles.input}
                        value={email}
                      />
                    </View>
                  </View>
                </View>

                {/* Section Votre Bien */}
                <View style={styles.fieldSection}>
                  <Text style={styles.sectionTitle}>VOTRE BIEN IMMOBILIER</Text>

                  {/* Ville / Zone */}
                  <View style={styles.fullInputContainer}>
                    <Text style={styles.inputLabel}>Ville ou quartier</Text>
                    <View
                      style={[
                        styles.inputBox,
                        focusedField === 'ville' && styles.inputBoxFocused,
                      ]}
                    >
                      <MapPin size={16} color={colors.neutral[400]} />
                      <TextInput
                        accessibilityLabel="Ville ou quartier"
                        onBlur={() => setFocusedField(null)}
                        onChangeText={setVille}
                        onFocus={() => setFocusedField('ville')}
                        placeholder="Almadies, Saly, Mermoz..."
                        placeholderTextColor={colors.neutral[400]}
                        returnKeyType="done"
                        style={styles.input}
                        value={ville}
                      />
                    </View>
                  </View>

                  {/* Type de bien */}
                  <View style={styles.fullInputContainer}>
                    <Text style={styles.inputLabel}>Type de bien</Text>
                    <View style={styles.chipsWrapper}>
                      <ScrollView
                        contentContainerStyle={styles.typeChipsRow}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        {TYPES_BIEN.map((t) => {
                          const isSelected = typeBien === t;
                          return (
                            <TouchableOpacity
                              accessibilityLabel={`Type de bien : ${t}`}
                              accessibilityRole="button"
                              accessibilityState={{ selected: isSelected }}
                              activeOpacity={0.8}
                              key={t}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => { });
                                setTypeBien(t);
                              }}
                              style={[
                                styles.typeChip,
                                isSelected && styles.typeChipSelected,
                              ]}
                            >
                              <Building2
                                size={13}
                                color={isSelected ? colors.forest[950] : colors.neutral[600]}
                              />
                              <Text
                                style={[
                                  styles.typeChipText,
                                  isSelected && styles.typeChipTextSelected,
                                ]}
                              >
                                {t}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                      <LinearGradient
                        colors={[colors.neutral[0], 'rgba(255,255,255,0)']}
                        end={{ x: 1, y: 0 }}
                        pointerEvents="none"
                        start={{ x: 0, y: 0 }}
                        style={styles.chipsFadeLeft}
                      />
                      <LinearGradient
                        colors={['rgba(255,255,255,0)', colors.neutral[0]]}
                        end={{ x: 1, y: 0 }}
                        pointerEvents="none"
                        start={{ x: 0, y: 0 }}
                        style={styles.chipsFadeRight}
                      />
                    </View>
                  </View>

                  {/* Nombre de logements */}
                  <View style={styles.stepperContainer}>
                    <View style={styles.stepperLabelBox}>
                      <Text style={styles.inputLabel}>Nombre de logements à confier</Text>
                    </View>

                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        accessibilityLabel="Diminuer le nombre de logements"
                        accessibilityRole="button"
                        activeOpacity={0.7}
                        disabled={nombreLogements <= 1}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => { });
                          bumpStepper();
                          setNombreLogements((prev) => Math.max(1, prev - 1));
                        }}
                        style={[
                          styles.stepperBtn,
                          nombreLogements <= 1 && styles.stepperBtnDisabled,
                        ]}
                      >
                        <Minus
                          size={16}
                          color={nombreLogements <= 1 ? colors.neutral[400] : colors.forest[950]}
                        />
                      </TouchableOpacity>

                      <Animated.Text
                        style={[styles.stepperValue, { transform: [{ scale: stepperScale }] }]}
                      >
                        {nombreLogements}
                      </Animated.Text>

                      <TouchableOpacity
                        accessibilityLabel="Augmenter le nombre de logements"
                        accessibilityRole="button"
                        activeOpacity={0.7}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => { });
                          bumpStepper();
                          setNombreLogements((prev) => Math.min(50, prev + 1));
                        }}
                        style={styles.stepperBtn}
                      >
                        <Plus size={16} color={colors.forest[950]} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Pied de Modale Fixe CTA */}
          {!submitted && (
            <View style={styles.bottomBar}>
              <Animated.View style={{ transform: [{ scale: submitScale }] }}>
                <Pressable
                  accessibilityLabel="Confier mon bien à Paixi Managed"
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading }}
                  disabled={loading}
                  onPress={handleSubmit}
                  onPressIn={handleSubmitPressIn}
                  onPressOut={handleSubmitPressOut}
                  style={styles.submitBtn}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.forest[950]} />
                  ) : (
                    <>
                      <Send size={16} color={colors.forest[950]} />
                      <Text style={styles.submitBtnText}>Confier mon bien à Paixi Managed</Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>

              <View style={styles.secureFooter}>
                <ShieldCheck size={12} color={colors.neutral[500]} />
                <Text style={styles.secureText}>
                  Demande gratuite & confidentielle sans engagement
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 25, 18, 0.65)',
  },
  sheetContainer: {
    backgroundColor: colors.neutral[50],
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '92%',
    minHeight: '75%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...shadows.lg,
  },
  dragHandleBox: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: colors.forest[950],
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Dark Header
  darkHeader: {
    backgroundColor: colors.forest[950],
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  sparkleBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(211, 242, 110, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(211, 242, 110, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: typography.sizes.lg,
    color: colors.neutral[0],
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.forest[200],
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trustBadgeText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 9,
    color: colors.forest[200],
    letterSpacing: 0.5,
  },

  // Body
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  formContainer: {
    gap: 18,
  },
  errorBox: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
    borderRadius: radius.inner,
    padding: 12,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontBodySemiBold,
    color: colors.error[700],
  },

  fieldSection: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    gap: 12,
    ...shadows.xs,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.neutral[500],
    letterSpacing: 1,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInputContainer: {
    flex: 1,
    gap: 6,
  },
  fullInputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.forest[950],
  },
  requiredStar: {
    color: colors.error[500],
  },
  optionalText: {
    fontSize: 11,
    color: colors.neutral[400],
    fontWeight: '400',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    paddingHorizontal: 12,
    height: 46,
  },
  inputBoxFocused: {
    borderColor: colors.lime[500] ?? colors.lime[400],
    backgroundColor: colors.neutral[0],
    ...shadows.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral[900],
  },

  chipsWrapper: {
    position: 'relative',
  },
  typeChipsRow: {
    gap: 8,
  },
  chipsFadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
  },
  chipsFadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 14,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  typeChipSelected: {
    backgroundColor: colors.lime[400],
    borderColor: colors.lime[500],
    ...shadows.xs,
  },
  typeChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  typeChipTextSelected: {
    color: colors.forest[950],
    fontFamily: typography.fontBodyExtraBold,
  },

  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepperLabelBox: {
    flex: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
  },
  stepperBtnDisabled: {
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[100],
  },
  stepperValue: {
    fontSize: typography.sizes.md,
    fontWeight: '800',
    color: colors.forest[950],
    minWidth: 20,
    textAlign: 'center',
  },

  // Success view
  successContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 14,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.lime[400],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.action,
  },
  successTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: typography.sizes.xl,
    color: colors.forest[950],
  },
  successMessage: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  boldText: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[900],
  },
  successDoneBtn: {
    backgroundColor: colors.forest[950],
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: radius.pill,
    marginTop: 12,
    ...shadows.sm,
  },
  successDoneBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: typography.sizes.sm,
    color: colors.lime[400],
  },

  // Bottom Bar
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderColor: colors.neutral[200],
    gap: 8,
    ...shadows.lg,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  submitBtnText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: typography.sizes.sm,
    color: colors.forest[950],
  },
  secureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  secureText: {
    fontSize: 10,
    color: colors.neutral[500],
    fontFamily: typography.fontBodyMedium,
  },
});