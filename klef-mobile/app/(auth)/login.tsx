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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { PhoneInputWithCountry } from '../../shared/components/ui/PhoneInputWithCountry';
import { AppButton } from '../../shared/components/ui/AppButton';
import { colors, radius, typography } from '../../shared/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { sendPhoneOtp, loginEmail, loading, error } = useAuth();

  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [telephone, setTelephone] = useState('+221');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSendPhoneOtp = async () => {
    setLocalError(null);
    if (!telephone || telephone.length < 9) {
      setLocalError('Veuillez saisir un numéro de téléphone valide');
      return;
    }

    const success = await sendPhoneOtp(telephone);
    if (success) {
      router.push(`/(auth)/otp-verify?phone=${encodeURIComponent(telephone)}`);
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
      router.replace('/(tenant)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Back Header */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.neutral[900]} />
          </TouchableOpacity>

          {/* Header Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>
              Accédez à vos réservations, vos favoris et votre espace hôte.
            </Text>
          </View>

          {/* Segmented Mode Picker (Téléphone vs Email) */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setMode('phone');
                setLocalError(null);
              }}
              style={[styles.segmentBtn, mode === 'phone' && styles.segmentBtnActive]}
            >
              <Phone size={16} color={mode === 'phone' ? colors.forest[800] : colors.neutral[600]} />
              <Text style={[styles.segmentText, mode === 'phone' && styles.segmentTextActive]}>
                Téléphone (SMS)
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
              <Mail size={16} color={mode === 'email' ? colors.forest[800] : colors.neutral[600]} />
              <Text style={[styles.segmentText, mode === 'email' && styles.segmentTextActive]}>
                Email & Passe
              </Text>
            </TouchableOpacity>
          </View>

          {/* Alert Message */}
          {(error || localError) ? (
            <View style={styles.errorAlert}>
              <AlertCircle size={18} color={colors.error[700]} />
              <Text style={styles.errorAlertText}>{error || localError}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          {mode === 'phone' ? (
            <View style={styles.formSection}>
              <Text style={styles.label}>Numéro de Téléphone</Text>
              <PhoneInputWithCountry onChange={setTelephone} value={telephone} />

              <Text style={styles.infoText}>
                Un code de vérification à 6 chiffres vous sera envoyé par SMS.
              </Text>

              <AppButton
                label="Envoyer le code OTP"
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
                <View style={styles.textInputWrapper}>
                  <Mail size={18} color={colors.neutral[500]} />
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="exemple@domaine.com"
                    placeholderTextColor={colors.neutral[400]}
                    style={styles.textInput}
                    value={email}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.textInputWrapper}>
                  <Lock size={18} color={colors.neutral[500]} />
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.neutral[400]}
                    secureTextEntry
                    style={styles.textInput}
                    value={password}
                  />
                </View>
              </View>

              <AppButton
                label="Se connecter"
                loading={loading}
                onPress={handleLoginEmail}
                size="lg"
                variant="primary"
              />
            </View>
          )}

          {/* Footer Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Créer un compte Klef</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
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
    marginBottom: 24,
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
  },
  segmentText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  segmentTextActive: {
    color: colors.forest[800],
  },

  // Error Alert
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.error[50],
    borderColor: colors.error[500],
    borderWidth: 1,
    borderRadius: radius.field,
    padding: 12,
    marginBottom: 20,
  },
  errorAlertText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.error[700],
    fontWeight: '600',
  },

  // Form Section
  formSection: {
    gap: 16,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  infoText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginBottom: 8,
  },

  inputGroup: {
    marginBottom: 12,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral[0],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.field,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.neutral[900],
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 36,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },
  registerLink: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.forest[600],
  },
});
