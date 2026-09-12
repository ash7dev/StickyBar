import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../shared/theme/tokens';
import { apiClient } from '../../../shared/api/api-client';

interface MobileSecurityCardProps {
  userEmail?: string | null;
  onUpdated?: () => void;
}

export function MobileSecurityCard({ userEmail, onUpdated }: MobileSecurityCardProps) {
  const [email, setEmail] = useState(userEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExistingEmail = !!userEmail && userEmail.includes('@');

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasNumber && passwordsMatch;

  const canSubmit =
    !loading &&
    ((email.trim().length > 0 && email.trim() !== (userEmail || '')) || isPasswordValid);

  const handleSubmit = async () => {
    setError(null);

    const emailToSubmit = email.trim() !== (userEmail || '') ? email.trim() : undefined;
    const passwordToSubmit = password.length > 0 ? password : undefined;

    if (!emailToSubmit && !passwordToSubmit) {
      Alert.alert('Information', 'Aucun changement détecté.');
      return;
    }

    if (passwordToSubmit && !isPasswordValid) {
      if (!passwordsMatch) {
        setError('Les mots de passe ne correspondent pas.');
      } else {
        setError('Le mot de passe ne respecte pas tous les critères de sécurité.');
      }
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      const res = await apiClient.patch<{
        success: boolean;
        message: string;
      }>('/users/me/security', {
        ...(emailToSubmit && { email: emailToSubmit }),
        ...(passwordToSubmit && { password: passwordToSubmit }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const msg = res?.data?.message || 'Vos identifiants ont été mis à jour avec succès.';
      Alert.alert('Sécurité mise à jour', msg);

      setPassword('');
      setConfirmPassword('');
      onUpdated?.();
    } catch (err: any) {
      console.error('[MobileSecurityCard] Erreur mise à jour sécurité:', err);
      const msg =
        err.response?.data?.message ||
        'Impossible de mettre à jour vos identifiants de sécurité.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* ── 1. En-tête (Structure Web) ────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <ShieldCheck size={18} color={colors.forest[700]} />
        </View>

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Sécurité & Identifiants
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {hasExistingEmail
              ? 'Gérez votre adresse email et mot de passe'
              : 'Définissez vos identifiants de connexion'}
          </Text>
        </View>

        {/* Badge d'État Web */}
        <View style={[styles.statusChip, hasExistingEmail ? styles.chipSuccess : styles.chipWarning]}>
          {hasExistingEmail ? (
            <>
              <CheckCircle2 size={12} color={colors.forest[700]} />
              <Text style={styles.chipTextSuccess} numberOfLines={1}>
                Email actif
              </Text>
            </>
          ) : (
            <>
              <KeyRound size={12} color="#B45309" />
              <Text style={styles.chipTextWarning} numberOfLines={1}>
                SMS uniquement
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── 2. Information si pas d'email (Web Banner) ───────────────────── */}
      {!hasExistingEmail && (
        <View style={styles.infoBanner}>
          <AlertCircle size={15} color="#B45309" style={{ marginTop: 1 }} />
          <Text style={styles.infoBannerText}>
            Votre compte a été créé via SMS. En ajoutant un email et un mot de passe, vous débloquerez la double connexion.
          </Text>
        </View>
      )}

      {/* ── 3. Affichage d'erreur ───────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={14} color={colors.error[700]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── 4. Champ Adresse Email ──────────────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Adresse Email de connexion</Text>
        <View style={styles.inputWrapper}>
          <Mail size={16} color={colors.neutral[400]} style={styles.inputIcon} />
          <TextInput
            style={styles.inputFlex}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="votre.email@exemple.com"
            placeholderTextColor={colors.neutral[400]}
            editable={!loading}
          />
        </View>
      </View>

      {/* ── 5. Champ Nouveau Mot de passe ──────────────────────────────── */}
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>
          {hasExistingEmail ? 'Nouveau mot de passe' : 'Définir un mot de passe'}
        </Text>
        <View style={styles.inputWrapper}>
          <Lock size={16} color={colors.neutral[400]} style={styles.inputIcon} />
          <TextInput
            style={styles.inputFlex}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="••••••••••••"
            placeholderTextColor={colors.neutral[400]}
            editable={!loading}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
          >
            {showPassword ? (
              <EyeOff size={16} color={colors.neutral[500]} />
            ) : (
              <Eye size={16} color={colors.neutral[500]} />
            )}
          </TouchableOpacity>
        </View>

        {/* Live Strength Chips (Web Style) */}
        {password.length > 0 && (
          <View style={styles.strengthRow}>
            <View
              style={[
                styles.strengthPill,
                hasMinLength ? styles.pillValid : styles.pillDefault,
              ]}
            >
              {hasMinLength && <Check size={10} color={colors.forest[800]} strokeWidth={3} />}
              <Text
                style={[
                  styles.strengthPillText,
                  hasMinLength && styles.strengthPillTextValid,
                ]}
                numberOfLines={1}
              >
                8+ car.
              </Text>
            </View>

            <View
              style={[
                styles.strengthPill,
                hasUpper ? styles.pillValid : styles.pillDefault,
              ]}
            >
              {hasUpper && <Check size={10} color={colors.forest[800]} strokeWidth={3} />}
              <Text
                style={[
                  styles.strengthPillText,
                  hasUpper && styles.strengthPillTextValid,
                ]}
                numberOfLines={1}
              >
                1 Majuscule
              </Text>
            </View>

            <View
              style={[
                styles.strengthPill,
                hasNumber ? styles.pillValid : styles.pillDefault,
              ]}
            >
              {hasNumber && <Check size={10} color={colors.forest[800]} strokeWidth={3} />}
              <Text
                style={[
                  styles.strengthPillText,
                  hasNumber && styles.strengthPillTextValid,
                ]}
                numberOfLines={1}
              >
                1 Chiffre
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── 6. Champ Confirmation Mot de passe ──────────────────────────── */}
      {password.length > 0 && (
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
          <View
            style={[
              styles.inputWrapper,
              confirmPassword.length > 0 && !passwordsMatch && styles.inputWrapperError,
            ]}
          >
            <Lock size={16} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.inputFlex}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              placeholder="••••••••••••"
              placeholderTextColor={colors.neutral[400]}
              editable={!loading}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowConfirmPassword((v) => !v)}
              style={styles.eyeBtn}
            >
              {showConfirmPassword ? (
                <EyeOff size={16} color={colors.neutral[500]} />
              ) : (
                <Eye size={16} color={colors.neutral[500]} />
              )}
            </TouchableOpacity>
          </View>

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.fieldErrorText}>
              Les mots de passe ne correspondent pas.
            </Text>
          )}
        </View>
      )}

      {/* ── 7. Bouton Soumission (Dark Forest Web Style) ────────────────── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={[
          styles.submitBtn,
          canSubmit ? styles.submitBtnActive : styles.submitBtnDisabled,
        ]}
      >
        {loading ? (
          <>
            <ActivityIndicator color={colors.lime[300]} />
            <Text style={styles.submitBtnTextActive} numberOfLines={1}>
              Enregistrement…
            </Text>
          </>
        ) : (
          <Text
            style={[
              styles.submitBtnText,
              canSubmit ? styles.submitBtnTextActive : styles.submitBtnTextDisabled,
            ]}
            numberOfLines={1}
          >
            Mettre à jour ma sécurité
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.sm,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 15,
    color: colors.forest[950],
  },
  headerSubtitle: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
  },

  // Status Chips Web
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipSuccess: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[100],
  },
  chipWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  chipTextSuccess: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.forest[800],
  },
  chipTextWarning: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: '#B45309',
  },

  // Banners & Errors
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.inner,
    padding: 10,
  },
  infoBannerText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    borderRadius: radius.inner,
    padding: 10,
  },
  errorText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 11,
    color: colors.error[700],
    flex: 1,
  },

  // Fields
  fieldBlock: {
    gap: 5,
  },
  fieldLabel: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 12,
    color: colors.forest[950],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },
  inputIcon: {
    marginRight: 8,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.forest[950],
  },
  eyeBtn: {
    padding: 6,
  },
  fieldErrorText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.error[700],
    marginTop: 2,
  },

  // Password Strength Live Pills
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  strengthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillDefault: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
  },
  pillValid: {
    backgroundColor: colors.forest[50],
    borderColor: colors.forest[100],
  },
  strengthPillText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.neutral[500],
  },
  strengthPillTextValid: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[800],
  },

  // Submit Button (Web Dark Forest Style)
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  submitBtnActive: {
    backgroundColor: colors.forest[950],
    ...shadows.action,
  },
  submitBtnDisabled: {
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  submitBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 13,
  },
  submitBtnTextActive: {
    color: colors.lime[300],
  },
  submitBtnTextDisabled: {
    color: colors.neutral[400],
  },
});
