import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, RefreshCw, AlertCircle, Mail, Phone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { AppButton } from '../../shared/components/ui/AppButton';
import { colors, radius, typography } from '../../shared/theme/tokens';

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

  // Timer 30 secondes pour le renvoi d'OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    setLocalError(null);
    if (!otp || otp.length < 6) {
      setLocalError('Veuillez saisir le code à 6 chiffres');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    let success = false;
    if (isEmailMode) {
      success = await verifyRegisterEmailOtp(targetEmail, otp);
    } else {
      success = await verifyPhoneOtp(targetPhone, otp);
    }

    if (success) {
      router.replace('/(tenant)');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    setLocalError(null);
    if (!isEmailMode) {
      await sendPhoneOtp(targetPhone);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Back Header */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.neutral[900]} />
          </TouchableOpacity>

          {/* Header Icon */}
          <View style={styles.iconBox}>
            {isEmailMode ? (
              <Mail size={32} color={colors.forest[600]} />
            ) : (
              <Phone size={32} color={colors.forest[600]} />
            )}
          </View>

          <Text style={styles.title}>Vérification du Code</Text>
          <Text style={styles.subtitle}>
            Code à 6 chiffres envoyé par {isEmailMode ? 'email' : 'SMS'} à{' '}
            <Text style={styles.recipientBold}>{targetRecipient}</Text>
          </Text>

          {/* Alert Message */}
          {(error || localError) ? (
            <View style={styles.errorAlert}>
              <AlertCircle size={18} color={colors.error[700]} />
              <Text style={styles.errorAlertText}>{error || localError}</Text>
            </View>
          ) : null}

          {/* OTP Input Field */}
          <View style={styles.otpWrapper}>
            <TextInput
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(val) => setOtp(val.replace(/\D/g, ''))}
              placeholder="000000"
              placeholderTextColor={colors.neutral[300]}
              style={styles.otpInput}
              value={otp}
            />
          </View>

          <AppButton
            disabled={otp.length < 6}
            label="Valider et continuer"
            loading={loading}
            onPress={handleVerify}
            size="lg"
            variant="action"
          />

          {/* Resend Link with Timer */}
          {!isEmailMode ? (
            <View style={styles.resendSection}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={countdown > 0}
                onPress={handleResend}
                style={styles.resendBtn}
              >
                <RefreshCw size={16} color={countdown > 0 ? colors.neutral[400] : colors.forest[600]} />
                <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                  {countdown > 0
                    ? `Renvoyer le code dans ${countdown}s`
                    : 'Renvoyer un nouveau code'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    lineHeight: 20,
    marginBottom: 24,
  },
  recipientBold: {
    fontWeight: '700',
    color: colors.neutral[900],
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

  // OTP Input
  otpWrapper: {
    alignItems: 'center',
    marginBottom: 28,
  },
  otpInput: {
    width: '100%',
    height: 60,
    backgroundColor: colors.neutral[0],
    borderWidth: 2,
    borderColor: colors.forest[600],
    borderRadius: radius.field,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 12,
    color: colors.neutral[900],
  },

  // Resend
  resendSection: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
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
});
