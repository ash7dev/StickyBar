'use client';

import { useState } from 'react';
import { authApi } from '@/lib/nestjs';
import { useRoleStore } from '@/stores/role.store';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

interface Props { onDone: () => void }

const E164 = /^\+[1-9]\d{6,14}$/;

const inputCls = cn(
  'w-full rounded-xl border border-border px-4 py-3 text-sm text-neutral-900',
  'placeholder:text-neutral-300',
  'outline-none transition-all',
  'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
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
      setError('Numéro invalide. Utilisez le format international, par ex. +221774606330');
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
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-600">Numéro de téléphone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+221 77 000 00 00"
            className={inputCls}
          />
        </div>

        {error && (
          <p className="text-[11px] font-medium text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={sendOtp}
          disabled={loading || !phone.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl py-3 transition-colors"
        >
          {loading ? 'Envoi…' : 'Recevoir le code SMS'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info numéro */}
      <div className="flex items-center gap-2 bg-neutral-50 border border-border rounded-xl px-4 py-3">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        <p className="text-sm text-neutral-500">
          Code envoyé au <span className="font-bold text-neutral-900">{phone}</span>
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-600">Code de vérification</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="_ _ _ _ _ _"
          maxLength={6}
          inputMode="numeric"
          className={cn(
            inputCls,
            'text-center text-2xl font-black tracking-[0.5em] py-4',
          )}
        />
      </div>

      {error && (
        <p className="text-[11px] font-medium text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

        <button
          onClick={verifyOtp}
        disabled={loading || code.length < 6}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl py-3 transition-colors"
        >
        {loading ? 'Vérification…' : 'Confirmer le code'}
      </button>

      <div className="flex justify-center">
        <button
          onClick={() => { setSent(false); setCode(''); setError(''); }}
          className="text-xs font-medium text-neutral-400 hover:text-emerald-600 transition-colors"
        >
          Renvoyer le code
        </button>
      </div>
    </div>
  );
}
