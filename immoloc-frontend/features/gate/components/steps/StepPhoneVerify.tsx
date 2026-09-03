'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/nestjs';
import { useRoleStore } from '@/stores/role.store';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Smartphone, Lock } from 'lucide-react';

interface Props { onDone: () => void }

const E164 = /^\+[1-9]\d{6,14}$/;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const inputCls = cn(
  'w-full rounded-field bg-background-alt border border-border px-4 py-3 text-sm font-semibold text-foreground',
  'placeholder:text-foreground-faint',
  'outline-none transition-all',
  'focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20',
);

/* ─── OTP Input Component ─────────────────────────────────────────────────── */

function OtpInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(OTP_LENGTH, '').split('').slice(0, OTP_LENGTH);

  const focusAt = useCallback((i: number) => {
    if (i >= 0 && i < OTP_LENGTH) {
      refs.current[i]?.focus();
    }
  }, []);

  function handleChange(i: number, char: string) {
    // Only accept digits
    const digit = char.replace(/\D/g, '').slice(-1);
    const arr = digits.slice();
    arr[i] = digit;
    const newVal = arr.join('').replace(/ /g, '');
    onChange(newVal);

    // Auto-advance
    if (digit && i < OTP_LENGTH - 1) {
      focusAt(i + 1);
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = digits.slice();
      if (arr[i] && arr[i] !== ' ') {
        arr[i] = ' ';
        onChange(arr.join('').trimEnd());
      } else if (i > 0) {
        arr[i - 1] = ' ';
        onChange(arr.join('').trimEnd());
        focusAt(i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      focusAt(i - 1);
    } else if (e.key === 'ArrowRight') {
      focusAt(i + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted) {
      onChange(pasted);
      focusAt(Math.min(pasted.length, OTP_LENGTH - 1));
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d === ' ' ? '' : d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-10 sm:h-14 sm:w-12 rounded-field border-2 bg-background-alt text-center font-display text-xl sm:text-2xl font-bold text-foreground',
            'outline-none transition-all duration-150',
            'focus:border-forest-600 focus:ring-4 focus:ring-forest-500/15 focus:bg-background-card',
            error
              ? 'border-error-500/50'
              : d && d !== ' '
                ? 'border-forest-500 bg-forest-50/30'
                : 'border-border',
          )}
          aria-label={`Chiffre ${i + 1}`}
        />
      ))}
    </div>
  );
}

/* ─── Countdown timer ─────────────────────────────────────────────────────── */

function useCountdown(startSeconds: number, active: boolean) {
  const [remaining, setRemaining] = useState(startSeconds);

  useEffect(() => {
    if (!active) { setRemaining(startSeconds); return; }
    setRemaining(startSeconds);
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(interval); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, startSeconds]);

  return remaining;
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export function StepPhoneVerify({ onDone }: Props) {
  const supabase = createClient();
  const { setGateStatus, setSession, setOnboardingDraft, needsOnboarding, onboardingDraft } = useRoleStore();
  const [phone, setPhone]     = useState('');
  const [code, setCode]       = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const countdown = useCountdown(RESEND_COOLDOWN, sent);
  const canResend = countdown === 0;

  async function sendOtp() {
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) return;

    if (!E164.test(normalizedPhone)) {
      setError('Numéro invalide. Utilisez le format international, ex. +221774606330');
      return;
    }

    setLoading(true); setError('');
    try {
      if (needsOnboarding) {
        setSent(true);
        return;
      }

      await authApi.sendCurrentPhoneOtp({ phone: normalizedPhone });
      setSent(true);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Erreur lors de l\'envoi du SMS');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!code.trim() || code.length < OTP_LENGTH) return;
    setLoading(true); setError('');
    try {
      if (needsOnboarding) {
        if (!onboardingDraft) {
          throw new Error('Veuillez compléter votre profil avant de vérifier le téléphone');
        }

        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          throw new Error('Session Supabase introuvable');
        }

        const result = await authApi.completeOnboarding({
          prenom: onboardingDraft.prenom,
          nom: onboardingDraft.nom,
          dateNaissance: onboardingDraft.dateNaissance,
          phone,
          token: code,
        }, accessToken);

        setSession({
          token: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
          role: result.user.activeRole,
          estProprietaire: result.user.estProprietaire,
          userId: result.user.id,
          hasAnnonce: result.user.hasAnnonce,
          profileCompleted: result.user.profileCompleted,
          phoneVerified: result.user.phoneVerified,
          statutKyc: result.user.statutKyc,
          dateNaissance: result.user.dateNaissance,
        });
        setOnboardingDraft(null);
      } else {
        await authApi.verifyCurrentPhoneOtp({ phone, token: code });
        setGateStatus({ phoneVerified: true });
      }

      onDone();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  }

  /* ── Saisie du numéro ── */
  if (!sent) {
    return (
      <div className="space-y-4">
        <div>
          <label className="eyebrow flex items-center gap-1.5 mb-1.5">
            <Smartphone className="h-3 w-3 text-foreground-muted" aria-hidden="true" />
            Numéro de téléphone portable
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+221 77 123 45 67"
              className={cn(inputCls, 'pl-11')}
            />
          </div>
        </div>

        {error && (
          <p className="text-[11px] font-semibold text-error-600 bg-error-50 border border-error-500/30 rounded-inner px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={sendOtp}
          disabled={loading || !phone.trim()}
          className="btn-action w-full text-xs justify-center cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
          ) : (
            'Recevoir le code SMS'
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-[10px] text-foreground-faint">
          <Lock className="h-2.5 w-2.5" aria-hidden="true" />
          Votre numéro ne sera jamais partagé
        </p>
      </div>
    );
  }

  /* ── Saisie du code OTP ── */
  return (
    <div className="space-y-5">
      {/* Info numéro */}
      <div className="flex items-center gap-2.5 bg-forest-50 border border-forest-100 rounded-inner px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-forest-600 shrink-0 animate-pulse" />
        <p className="text-xs font-semibold text-forest-800">
          Code SMS envoyé au <span className="font-bold text-forest-900">{phone}</span>
        </p>
      </div>

      {/* OTP Input – 6 cases individuelles */}
      <div className="space-y-2">
        <label className="eyebrow block text-center mb-3">Code de vérification</label>
        <OtpInput
          value={code}
          onChange={setCode}
          error={!!error}
        />
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-error-600 bg-error-50 border border-error-500/30 rounded-inner px-3 py-2 text-center">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={verifyOtp}
        disabled={loading || code.length < OTP_LENGTH}
        className="btn-action w-full text-xs justify-center cursor-pointer disabled:opacity-40"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Vérification…</>
        ) : (
          'Confirmer le code SMS'
        )}
      </button>

      {/* Resend with countdown */}
      <div className="flex justify-center pt-1">
        {canResend ? (
          <button
            type="button"
            onClick={() => { setSent(false); setCode(''); setError(''); }}
            className="text-xs font-semibold text-forest-700 hover:text-forest-800 transition-colors cursor-pointer"
          >
            Renvoyer le code SMS
          </button>
        ) : (
          <p className="text-xs text-foreground-muted">
            Renvoyer dans <span className="font-bold text-foreground tabular-nums">{countdown}s</span>
          </p>
        )}
      </div>
    </div>
  );
}
