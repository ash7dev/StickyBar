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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight, BedDouble, Building, Building2, Check, Home, Minus, MoreHorizontal, Plus, X } from 'lucide-react-native';
import { colors, typography } from '../../theme/tokens';
import { apiClient } from '../../api/api-client';

interface MobileKlefManagedModalProps {
  visible: boolean;
  onClose: () => void;
}

const INK = colors.forest[950];

const TYPES_BIEN = [
  { label: 'Appartement', Icon: Building2 },
  { label: 'Studio', Icon: Building },
  { label: 'Villa', Icon: Home },
  { label: 'Chambre meublée', Icon: BedDouble },
  { label: 'Autre', Icon: MoreHorizontal },
] as const;

const ZONES = ['Almadies', 'Ngor', 'Mermoz', 'Plateau', 'Saly', 'Somone'];

/**
 * Paixi Managed : confier son logement en deux étapes (le bien, puis les coordonnées),
 * puis une confirmation qui dit ce qui va se passer. Même envoi qu'avant (POST /concierge-leads).
 */
export function MobileKlefManagedModal({ visible, onClose }: MobileKlefManagedModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2>(1);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('');
  const [typeBien, setTypeBien] = useState<string>('Appartement');
  const [nombreLogements, setNombreLogements] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const nomRef = useRef<TextInput>(null);
  const telRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // Présentation : fond qui s'assombrit, feuille qui monte
  const [mounted, setMounted] = useState(visible);
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(600)).current;
  const stepFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(sheetY, { toValue: 0, speed: 14, bounciness: 5, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(sheetY, { toValue: 600, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        setMounted(false);
        reset();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const reset = () => {
    setStep(1);
    setSubmitted(false);
    setPrenom('');
    setNom('');
    setTelephone('');
    setEmail('');
    setVille('');
    setTypeBien('Appartement');
    setNombreLogements(1);
    setErrorMsg(null);
  };

  const fadeTo = (next: () => void) => {
    Animated.timing(stepFade, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      next();
      Animated.timing(stepFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const close = () => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
  };

  const submit = async () => {
    if (!prenom.trim() || !nom.trim() || !telephone.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setErrorMsg('Il nous faut votre prénom, votre nom et votre numéro WhatsApp.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await apiClient.post('/concierge-leads', {
        prenom: prenom.trim(),
        nom: nom.trim(),
        telephone: telephone.trim().startsWith('+') ? telephone.trim() : `+221 ${telephone.trim()}`,
        ...(email.trim() && { email: email.trim() }),
        ...(ville.trim() && { ville: ville.trim() }),
        typeBien,
        nombreLogements,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      fadeTo(() => setSubmitted(true));
    } catch (err: unknown) {
      const raw = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setErrorMsg(Array.isArray(raw) ? raw.join(', ') : typeof raw === 'string' && raw ? raw : 'L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const firstName = prenom.trim() ? prenom.trim().charAt(0).toUpperCase() + prenom.trim().slice(1).toLowerCase() : '';

  return (
    <Modal animationType="none" onRequestClose={close} statusBarTranslucent transparent visible={mounted}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable onPress={close} style={StyleSheet.absoluteFill} accessibilityLabel="Fermer" />
        </Animated.View>

        <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY: sheetY }] }]}>
          {/* En-tête sombre : la promesse, en grand */}
          <LinearGradient colors={[INK, colors.forest[900] ?? INK]} style={styles.hero}>
            <View style={styles.heroTop}>
              {step === 2 && !submitted ? (
                <TouchableOpacity onPress={() => fadeTo(() => setStep(1))} style={styles.heroBtn} accessibilityRole="button" accessibilityLabel="Étape précédente">
                  <ArrowLeft size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>PAIXI MANAGED</Text>
                </View>
              )}
              <View style={styles.heroRight}>
                {!submitted && (
                  <View style={styles.steps}>
                    {[1, 2].map((n) => (
                      <View key={n} style={[styles.stepDot, n === step && styles.stepDotOn, n < step && { backgroundColor: colors.lime[400] }]} />
                    ))}
                  </View>
                )}
                <TouchableOpacity onPress={close} style={styles.heroBtn} accessibilityRole="button" accessibilityLabel="Fermer">
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.heroTitle}>
              {submitted ? (
                <>
                  C’est noté{firstName ? `, ${firstName}` : ''}.{'\n'}
                  <Text style={styles.heroAccent}>On vous écrit sous 24 h.</Text>
                </>
              ) : step === 1 ? (
                <>
                  Quel logement voulez-vous{'\n'}
                  <Text style={styles.heroAccent}>nous confier ?</Text>
                </>
              ) : (
                <>
                  Comment pouvons-nous{'\n'}
                  <Text style={styles.heroAccent}>vous joindre ?</Text>
                </>
              )}
            </Text>
            {!submitted && (
              <View style={styles.trust}>
                {['Sans engagement', 'Gratuit', 'Confidentiel'].map((t) => (
                  <View key={t} style={styles.trustItem}>
                    <Check size={11} color={colors.lime[400]} strokeWidth={3} />
                    <Text style={styles.trustText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>

          <Animated.View style={{ flexShrink: 1, opacity: stepFade }}>
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {errorMsg && (
                <View style={styles.error}>
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              {submitted ? (
                <View style={{ gap: 16 }}>
                  <Text style={styles.lead}>
                    Notre équipe vous contacte sur WhatsApp au <Text style={styles.bold}>{telephone.trim().startsWith('+') ? telephone.trim() : `+221 ${telephone.trim()}`}</Text> pour parler de votre {typeBien.toLowerCase()}
                    {ville.trim() ? ` à ${ville.trim()}` : ''}.
                  </Text>
                  {[
                    { n: '1', t: 'Un conseiller Paixi vous écrit', s: 'sous 24 h, sur WhatsApp' },
                    { n: '2', t: 'On étudie votre logement ensemble', s: 'et ce qu’il peut vous rapporter' },
                    { n: '3', t: 'Vous décidez', s: 'sans engagement, à votre rythme' },
                  ].map((r) => (
                    <View key={r.n} style={styles.next}>
                      <View style={styles.nextN}>
                        <Text style={styles.nextNText}>{r.n}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nextT}>{r.t}</Text>
                        <Text style={styles.nextS}>{r.s}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : step === 1 ? (
                <View style={{ gap: 20 }}>
                  <View style={styles.types} accessibilityRole="radiogroup">
                    {TYPES_BIEN.map(({ label, Icon }) => {
                      const on = typeBien === label;
                      return (
                        <TouchableOpacity
                          key={label}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setTypeBien(label);
                          }}
                          style={[styles.type, on && styles.typeOn]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: on }}
                        >
                          <Icon size={22} color={on ? colors.lime[400] : colors.forest[600]} strokeWidth={2} />
                          <Text style={[styles.typeText, on && { color: '#FFFFFF' }]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={{ gap: 8 }}>
                    <Text style={styles.label}>Où se trouve-t-il ?</Text>
                    <Field icon={null} focused={focused === 'ville'}>
                      <TextInput
                        value={ville}
                        onChangeText={setVille}
                        onFocus={() => setFocused('ville')}
                        onBlur={() => setFocused(null)}
                        placeholder="Ville ou quartier"
                        placeholderTextColor={colors.neutral[400]}
                        style={styles.input}
                        accessibilityLabel="Ville ou quartier"
                      />
                    </Field>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {ZONES.map((z) => (
                        <TouchableOpacity key={z} onPress={() => setVille(z)} style={[styles.zone, ville === z && styles.zoneOn]} accessibilityRole="button">
                          <Text style={[styles.zoneText, ville === z && { color: colors.lime[400] }]}>{z}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.countRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.countTitle}>Nombre de logements</Text>
                      <Text style={styles.countSub}>à confier à Paixi</Text>
                    </View>
                    <Stepper icon="minus" disabled={nombreLogements <= 1} onPress={() => setNombreLogements((n) => Math.max(1, n - 1))} />
                    <Text style={styles.countValue}>{nombreLogements}</Text>
                    <Stepper icon="plus" disabled={nombreLogements >= 50} onPress={() => setNombreLogements((n) => Math.min(50, n + 1))} />
                  </View>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={styles.label}>Prénom</Text>
                      <Field focused={focused === 'prenom'}>
                        <TextInput value={prenom} onChangeText={setPrenom} onFocus={() => setFocused('prenom')} onBlur={() => setFocused(null)} onSubmitEditing={() => nomRef.current?.focus()} returnKeyType="next" placeholder="Moussa" placeholderTextColor={colors.neutral[400]} style={styles.input} accessibilityLabel="Prénom" />
                      </Field>
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text style={styles.label}>Nom</Text>
                      <Field focused={focused === 'nom'}>
                        <TextInput ref={nomRef} value={nom} onChangeText={setNom} onFocus={() => setFocused('nom')} onBlur={() => setFocused(null)} onSubmitEditing={() => telRef.current?.focus()} returnKeyType="next" placeholder="Diallo" placeholderTextColor={colors.neutral[400]} style={styles.input} accessibilityLabel="Nom" />
                      </Field>
                    </View>
                  </View>
                  <View style={{ gap: 6 }}>
                    <Text style={styles.label}>Numéro WhatsApp</Text>
                    <Field focused={focused === 'tel'}>
                      <Text style={styles.prefix}>+221</Text>
                      <TextInput ref={telRef} value={telephone} onChangeText={setTelephone} onFocus={() => setFocused('tel')} onBlur={() => setFocused(null)} onSubmitEditing={() => emailRef.current?.focus()} keyboardType="phone-pad" returnKeyType="next" placeholder="77 000 00 00" placeholderTextColor={colors.neutral[400]} style={styles.input} accessibilityLabel="Numéro WhatsApp" />
                    </Field>
                  </View>
                  <View style={{ gap: 6 }}>
                    <Text style={styles.label}>
                      Email <Text style={styles.optional}>facultatif</Text>
                    </Text>
                    <Field focused={focused === 'email'}>
                      <TextInput ref={emailRef} value={email} onChangeText={setEmail} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} autoCapitalize="none" keyboardType="email-address" returnKeyType="done" placeholder="moussa@exemple.sn" placeholderTextColor={colors.neutral[400]} style={styles.input} accessibilityLabel="Email" />
                    </Field>
                  </View>
                  <Text style={styles.privacy}>Vos coordonnées servent uniquement à vous recontacter au sujet de votre logement.</Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>

          {/* Action principale */}
          <View style={styles.footer}>
            {submitted ? (
              <PrimaryButton label="Fermer" onPress={close} />
            ) : step === 1 ? (
              <PrimaryButton label="Continuer" onPress={() => fadeTo(() => setStep(2))} arrow />
            ) : (
              <PrimaryButton label={loading ? '' : 'Envoyer ma demande'} onPress={submit} arrow={!loading} loading={loading} />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ children, focused, icon }: { children: React.ReactNode; focused: boolean; icon?: React.ReactNode }) {
  return (
    <View style={[styles.field, focused && styles.fieldOn]}>
      {icon}
      {children}
    </View>
  );
}

function Stepper({ icon, disabled, onPress }: { icon: 'minus' | 'plus'; disabled: boolean; onPress: () => void }) {
  const Icon = icon === 'minus' ? Minus : Plus;
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={disabled}
      style={[styles.stepper, disabled && { opacity: 0.35 }]}
      accessibilityRole="button"
      accessibilityLabel={icon === 'minus' ? 'Un logement de moins' : 'Un logement de plus'}
    >
      <Icon size={16} color={INK} strokeWidth={2.4} />
    </TouchableOpacity>
  );
}

function PrimaryButton({ label, onPress, arrow, loading }: { label: string; onPress: () => void; arrow?: boolean; loading?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} style={styles.primary} accessibilityRole="button" accessibilityState={{ busy: loading }}>
      {loading ? (
        <ActivityIndicator color={INK} />
      ) : (
        <>
          <Text style={styles.primaryText}>{label}</Text>
          {arrow ? (
            <View style={styles.primaryArrow}>
              <ArrowRight size={16} color={colors.lime[400]} strokeWidth={2.6} />
            </View>
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(4,25,18,0.6)' },
  sheet: { maxHeight: '94%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden', backgroundColor: colors.neutral[50] },

  hero: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 14 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(248,251,244,0.12)', alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(211,242,110,0.14)' },
  badgeText: { fontFamily: typography.fontBodyBold, fontSize: 10, letterSpacing: 1.2, color: colors.lime[400] },
  steps: { flexDirection: 'row', gap: 4 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(248,251,244,0.25)' },
  stepDotOn: { width: 22, backgroundColor: colors.lime[400] },
  heroTitle: { fontFamily: typography.fontDisplaySemiBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.7, color: '#FFFFFF' },
  heroAccent: { color: colors.lime[400], fontStyle: 'italic' },
  trust: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: '#C9DBD1' },

  body: { padding: 20, gap: 16 },
  error: { padding: 12, borderRadius: 14, backgroundColor: colors.error[50] },
  errorText: { fontFamily: typography.fontBodyMedium, fontSize: 13, color: colors.error[700] },
  label: { fontFamily: typography.fontBodyBold, fontSize: 13, color: INK },
  optional: { fontFamily: typography.fontBody, color: colors.neutral[500] },

  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  type: { width: '31.6%', height: 92, borderRadius: 20, borderWidth: 1, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0], alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 4 },
  typeOn: { backgroundColor: INK, borderColor: INK },
  typeText: { fontFamily: typography.fontBodyBold, fontSize: 12, color: INK, textAlign: 'center' },

  field: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 54, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.neutral[200], backgroundColor: colors.neutral[0] },
  fieldOn: { borderColor: colors.forest[600] },
  input: { flex: 1, height: 54, fontFamily: typography.fontBodyMedium, fontSize: 15, color: INK },
  prefix: { fontFamily: typography.fontBodySemiBold, fontSize: 15, color: INK, paddingRight: 8, borderRightWidth: 1, borderRightColor: colors.neutral[200] },
  zone: { height: 34, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.forest[50], justifyContent: 'center' },
  zoneOn: { backgroundColor: INK },
  zoneText: { fontFamily: typography.fontBodySemiBold, fontSize: 12, color: INK },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  countTitle: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  countSub: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },
  countValue: { width: 26, textAlign: 'center', fontFamily: typography.fontDisplaySemiBold, fontSize: 22, color: INK },
  stepper: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.neutral[200], alignItems: 'center', justifyContent: 'center' },
  privacy: { fontFamily: typography.fontBody, fontSize: 12, lineHeight: 17, color: colors.neutral[600] },

  lead: { fontFamily: typography.fontBody, fontSize: 15, lineHeight: 22, color: INK },
  bold: { fontFamily: typography.fontBodyBold },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: colors.neutral[0], borderWidth: 1, borderColor: colors.neutral[200] },
  nextN: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.lime[400], alignItems: 'center', justifyContent: 'center' },
  nextNText: { fontFamily: typography.fontDisplaySemiBold, fontSize: 15, color: INK },
  nextT: { fontFamily: typography.fontBodyBold, fontSize: 14, color: INK },
  nextS: { fontFamily: typography.fontBody, fontSize: 12, color: colors.neutral[600] },

  footer: { paddingHorizontal: 20, paddingTop: 8 },
  primary: { height: 56, borderRadius: 999, backgroundColor: colors.lime[400], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingLeft: 22, paddingRight: 22 },
  primaryText: { fontFamily: typography.fontBodyBold, fontSize: 15, color: INK },
  primaryArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
});
