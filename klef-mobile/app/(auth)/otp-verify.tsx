import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  Edit3,
  Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AppButton } from '../../shared/components/ui/AppButton';
import { colors, radius, shadows, typography } from '../../shared/theme/tokens';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const { phone, email } = useLocalSearchParams<{ phone?: string; email?: string }>();
  const targetPhone = phone ? decodeURIComponent(phone) : '';
  const targetEmail = email ? decodeURIComponent(email) : '';

  const isEmailMode = Boolean(targetEmail);
  const targetRecipient = isEmailMode ? targetEmail : targetPhone;

  const { verifyPhoneOtp, verifyRegisterEmailOtp, sendPhoneOtp, loading, error } = useAuth();
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const hiddenInputRef = useRef<TextInput>(null);

  // Timer 30 secondes pour le renvoi d'OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 6);
    setOtp(cleanVal);
    setLocalError(null);

    // Auto-soumission au 6ème chiffre
    if (cleanVal.length === 6) {
      triggerVerify(cleanVal);
    }
  };

  const triggerVerify = async (code: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    let success = false;
    if (isEmailMode) {
      success = await verifyRegisterEmailOtp(targetEmail, code);
    } else {
      success = await verifyPhoneOtp(targetPhone, code);
    }

    if (success) {
      router.replace('/(tenant)' as any);
    }
  };


  const handleVerifyPress = () => {
    if (otp.length < 6) {
      setLocalError('Veuillez saisir le code à 6 chiffres');
      return;
    }
    triggerVerify(otp);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    setLocalError(null);
    setOtp('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!isEmailMode) {
      await sendPhoneOtp(targetPhone);
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

            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandBadgeText}>VERIFICATION 2FA</Text>
            </View>
          </View>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconBoxContainer}>
              <View style={styles.iconBox}>
                {isEmailMode ? (
                  <Mail size={26} color={colors.forest[600]} />
                ) : (
                  <Phone size={26} color={colors.forest[600]} />
                )}
              </View>
              <View style={styles.lockBadge}>
                <Lock size={12} color={colors.forest[800]} />
              </View>
            </View>

            <Text style={styles.title}>Code de Vérification</Text>
            <Text style={styles.subtitle}>
              Un code de sécurité à 6 chiffres a été envoyé par {isEmailMode ? 'email' : 'SMS'} à :
            </Text>

            {/* Recipient Pill with Edit Action */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              style={styles.recipientPill}
            >
              <Text style={styles.recipientText}>{targetRecipient}</Text>
              <Edit3 size={14} color={colors.forest[600]} />
            </TouchableOpacity>
          </View>

          {/* Error Alert Box */}
          {error || localError ? (
            <View style={styles.errorAlert}>
              <AlertCircle size={18} color={colors.error[600]} />
              <Text style={styles.errorAlertText}>{error || localError}</Text>
            </View>
          ) : null}

          {/* Form Card Container */}
          <View style={styles.cardContainer}>
            {/* Hidden Input for Keyboard Focus */}
            <TextInput
              ref={hiddenInputRef}
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
              onBlur={() => setIsFocused(false)}
              onChangeText={handleOtpChange}
              onFocus={() => setIsFocused(true)}
              style={styles.hiddenTextInput}
              value={otp}
            />

            {/* 6 Digit Cells Grid */}
            <Pressable
              onPress={() => hiddenInputRef.current?.focus()}
              style={styles.pinGridContainer}
            >
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const digit = otp[index] || '';
                const isCurrentIndex = otp.length === index;
                const isCellActive = isFocused && (isCurrentIndex || (index === 5 && otp.length === 6));
                const isFilled = digit.length > 0;

                return (
                  <View
                    key={index}
                    style={[
                      styles.pinCell,
                      isFilled && styles.pinCellFilled,
                      isCellActive && styles.pinCellActive,
                    ]}
                  >
                    <Text style={[styles.pinDigit, isFilled && styles.pinDigitFilled]}>
                      {digit}
                    </Text>
                    {isCellActive && !isFilled && <View style={styles.cursorIndicator} />}
                  </View>
                );
              })}
            </Pressable>

            {/* Submit Action Button */}
            <AppButton
              disabled={otp.length < 6}
              fullWidth
              label="Valider et continuer"
              loading={loading}
              onPress={handleVerifyPress}
              size="lg"
              variant="action"
            />
          </View>

          {/* Resend Link with Timer */}
          {!isEmailMode ? (
            <View style={styles.resendSection}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={countdown > 0}
                onPress={handleResend}
                style={[styles.resendBtn, countdown > 0 && styles.resendBtnDisabled]}
              >
                <RefreshCw
                  size={15}
                  color={countdown > 0 ? colors.neutral[400] : colors.forest[600]}
                />
                <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                  {countdown > 0
                    ? `Renvoyer le SMS dans ${countdown}s`
                    : 'Renvoyer un nouveau code SMS'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Security Badge */}
          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color={colors.neutral[400]} />
            <Text style={styles.securityBadgeText}>
              Protection renforcée SSL • Code éphémère sécurisé Klef
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
    alignItems: 'flex-start',
  },
  iconBoxContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    backgroundColor: colors.lime[400],
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 10,
  },

  recipientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.forest[50],
    borderWidth: 1,
    borderColor: colors.forest[100],
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  recipientText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
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

  // Hidden TextInput
  hiddenTextInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },

  // 6-Digit PIN Grid
  pinGridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  pinCell: {
    flex: 1,
    height: 54,
    borderRadius: radius.field,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCellFilled: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[300],
  },
  pinCellActive: {
    borderColor: colors.forest[600],
    backgroundColor: colors.neutral[0],
    ...shadows.xs,
  },
  pinDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[400],
  },
  pinDigitFilled: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.neutral[900],
  },
  cursorIndicator: {
    width: 2,
    height: 20,
    backgroundColor: colors.forest[600],
    borderRadius: 1,
  },

  // Resend
  resendSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.neutral[0],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.forest[100],
    ...shadows.xs,
  },
  resendBtnDisabled: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  resendText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.forest[600],
  },
  resendTextDisabled: {
    color: colors.neutral[500],
    fontWeight: '500',
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



