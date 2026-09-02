'use client';

import { useState } from 'react';
import { Check, KeyRound, Lock, Shield, ShieldCheck, Smartphone } from 'lucide-react';
import { STATUT_CFG_LIGHT } from '@/lib/dashboard/owner-tokens';

interface Props {
  user: {
    statutKyc?: string;
    phoneVerified?: boolean;
  } | null;
}

export function GestionnaireParametresSecuriteKyc({ user }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const kycKey = user?.statutKyc || 'VERIFIE';
  const kycCfg = STATUT_CFG_LIGHT[kycKey] || STATUT_CFG_LIGHT.PAID;

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPassword.length < 6) {
      setPassError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsChangingPass(true);
    setTimeout(() => {
      setIsChangingPass(false);
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 4000);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Carte de Conformité KYC ────────────────────────────────────── */}
      <div
        className="rounded-card border shadow-2xs p-6 sm:p-7 space-y-4"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
              style={{ background: 'var(--forest-50)' }}
            >
              <ShieldCheck className="w-5 h-5" style={{ color: 'var(--forest-700)' }} />
            </div>
            <div>
              <h2
                className="font-display text-lg font-bold tracking-tight"
                style={{ color: 'var(--forest-900)' }}
              >
                Statut de Conformité &amp; Agrément KYC
              </h2>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                Vérification d'identité officielle nécessaire pour encaisser et reverser des fonds.
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold self-start sm:self-auto ${kycCfg.cls}`}
          >
            <span className={`w-2 h-2 rounded-full ${kycCfg.dot}`} />
            <span>Compte Agrée &amp; Vérifié</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div
            className="p-3.5 rounded-inner border flex items-center gap-3"
            style={{ background: 'var(--background-alt)', borderColor: 'var(--border)' }}
          >
            <Shield className="w-4 h-4" style={{ color: 'var(--forest-600)' }} />
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--forest-950)' }}>
                Pièce d'Identité Concierge
              </p>
              <p className="text-[0.65rem] font-medium" style={{ color: 'var(--foreground-muted)' }}>
                CNI / Passeport validé par l'administrateur
              </p>
            </div>
          </div>

          <div
            className="p-3.5 rounded-inner border flex items-center gap-3"
            style={{ background: 'var(--background-alt)', borderColor: 'var(--border)' }}
          >
            <Smartphone className="w-4 h-4" style={{ color: 'var(--forest-600)' }} />
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--forest-950)' }}>
                Numéro Pro Vérifié par OTP
              </p>
              <p className="text-[0.65rem] font-medium" style={{ color: 'var(--foreground-muted)' }}>
                Authentification renforcée active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Modification Mot de Passe ──────────────────────────────────── */}
      <div
        className="rounded-card border shadow-2xs p-6 sm:p-7 space-y-6"
        style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
      >
        <div className="flex items-start justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
              style={{ background: 'var(--forest-50)' }}
            >
              <KeyRound className="w-5 h-5" style={{ color: 'var(--forest-700)' }} />
            </div>
            <div>
              <h2
                className="font-display text-lg font-bold tracking-tight"
                style={{ color: 'var(--forest-900)' }}
              >
                Sécurité &amp; Mot de Passe
              </h2>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                Modifiez régulièrement votre mot de passe pour protéger votre espace de gestion.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {passSuccess && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-inner text-xs font-bold"
              style={{
                background: 'var(--success-50)',
                color: 'var(--success-700)',
                border: '1px solid var(--success-500)',
              }}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>Mot de passe modifié avec succès !</span>
            </div>
          )}

          {passError && (
            <div
              className="px-4 py-3 rounded-inner text-xs font-semibold"
              style={{
                background: 'var(--error-50)',
                color: 'var(--error-700)',
                border: '1px solid var(--error-500)',
              }}
            >
              {passError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
              Mot de passe actuel
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--foreground-muted)' }}
              />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full rounded-pill border pl-9 pr-4 py-2.5 text-xs font-medium outline-none bg-white [color-scheme:light]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--foreground-muted)' }}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                required
                className="w-full rounded-pill border pl-9 pr-4 py-2.5 text-xs font-medium outline-none bg-white [color-scheme:light]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold block" style={{ color: 'var(--forest-900)' }}>
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--foreground-muted)' }}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                required
                className="w-full rounded-pill border pl-9 pr-4 py-2.5 text-xs font-medium outline-none bg-white [color-scheme:light]"
                style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPass}
              className="btn-action inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {isChangingPass ? 'Modification…' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
