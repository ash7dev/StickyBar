'use client';

import { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onUpdated?: () => void;
}

export function ProfileSecurityCard({ user, onUpdated }: Props) {
  const [email, setEmail] = useState(user.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExistingEmail = !!user.email && user.email.includes('@');

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasNumber && passwordsMatch;

  const canSubmit =
    !loading &&
    ((email.trim().length > 0 && email.trim() !== user.email) || isPasswordValid);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailToSubmit = email.trim() !== user.email ? email.trim() : undefined;
    const passwordToSubmit = password.length > 0 ? password : undefined;

    if (!emailToSubmit && !passwordToSubmit) {
      toast.info('Aucun changement détecté.');
      return;
    }

    if (passwordToSubmit && !isPasswordValid) {
      if (!passwordsMatch) {
        setError('Les mots de passe ne correspondent pas.');
      } else {
        setError('Le mot de passe ne respecte pas les critères de sécurité.');
      }
      return;
    }

    setLoading(true);

    try {
      const res = await nestFetch<{
        success: boolean;
        message: string;
        emailUpdated: boolean;
        passwordUpdated: boolean;
      }>(NEST_API.USERS.ME_SECURITY, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(emailToSubmit && { email: emailToSubmit }),
          ...(passwordToSubmit && { password: passwordToSubmit }),
        }),
      });

      toast.success(res.message || 'Vos identifiants ont été mis à jour avec succès.');
      setPassword('');
      setConfirmPassword('');
      if (onUpdated) onUpdated();
    } catch (err: any) {
      const msg = err?.message || 'Impossible de mettre à jour vos identifiants de sécurité.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card p-6 space-y-6 overflow-visible border border-border bg-background-card rounded-2xl shadow-2xs">
      {/* Header avec icône et badge */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700 dark:border-forest-800 dark:bg-forest-950 dark:text-lime-300">
            <ShieldCheck className="h-5.5 w-5.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Sécurité & Identifiants de Connexion
            </h2>
            <p className="text-xs text-foreground-muted">
              {hasExistingEmail
                ? 'Gérez votre adresse email et votre mot de passe de connexion.'
                : 'Définissez un email et un mot de passe pour vous connecter par identifiants.'}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-semibold border ${
            hasExistingEmail
              ? 'border-success-500/30 bg-success-50 text-success-700 dark:bg-success-950/40 dark:text-success-300'
              : 'border-warning-500/30 bg-warning-50 text-warning-800 dark:bg-warning-950/40 dark:text-warning-300'
          }`}
        >
          {hasExistingEmail ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Email configuré</span>
            </>
          ) : (
            <>
              <KeyRound className="w-3.5 h-3.5 text-warning-600" />
              <span>Connexion SMS uniquement</span>
            </>
          )}
        </span>
      </header>

      {/* Formulaire de sécurité */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner d'information si pas d'email */}
        {!hasExistingEmail && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-gold-200 bg-gold-50/50 text-xs text-gold-900 dark:border-gold-900/40 dark:bg-gold-950/30 dark:text-gold-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-gold-600 dark:text-gold-400 mt-0.5" />
            <p className="leading-relaxed">
              Votre compte a été initialisé via votre numéro de téléphone. En ajoutant une adresse email et un mot de passe, vous pourrez vous connecter aussi bien par SMS que par email.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-error-200 bg-error-50 text-xs text-error-700 dark:border-error-900/40 dark:bg-error-950/30 dark:text-error-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Champ Adresse Email */}
        <div className="space-y-1.5">
          <label htmlFor="security-email" className="block text-xs font-semibold text-foreground">
            Adresse Email de connexion
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-faint" />
            <input
              id="security-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              className="w-full rounded-xl border border-border bg-background-card py-2.5 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
          </div>
        </div>

        {/* Champ Nouveau Mot de passe */}
        <div className="space-y-1.5">
          <label htmlFor="security-password" className="block text-xs font-semibold text-foreground">
            {hasExistingEmail ? 'Nouveau mot de passe' : 'Définir un mot de passe'}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-faint" />
            <input
              id="security-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-border bg-background-card py-2.5 pl-10 pr-10 text-xs font-medium text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-faint hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Pastilles de force du mot de passe */}
          {password.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill font-medium border ${
                hasMinLength ? 'border-success-500/30 bg-success-50 text-success-700' : 'border-neutral-200 bg-neutral-100 text-neutral-500'
              }`}>
                {hasMinLength ? <CheckCircle2 className="w-3 h-3 text-success-600" /> : '•'} 8+ caractères
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill font-medium border ${
                hasUpper ? 'border-success-500/30 bg-success-50 text-success-700' : 'border-neutral-200 bg-neutral-100 text-neutral-500'
              }`}>
                {hasUpper ? <CheckCircle2 className="w-3 h-3 text-success-600" /> : '•'} 1 Majuscule
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill font-medium border ${
                hasNumber ? 'border-success-500/30 bg-success-50 text-success-700' : 'border-neutral-200 bg-neutral-100 text-neutral-500'
              }`}>
                {hasNumber ? <CheckCircle2 className="w-3 h-3 text-success-600" /> : '•'} 1 Chiffre
              </span>
            </div>
          )}
        </div>

        {/* Confirmation du mot de passe */}
        {password.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="security-confirm-password" className="block text-xs font-semibold text-foreground">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-faint" />
              <input
                id="security-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full rounded-xl border bg-background-card py-2.5 pl-10 pr-10 text-xs font-medium text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 ${
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
                    : 'border-border focus:border-forest-500 focus:ring-forest-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-faint hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[11px] text-error-600">Les mots de passe ne correspondent pas.</p>
            )}
          </div>
        )}

        {/* Bouton de validation */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-pill bg-forest-900 hover:bg-forest-950 text-white px-6 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-lime-300" />
                <span>Enregistrement…</span>
              </>
            ) : (
              <span>Mettre à jour ma sécurité</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
