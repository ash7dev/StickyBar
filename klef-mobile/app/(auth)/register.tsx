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
import { ArrowLeft, User, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { PhoneInputWithCountry } from '../../shared/components/ui/PhoneInputWithCountry';
import { AppButton } from '../../shared/components/ui/AppButton';
import { colors, radius, typography } from '../../shared/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading, error } = useAuth();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('+221');
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
      // Redirection vers l'écran d'OTP avec le paramètre email
      router.push(`/(auth)/otp-verify?email=${encodeURIComponent(email.trim())}`);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successIconBox}>
            <CheckCircle2 size={48} color={colors.success[600]} />
          </View>
          <Text style={styles.title}>Compte Créé avec Succès !</Text>
          <Text style={styles.subtitle}>
            Un email de confirmation vous a été envoyé. Vous pouvez maintenant vous connecter.
          </Text>
          <AppButton
            label="Se connecter"
            onPress={() => router.replace('/(auth)/login')}
            size="lg"
            variant="action"
          />
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.title}>Créer un Compte</Text>
            <Text style={styles.subtitle}>
              Rejoignez la communauté Klef et accédez aux meilleures offres de Dakar & du Sénégal.
            </Text>
          </View>

          {/* Alert Message */}
          {(error || localError) ? (
            <View style={styles.errorAlert}>
              <AlertCircle size={18} color={colors.error[700]} />
              <Text style={styles.errorAlertText}>{error || localError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.formSection}>
            <View style={styles.nameRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Prénom *</Text>
                <View style={styles.textInputWrapper}>
                  <User size={16} color={colors.neutral[500]} />
                  <TextInput
                    onChangeText={setPrenom}
                    placeholder="Amadou"
                    placeholderTextColor={colors.neutral[400]}
                    style={styles.textInput}
                    value={prenom}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Nom *</Text>
                <View style={styles.textInputWrapper}>
                  <TextInput
                    onChangeText={setNom}
                    placeholder="Diallo"
                    placeholderTextColor={colors.neutral[400]}
                    style={styles.textInput}
                    value={nom}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse Email *</Text>
              <View style={styles.textInputWrapper}>
                <Mail size={18} color={colors.neutral[500]} />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="amadou.diallo@exemple.sn"
                  placeholderTextColor={colors.neutral[400]}
                  style={styles.textInput}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro de Téléphone (Optionnel)</Text>
              <PhoneInputWithCountry onChange={setTelephone} value={telephone} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de Passe *</Text>
              <View style={styles.textInputWrapper}>
                <Lock size={18} color={colors.neutral[500]} />
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor={colors.neutral[400]}
                  secureTextEntry
                  style={styles.textInput}
                  value={password}
                />
              </View>
            </View>

            <AppButton
              label="Créer mon compte Klef"
              loading={loading}
              onPress={handleRegister}
              size="lg"
              variant="action"
            />
          </View>

          {/* Footer Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
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
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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

  formSection: {
    gap: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
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
  loginLink: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.forest[600],
  },
});
