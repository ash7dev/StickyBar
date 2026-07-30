'use client';

import { useState } from 'react';
import { authApi } from '@/lib/nestjs';
import { useRoleStore } from '@/stores/role.store';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Smartphone, CheckCircle2 } from 'lucide-react';

interface Props { onDone: () => void }

const E164 = /^\+[1-9]\d{6,14}$/;

const inputCls = cn(
  'w-full rounded-field bg-background-alt border border-border px-4 py-3 text-sm font-semibold text-foreground',
  'placeholder:text-foreground-faint',
  'outline-none transition-all',
  'focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20',
);

export function StepPhoneVerify({ onDone }: Props) {
  const supabase = createClient();
  const { setGateStatus, setSession, setOnboardingDraft, needsOnboarding, onboardingDraft } = useRoleStore();
  const [phone, setPhone]     = useState('');
  const [code, setCode]       = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
    if (!code.trim()) return;
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

  if (!sent) {
    return (
      <div className="space-y-4">
        <div>
          <label className="eyebrow block mb-1.5">Numéro de téléphone portable</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+221 77 123 45 67"
            className={inputCls}
          />
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info numéro */}
      <div className="flex items-center gap-2.5 bg-background-alt border border-border rounded-inner px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-forest-600 shrink-0 animate-pulse" />
        <p className="text-xs font-semibold text-foreground-muted">
          Code SMS envoyé au <span className="font-bold text-foreground">{phone}</span>
        </p>
      </div>

      <div>
        <label className="eyebrow block mb-1.5">Code de vérification à 6 chiffres</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="──────"
          maxLength={6}
          inputMode="numeric"
          className={cn(
            inputCls,
            'text-center text-2xl font-display font-bold tracking-[0.4em] py-3',
          )}
        />
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-error-600 bg-error-50 border border-error-500/30 rounded-inner px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={verifyOtp}
        disabled={loading || code.length < 6}
        className="btn-action w-full text-xs justify-center cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Vérification…</>
        ) : (
          'Confirmer le code SMS'
        )}
      </button>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => { setSent(false); setCode(''); setError(''); }}
          className="text-xs font-semibold text-foreground-muted hover:text-forest-600 transition-colors cursor-pointer"
        >
          Renvoyer le code SMS
        </button>
      </div>
    </div>
  );
}
