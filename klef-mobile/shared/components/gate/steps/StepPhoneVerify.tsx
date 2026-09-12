import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Smartphone, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react-native';
import { colors, radius, shadows, typography } from '../../../theme/tokens';
import { apiClient } from '../../../api/api-client';
import { useAuthStore } from '../../../../features/auth/stores/auth.store';
import { PhoneInputWithCountry } from '../../ui/PhoneInputWithCountry';

interface StepPhoneVerifyProps {
  onDone: () => void;
}

export function StepPhoneVerify({ onDone }: StepPhoneVerifyProps) {
  const { user, setUser } = useAuthStore();

  const [telephone, setTelephone] = useState(user?.telephone || '');
  const [subStep, setSubStep] = useState<'input' | 'otp'>('input');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (subStep === 'otp' && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [subStep, resendTimer]);

  const handleSendOtp = async () => {
    if (!telephone || telephone.trim().length < 8) {
      setError('Veuillez saisir un numéro de téléphone valide.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/login/phone/send', {
        telephone: telephone.trim(),
      });

      setSubStep('otp');
      setResendTimer(30);
      setLoading(false);
    } catch (err: any) {
      console.error('[StepPhoneVerify] Erreur envoi SMS OTP:', err);
      const msg =
        err.response?.data?.message || 'Erreur lors de l’envoi du SMS OTP.';
      setError(msg);
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleanText.length > 1) {
      // Cas du collé
      const pasted = cleanText.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      inputRefs.current[5]?.focus();
      return;
    }

    newDigits[index] = cleanText;
    setOtpDigits(newDigits);

    if (cleanText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Veuillez saisir le code complet à 6 chiffres.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<any>('/auth/login/phone/verify', {
        telephone: telephone.trim(),
        otp: otpCode,
      });

      if (user) {
        const updatedUser = {
          ...user,
          ...response.data?.user,
          telephone: telephone.trim(),
          phoneVerified: true,
        };
        setUser(updatedUser);
      }

      setLoading(false);
      onDone();
    } catch (err: any) {
      console.error('[StepPhoneVerify] Erreur vérification SMS OTP:', err);
      const msg =
        err.response?.data?.message || 'Code OTP invalide ou expiré.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {subStep === 'input' ? (
        <>
          {/* Saisie Numéro de Téléphone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NUMÉRO DE TÉLÉPHONE</Text>
            <PhoneInputWithCountry
              value={telephone}
              onChange={setTelephone}
            />
            <Text style={styles.fieldHelpText}>
              Un SMS contenant un code de confirmation à 6 chiffres sera envoyé à ce numéro.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color={colors.error[600]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSendOtp}
            disabled={loading || telephone.trim().length < 8}
            style={[
              styles.submitButton,
              (loading || telephone.trim().length < 8) && styles.submitButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.forest[950]} size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Recevoir le code SMS</Text>
                <ArrowRight size={16} color={colors.forest[950]} />
              </>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Saisie du code OTP 6 chiffres */}
          <View style={styles.fieldGroup}>
            <View style={styles.otpHeaderRow}>
              <Text style={styles.fieldLabel}>CODE DE CONFIRMATION (SMS)</Text>
              <TouchableOpacity
                onPress={() => {
                  setSubStep('input');
                  setError(null);
                }}
              >
                <Text style={styles.changePhoneText}>Changer</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.otpSubtext}>
              Code envoyé au <Text style={styles.phoneHighlight}>{telephone}</Text>
            </Text>

            <View style={styles.otpDigitsRow}>
              {otpDigits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => { inputRefs.current[idx] = ref; }}
                  value={digit}
                  onChangeText={(text) => handleOtpDigitChange(text, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={[
                    styles.otpBox,
                    Boolean(digit) && styles.otpBoxFilled,
                  ]}
                  selectTextOnFocus={true}
                />
              ))}
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color={colors.error[600]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Bouton Renvoyer le code */}
          <View style={styles.resendRow}>
            {resendTimer > 0 ? (
              <Text style={styles.timerText}>
                Renvoyer le code dans <Text style={styles.timerBold}>{resendTimer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendOtp}
                style={styles.resendBtn}
              >
                <RefreshCw size={13} color={colors.forest[600]} />
                <Text style={styles.resendBtnText}>Renvoyer un nouveau code</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bouton Valider OTP */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleVerifyOtp}
            disabled={loading || otpDigits.join('').length < 6}
            style={[
              styles.submitButton,
              (loading || otpDigits.join('').length < 6) && styles.submitButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.forest[950]} size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Valider mon numéro</Text>
                <CheckCircle2 size={16} color={colors.forest[950]} />
              </>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingTop: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.neutral[600],
    letterSpacing: 0.5,
  },
  fieldHelpText: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changePhoneText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.forest[600],
    textDecorationLine: 'underline',
  },
  otpSubtext: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  phoneHighlight: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
  otpDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  otpBox: {
    flex: 1,
    height: 48,
    backgroundColor: colors.neutral[50],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.inner,
    textAlign: 'center',
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.forest[950],
  },
  otpBoxFilled: {
    borderColor: colors.forest[600],
    backgroundColor: colors.forest[50],
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  timerText: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.neutral[500],
  },
  timerBold: {
    fontFamily: typography.fontBodyBold,
    color: colors.forest[950],
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.forest[600],
    textDecorationLine: 'underline',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    padding: 10,
    borderRadius: radius.inner,
  },
  errorText: {
    flex: 1,
    fontFamily: typography.fontBodyMedium,
    fontSize: 11.5,
    color: colors.error[700],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.lime[400],
    paddingVertical: 14,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadows.xs,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
  submitButtonText: {
    fontFamily: typography.fontBodyExtraBold,
    fontSize: 13.5,
    color: colors.forest[950],
  },
});
