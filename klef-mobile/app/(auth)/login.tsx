import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, Mail, Lock, ArrowLeft, AlertCircle, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { PhoneInputWithCountry } from '../../shared/components/ui/PhoneInputWithCountry';
import { AppButton } from '../../shared/components/ui/AppButton';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { sendPhoneOtp, loginEmail, loginGoogle, loading, error } = useAuth();

  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [telephone, setTelephone] = useState('+221');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSendPhoneOtp = async () => {
    setLocalError(null);
    if (!telephone || telephone.length < 9) {
      setLocalError('Veuillez saisir un numéro de téléphone valide');
      return;
    }

    const success = await sendPhoneOtp(telephone);
    if (success) {
      router.push(`/(auth)/otp-verify?phone=${encodeURIComponent(telephone)}` as any);
    }
  };

  const handleLoginEmail = async () => {
    setLocalError(null);
    if (!email || !password) {
      setLocalError('Veuillez renseigner votre email et votre mot de passe');
      return;
    }

    const success = await loginEmail(email, password);
    if (success) {
      router.replace('/(tenant)' as any);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    const success = await loginGoogle();
    if (success) {
      router.replace('/(tenant)' as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar Navigation */}
          <View style={styles.topBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={18} color={colors.neutral[800]} />
            </TouchableOpacity>
          </View>

          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.title}>Content de vous revoir 👋</Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour accéder à vos réservations, favoris et votre espace personnel.
            </Text>
          </View>

          {/* Segmented Mode Picker */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMode('phone');
                setLocalError(null);
              }}
              style={[styles.segmentBtn, mode === 'phone' && styles.segmentBtnActive]}
            >
              <Phone
                size={15}
                color={mode === 'phone' ? colors.forest[800] : colors.neutral[500]}
              />
              <Text style={[styles.segmentText, mode === 'phone' && styles.segmentTextActive]}>
                Numéro Téléphone
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMode('email');
                setLocalError(null);
              }}
              style={[styles.segmentBtn, mode === 'email' && styles.segmentBtnActive]}
            >
              <Mail
                size={15}
                color={mode === 'email' ? colors.forest[800] : colors.neutral[500]}
              />
              <Text style={[styles.segmentText, mode === 'email' && styles.segmentTextActive]}>
                Email & Passe
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Alert Box */}
          {error || localError ? (
            <View style={styles.errorAlert}>
              <AlertCircle size={18} color={colors.error[600]} />
              <Text style={styles.errorAlertText}>{error || localError}</Text>
            </View>
          ) : null}

          {/* Main Card Form */}
          <View style={styles.cardContainer}>
            {mode === 'phone' ? (
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Numéro de Téléphone</Text>
                  <PhoneInputWithCountry onChange={setTelephone} value={telephone} />
                </View>

                <View style={styles.infoBox}>
                  <ShieldCheck size={16} color={colors.forest[600]} />
                  <Text style={styles.infoText}>
                    Un code OTP à 6 chiffres vous sera envoyé instantanément par SMS.
                  </Text>
                </View>

                <AppButton
                  fullWidth
                  label="Envoyer le code SMS"
                  loading={loading}
                  onPress={handleSendPhoneOtp}
                  size="lg"
                  variant="action"
                />
              </View>
            ) : (
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Adresse Email</Text>
                  <View
                    style={[
                      styles.textInputWrapper,
                      focusedInput === 'email' && styles.textInputWrapperFocused,
                    ]}
                  >
                    <Mail
                      size={18}
                      color={focusedInput === 'email' ? colors.forest[600] : colors.neutral[400]}
                    />
                    <TextInput
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onBlur={() => setFocusedInput(null)}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedInput('email')}
                      placeholder="exemple@domaine.com"
                      placeholderTextColor={colors.neutral[400]}
                      style={styles.textInput}
                      value={email}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Mot de passe</Text>
                  </View>

                  <View
                    style={[
                      styles.textInputWrapper,
                      focusedInput === 'password' && styles.textInputWrapperFocused,
                    ]}
                  >
                    <Lock
                      size={18}
                      color={focusedInput === 'password' ? colors.forest[600] : colors.neutral[400]}
                    />
                    <TextInput
                      autoCapitalize="none"
                      onBlur={() => setFocusedInput(null)}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedInput('password')}
                      placeholder="••••••••"
                      placeholderTextColor={colors.neutral[400]}
                      secureTextEntry={!showPassword}
                      style={styles.textInput}
                      value={password}
                    />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowPassword((prev) => !prev)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={colors.neutral[500]} />
                      ) : (
                        <Eye size={18} color={colors.neutral[500]} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <AppButton
                  fullWidth
                  label="Se connecter"
                  loading={loading}
                  onPress={handleLoginEmail}
                  size="lg"
                  variant="action"
                />
              </View>
            )}

            {/* Social Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU CONTINUER AVEC</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Social Login Button */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleGoogleLogin}
              style={styles.googleButton}
            >
              <View style={styles.googleGLogo}>
                <Text style={styles.googleGLetter}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Nouveau sur Klef ?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/register' as any)}
            >

              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Security Footer */}
          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={colors.neutral[400]} />
            <Text style={styles.securityBadgeText}>
              Connexion sécurisée SSL 256-bit • Vos données sont protégées
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 36,
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.forest[50],
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.forest[600],
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.forest[800],
    letterSpacing: 1.2,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.neutral[900],
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },

  // Segmented control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  segmentBtnActive: {
    backgroundColor: colors.lime[400],
    ...shadows.xs,
  },
  segmentText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  segmentTextActive: {
    color: colors.forest[800],
    fontWeight: '700',
  },

  // Error Alert
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.error[50],
    borderColor: colors.error[500],
    borderWidth: 1,
    borderRadius: radius.inner,
    padding: 12,
    marginBottom: 20,
  },
  errorAlertText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.error[700],
    fontWeight: '600',
  },

  // Card Container
  cardContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
    marginBottom: 24,
  },

  // Form Section
  formSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.neutral[900],
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest[50],
    padding: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.forest[100],
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.forest[800],
    lineHeight: 18,
    fontWeight: '500',
  },

  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    paddingHorizontal: 14,
    height: 52,
  },
  textInputWrapperFocused: {
    borderColor: colors.forest[600],
    backgroundColor: colors.neutral[0],
  },
  textInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  eyeBtn: {
    padding: 6,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.neutral[400],
    letterSpacing: 1.1,
  },

  // Google Social Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.pill,
    height: 52,
    ...shadows.xs,
  },
  googleGLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGLetter: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif-medium',
  },
  googleButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.neutral[800],
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },
  registerLink: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.forest[600],
    textDecorationLine: 'underline',
  },

  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  securityBadgeText: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '500',
  },
});

