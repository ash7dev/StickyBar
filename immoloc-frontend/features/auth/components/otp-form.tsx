'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useCountdown } from '@/hooks/use-countdown';
import { ApiError } from '@/lib/nestjs/api-client';

// Page /verify — utilisée après la connexion par téléphone
// Le numéro est passé en query param : /verify?phone=%2B221771234567
export function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';

  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const { seconds, isRunning, start } = useCountdown(60);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Démarrer le countdown au montage
  useEffect(() => { start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    // Focus suivant
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  }

  async function handleVerify() {
    const token = otp.join('');
    if (token.length < 6) return;

    setError(null);
    setLoading(true);
    try {
      await verifyPhoneOtp(phone, token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code invalide');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (isRunning) return;
    setError(null);
    try {
      await sendPhoneOtp(phone);
      start();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur lors du renvoi');
    }
  }

  const isFilled = otp.every(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Vérification</h2>
        <p className="text-foreground-muted text-sm mt-1">
          Code envoyé au <span className="font-medium text-neutral-700">{phone}</span>
        </p>
      </div>

      {/* Inputs OTP 6 cases */}
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-0 ${
              digit
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700'
                : 'border-border text-foreground'
            } focus:border-emerald-500 shadow-sm`}
          />
        ))}
      </div>

      {error && (
        <div className="bg-error-500/10 border border-error-500/20 rounded-lg px-3 py-2 text-error-600 text-sm text-center">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleVerify}
        disabled={!isFilled || loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Vérification...' : 'Confirmer'}
      </button>

      {/* Renvoi + countdown */}
      <div className="text-center">
        {isRunning ? (
          <p className="text-sm text-neutral-500">
            Renvoi disponible dans{' '}
            <span className="font-medium text-neutral-700 tabular-nums">{seconds}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="flex items-center gap-1.5 mx-auto text-sm text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Renvoyer le code
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => router.push('/login')}
        className="w-full text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        ← Retour à la connexion
      </button>
    </div>
  );
}
