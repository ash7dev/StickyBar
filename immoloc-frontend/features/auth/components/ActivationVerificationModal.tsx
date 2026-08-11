'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, Phone, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { OtpChannelType } from '@/lib/nestjs';
import { SubmitButton, ErrorBanner } from './auth-form-primitives';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  phone: string;
  next?: string;
}

export function ActivationVerificationModal({
  isOpen,
  onClose,
  email,
  phone,
  next,
}: Props) {
  const { verifyRegisterOtp, sendPhoneOtp, resendConfirmation } = useAuth();

  const [step, setStep] = useState<'CHANNEL_SELECT' | 'OTP_INPUT'>('CHANNEL_SELECT');
  const [selectedChannel, setSelectedChannel] = useState<OtpChannelType>('SMS');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('CHANNEL_SELECT');
      setSelectedChannel('SMS');
      setOtp(Array(6).fill(''));
      setError(null);
      setResendSuccess(false);
    }
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleChannelSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (selectedChannel === 'SMS') {
        // Envoi SMS via le backend s'il existe une fonction ou passage direct à la saisie avec simulation
        await sendPhoneOtp(phone).catch(() => {
          // Ignorer en mode dev simulation si le numéro est fictif
        });
      } else {
        await resendConfirmation(email).catch(() => {
          // Ignorer si déjà envoyé au register
        });
      }
      setStep('OTP_INPUT');
      setResendCooldown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (e: any) {
      // Passer quand même à la saisie pour autoriser le code 123456
      setStep('OTP_INPUT');
      setResendCooldown(60);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Remplir la case courante avec le dernier chiffre saisi
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus vers le champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Veuillez saisir les 6 chiffres du code OTP.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await verifyRegisterOtp(
        {
          type: selectedChannel,
          email: selectedChannel === 'EMAIL' ? email : undefined,
          phone: selectedChannel === 'SMS' ? phone : undefined,
          token: code,
        },
        next,
      );
      onClose();
    } catch (e: any) {
      setError(e.message || 'Code de vérification invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setResendSuccess(false);

    try {
      if (selectedChannel === 'SMS') {
        await sendPhoneOtp(phone).catch(() => { });
      } else {
        await resendConfirmation(email);
      }
      setResendSuccess(true);
      setResendCooldown(60);
    } catch (e: any) {
      setError('Impossible de renvoyer le code pour le moment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop — token --overlay plutôt qu'un forest-950/60 codé en dur */}
      <div
        className="fixed inset-0 bg-overlay backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card — rounded-card (token --radius-card) + shadow-xl (dans l'échelle) */}
      <div className="relative w-full max-w-lg rounded-card border border-border bg-background p-6 shadow-xl transition-all dark:border-forest-800 dark:bg-forest-950 sm:p-8">

        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4 dark:border-forest-800/60">
          {step === 'OTP_INPUT' ? (
            <button
              type="button"
              onClick={() => setStep('CHANNEL_SELECT')}
              className="flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:text-forest-800 dark:text-forest-300"
            >
              <ArrowLeft className="h-4 w-4" /> Changer de canal
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest-700 dark:text-forest-400">
              <ShieldCheck className="h-4 w-4" /> Activation du compte
            </div>
          )}

          <span className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2.5 py-1 text-[11px] font-medium text-forest-800 dark:bg-forest-900/60 dark:text-forest-200">
            Étape {step === 'CHANNEL_SELECT' ? '1/2' : '2/2'}
          </span>
        </div>

        {/* Step 1: Selection du Canal */}
        {step === 'CHANNEL_SELECT' && (
          <div className="space-y-6">
            <div>
              {/* text-foreground s'adapte tout seul en dark, plus besoin de dark:text-white (blanc pur interdit par le système) */}
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Où souhaitez-vous recevoir votre code ?
              </h2>
              <p className="mt-1.5 text-sm text-foreground-muted">
                Validez votre compte Klef en un clic pour accéder immédiatement à toutes les offres de logements.
              </p>
            </div>

            <div className="grid gap-3.5">
              {/* Option SMS */}
              <div
                onClick={() => setSelectedChannel('SMS')}
                className={`group relative flex cursor-pointer items-start gap-4 rounded-card border p-4 transition-all ${selectedChannel === 'SMS'
                    ? 'border-forest-600 bg-forest-50/50 dark:border-forest-500 dark:bg-forest-900/20 shadow-sm'
                    : 'border-border hover:border-forest-300 bg-background-card dark:border-forest-800/80'
                  }`}
              >
                <div
                  className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-inner ${selectedChannel === 'SMS'
                      ? 'bg-forest-600 text-white'
                      : 'bg-neutral-100 text-foreground-muted group-hover:bg-forest-100 group-hover:text-forest-700 dark:bg-forest-900/60'
                    }`}
                >
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">SMS / WhatsApp</h3>
                    <span className="text-xs font-mono font-medium text-forest-700 dark:text-forest-300">{phone}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Code rapide à 6 chiffres envoyé instantanément sur votre mobile.
                  </p>
                </div>
                <div className="mt-1">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedChannel === 'SMS'
                        ? 'border-forest-600 bg-forest-600'
                        : 'border-neutral-300 dark:border-forest-700'
                      }`}
                  >
                    {selectedChannel === 'SMS' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Option Email */}
              <div
                onClick={() => setSelectedChannel('EMAIL')}
                className={`group relative flex cursor-pointer items-start gap-4 rounded-card border p-4 transition-all ${selectedChannel === 'EMAIL'
                    ? 'border-forest-600 bg-forest-50/50 dark:border-forest-500 dark:bg-forest-900/20 shadow-sm'
                    : 'border-border hover:border-forest-300 bg-background-card dark:border-forest-800/80'
                  }`}
              >
                <div
                  className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-inner ${selectedChannel === 'EMAIL'
                      ? 'bg-forest-600 text-white'
                      : 'bg-neutral-100 text-foreground-muted group-hover:bg-forest-100 group-hover:text-forest-700 dark:bg-forest-900/60'
                    }`}
                >
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground text-sm">Adresse Email</h3>
                    <span className="text-xs font-medium text-forest-700 dark:text-forest-300">{email}</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Un code de confirmation sera acheminé dans votre boîte de réception.
                  </p>
                </div>
                <div className="mt-1">
                  <div
                    className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedChannel === 'EMAIL'
                        ? 'border-forest-600 bg-forest-600'
                        : 'border-neutral-300 dark:border-forest-700'
                      }`}
                  >
                    {selectedChannel === 'EMAIL' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            </div>

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <SubmitButton
              loading={loading}
              loadingLabel="Envoi du code..."
              type="button"
              onClick={handleChannelSubmit}
            >
              Envoyer le code de vérification
            </SubmitButton>
          </div>
        )}

        {/* Step 2: Saisie du Code OTP */}
        {step === 'OTP_INPUT' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Saisissez votre code à 6 chiffres
              </h2>
              <p className="mt-1.5 text-sm text-foreground-muted">
                Un code a été envoyé via {selectedChannel === 'SMS' ? 'SMS à' : 'Email à'}{' '}
                <strong className="font-semibold text-foreground">
                  {selectedChannel === 'SMS' ? phone : email}
                </strong>.
              </p>
            </div>

            {/* Simulation Dev Badge — gold-950/gold-900 n'existent pas dans la rampe (max 800),
                remplacés par les stops réels + le pattern rgba(gold-400) utilisé par .badge-verified en dark */}
            <div className="flex items-center gap-2.5 rounded-inner border border-gold-300/60 bg-gold-50/70 p-3 text-xs text-gold-700 dark:border-gold-400/30 dark:bg-gold-400/10 dark:text-gold-200">
              <Sparkles className="h-4 w-4 shrink-0 text-gold-600 dark:text-gold-400" />
              <span>
                💡 <strong>Code de démonstration / test :</strong> Saisissez <code className="rounded bg-gold-200/80 px-1.5 py-0.5 font-mono font-bold text-gold-800 dark:bg-gold-400/20 dark:text-gold-200">123456</code> pour valider immédiatement.
              </span>
            </div>

            {/* Inputs OTP — type="text" + inputMode="numeric" déjà conforme à la règle système.
                rounded-field (token --radius-field) car ce sont des champs de saisie, pas des squircles d'icône.
                Ring dark ajouté pour matcher --ring qui passe à lime-400 en sombre. */}
            <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="h-12 w-11 sm:h-14 sm:w-14 rounded-field border border-border bg-background-card text-center text-xl font-bold text-forest-900 shadow-xs transition-all focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-500/20 dark:border-forest-800 dark:bg-forest-900/30 dark:text-white dark:focus:border-forest-400 dark:focus:ring-lime-400/20"
                />
              ))}
            </div>

            {resendSuccess && (
              <div className="flex items-center gap-2 text-xs text-success-600 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Un nouveau code a été envoyé !
              </div>
            )}

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <SubmitButton
              loading={loading}
              loadingLabel="Vérification..."
              type="button"
              onClick={handleVerify}
            >
              Valider et Activer mon Compte
            </SubmitButton>

            <div className="text-center text-xs text-foreground-muted">
              {resendCooldown > 0 ? (
                <span>Renvoyer le code dans <strong className="tabular-nums font-semibold">{resendCooldown}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="font-semibold text-forest-700 hover:underline dark:text-forest-300"
                >
                  Vous n'avez pas reçu le code ? Renvoyer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}