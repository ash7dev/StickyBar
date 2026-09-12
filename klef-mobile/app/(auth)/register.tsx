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
import { ArrowLeft, User, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { PhoneInputWithCountry } from '../../shared/components/ui/PhoneInputWithCountry';
import { AppButton } from '../../shared/components/ui/AppButton';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loginGoogle, loading, error } = useAuth();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('+221');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async () => {
    setLocalError(null);
    if (!prenom.trim() || !nom.trim() || !email.trim() || !password) {
      setLocalError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const success = await register({
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: email.trim(),
      password,
      telephone,
    });

    if (success) {
      router.push(`/(auth)/otp-verify?email=${encodeURIComponent(email.trim())}` as any);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    const success = await loginGoogle();
    if (success) {
      router.replace('/(tenant)' as any);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconBox}>
              <CheckCircle2 size={44} color={colors.success[600]} />
            </View>
            <Text style={styles.successTitle}>Compte Créé avec Succès !</Text>
            <Text style={styles.successSubtitle}>
              Un code de confirmation vous a été transmis. Vous êtes prêt à explorer le catalogue Klef.
            </Text>
            <AppButton
              fullWidth
              label="Se connecter"
              onPress={() => router.replace('/(auth)/login' as any)}
              size="lg"
              variant="action"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }


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

          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte Klef ✨</Text>
            <Text style={styles.subtitle}>
              Rejoignez la communauté Klef et accédez aux meilleures offres de logements à Dakar.
            </Text>
          </View>

          {/* Error Alert Message */}
          {error || localError ? (
            <View style={styles.errorAlert}>
              <AlertCircle size={18} color={colors.error[600]} />
              <Text style={styles.errorAlertText}>{error || localError}</Text>
            </View>
          ) : null}

          {/* Form Card Container */}
          <View style={styles.cardContainer}>
            <View style={styles.formSection}>
              {/* Prénom & Nom */}
              <View style={styles.nameRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Prénom *</Text>
                  <View
                    style={[
                      styles.textInputWrapper,
                      focusedInput === 'prenom' && styles.textInputWrapperFocused,
                    ]}
                  >
                    <User
                      size={16}
                      color={focusedInput === 'prenom' ? colors.forest[600] : colors.neutral[400]}
                    />
                    <TextInput
                      onBlur={() => setFocusedInput(null)}
                      onChangeText={setPrenom}
                      onFocus={() => setFocusedInput('prenom')}
                      placeholder="Amadou"
                      placeholderTextColor={colors.neutral[400]}
                      style={styles.textInput}
                      value={prenom}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Nom *</Text>
                  <View
                    style={[
                      styles.textInputWrapper,
                      focusedInput === 'nom' && styles.textInputWrapperFocused,
                    ]}
                  >
                    <TextInput
                      onBlur={() => setFocusedInput(null)}
                      onChangeText={setNom}
                      onFocus={() => setFocusedInput('nom')}
                      placeholder="Diallo"
                      placeholderTextColor={colors.neutral[400]}
                      style={styles.textInput}
                      value={nom}
                    />
                  </View>
                </View>
              </View>

              {/* Adresse Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse Email *</Text>
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
                    placeholder="amadou.diallo@exemple.sn"
                    placeholderTextColor={colors.neutral[400]}
                    style={styles.textInput}
                    value={email}
                  />
                </View>
              </View>

              {/* Téléphone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Numéro de Téléphone (Optionnel)</Text>
                <PhoneInputWithCountry onChange={setTelephone} value={telephone} />
              </View>

              {/* Mot de Passe */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Mot de Passe *</Text>
                  <Text style={styles.hintText}>Min. 6 caractères</Text>
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

              {/* Submit CTA */}
              <AppButton
                fullWidth
                label="Créer mon compte Klef"
                loading={loading}
                onPress={handleRegister}
                size="lg"
                variant="action"
              />
            </View>

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

          {/* Footer Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/login' as any)}
            >

              <Text style={styles.loginLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={colors.neutral[400]} />
            <Text style={styles.securityBadgeText}>
              Vos informations sont stockées de façon sécurisée & chiffrée.
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

  // Top Bar Navigation
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

  // Success Container
  successContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    ...shadows.md,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
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

  // Error Alert Box
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
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
  hintText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
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
  loginLink: {
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
    textAlign: 'center',
  },
});

