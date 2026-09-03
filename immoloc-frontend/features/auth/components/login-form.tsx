'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import {
  ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail,
  Phone, ShieldCheck, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '@/schemas/auth.schema';
import { useAuth, mapSupabaseError } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/nestjs/api-client';
import { PhoneInputWithCountry } from '@/components/ui/PhoneInputWithCountry';

// ─────────────────────────────────────────────────────────────────────────────
// AuthShell — mise en page desktop
//
// Le composant d'origine n'était qu'un <div space-y-6> sans contrainte de
// largeur : sur un écran 1440px, le formulaire s'étirait sur toute la page.
//
// Split à partir de lg : formulaire à gauche sur le canvas, panneau de marque
// à droite en forest. Le panneau n'est pas décoratif — il porte l'argument
// séquestre au moment exact où l'utilisateur hésite à créer un compte.
// ─────────────────────────────────────────────────────────────────────────────

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,32rem)]">
      <div className="bg-canvas flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-center bg-[radial-gradient(72%_58%_at_50%_0%,var(--forest-700)_0%,rgba(15,80,61,0)_68%),linear-gradient(180deg,var(--forest-900)_0%,var(--forest-950)_100%)] px-12 py-16">
        <span className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-inner border border-action-edge bg-action/[0.13]">
          <ShieldCheck className="h-5 w-5 text-on-inverse-marker" aria-hidden="true" />
        </span>

        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-forest-200">
          Séquestre Klef
        </p>

        <h2 className="mt-3 font-display text-[1.875rem] font-semibold leading-[1.1] tracking-[-0.02em] text-neutral-50">
          Votre argent ne bouge pas avant les clés.
        </h2>

        <p className="mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-forest-200">
          Le loyer est bloqué à la réservation et versé au propriétaire seulement
          quand vous confirmez être entré dans le logement.
        </p>

        <ul className="mt-10 space-y-3.5 border-t border-white/10 pt-8">
          {[
            'Chaque bien visité par un agent',
            'Remboursement si le logement ne correspond pas',
            'Paiement par Wave et Orange Money',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-forest-200">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-on-inverse-marker" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  next?: string;
}

export function LoginForm({ next }: Props) {
  const { loginEmail, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);

  const emailId = useId();
  const passwordId = useId();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setError(null);
    try {
      await loginEmail(data, next);
    } catch (e) {
      console.error('[LoginForm] Connection error:', e);
      const msg = mapSupabaseError(e instanceof Error ? e.message : String(e)) ?? (e instanceof Error ? e.message : 'Erreur de connexion');
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle(next);
    } catch (e) {
      setError(mapSupabaseError(e instanceof Error ? e.message : String(e)) ?? (e instanceof Error ? e.message : 'Erreur Google'));
      setGoogleLoading(false);
    }
  }

  // Changer d'onglet laissait l'erreur de l'onglet précédent affichée.
  function switchTab(next: 'email' | 'phone') {
    setError(null);
    setTab(next);
  }

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';

  return (
    <div className="space-y-7">

      <header>
        <Link href="/" className="mb-8 inline-flex items-baseline lg:hidden">
          <span className="font-display text-2xl font-semibold tracking-tight text-forest-800">klef</span>
          <span className="font-display text-2xl font-semibold text-lime-600" aria-hidden="true">.</span>
        </Link>
        <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-forest-900">
          Connexion
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Accédez à votre espace Klef.
        </p>
      </header>

      {/* ── Onglets ──────────────────────────────────────────────────────── */}
      {/* Étaient des <button> nus : ni role, ni aria-selected, ni navigation
          aux flèches. L'onglet actif était en bg-black text-emerald-400. */}
      <div role="tablist" aria-label="Méthode de connexion" className="flex rounded-pill bg-neutral-100 p-1">
        {(['email', 'phone'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => switchTab(t)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                switchTab(tab === 'email' ? 'phone' : 'email');
              }
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-pill py-2.5 text-sm font-semibold transition-colors duration-150 ${tab === t
                ? 'bg-background-card text-forest-800 shadow-xs'
                : 'text-foreground-muted hover:text-forest-700'
              }`}
          >
            {t === 'email'
              ? <><Mail className="h-4 w-4" aria-hidden="true" />Email</>
              : <><Phone className="h-4 w-4" aria-hidden="true" />Téléphone</>}
          </button>
        ))}
      </div>

      {tab === 'email' ? (
        <form
          id="panel-email"
          role="tabpanel"
          aria-labelledby="tab-email"
          onSubmit={handleSubmit(onSubmit, (valErrors) => {
            console.warn('[LoginForm] Validation issue:', valErrors);
          })}
          className="space-y-4"
          noValidate
        >
          <Field
            id={emailId}
            label="Email"
            icon={<Mail className="h-4 w-4" aria-hidden="true" />}
            error={errors.email?.message}
          >
            <input
              {...register('email')}
              id={emailId}
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="vous@exemple.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? `${emailId}-error` : undefined}
              className={inputClass(!!errors.email)}
            />
          </Field>

          <Field
            id={passwordId}
            label="Mot de passe"
            icon={<Lock className="h-4 w-4" aria-hidden="true" />}
            error={errors.password?.message}
            action={
              <Link href="/forgot-password" className="text-xs font-medium text-forest-700 hover:underline">
                Mot de passe oublié&nbsp;?
              </Link>
            }
          >
            <input
              {...register('password')}
              id={passwordId}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? `${passwordId}-error` : undefined}
              className={`${inputClass(!!errors.password)} pr-11`}
            />
            {/* Saisir un mot de passe à l'aveugle sur un clavier mobile est
                l'une des premières causes d'échec de connexion. */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-pill text-foreground-faint transition-colors hover:bg-neutral-100 hover:text-forest-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <SubmitButton loading={isSubmitting} loadingLabel="Connexion…">
            Se connecter
          </SubmitButton>
        </form>
      ) : (
        <div id="panel-phone" role="tabpanel" aria-labelledby="tab-phone">
          <PhoneLoginSection next={next} />
        </div>
      )}

      <div className="relative">
        <span className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </span>
        <span className="relative flex justify-center">
          <span className="bg-background px-3 text-xs uppercase tracking-wider text-foreground-faint">ou</span>
        </span>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-pill border border-border bg-background-card px-4 py-3 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100 disabled:opacity-50"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        {googleLoading ? 'Redirection…' : 'Continuer avec Google'}
      </button>

      <p className="text-center text-sm text-foreground-muted">
        Pas encore de compte&nbsp;?{' '}
        <Link href={registerHref} className="font-semibold text-forest-700 hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Connexion par téléphone
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_DELAY = 45;

function PhoneLoginSection({ next }: { next?: string }) {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const phoneId = useId();
  const otpId = useId();
  const otpRef = useRef<HTMLInputElement>(null);

  // Sans compte à rebours, l'utilisateur dont le SMS tarde reste bloqué sans
  // savoir s'il peut redemander un code.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
  }, [step]);

  async function handleSend() {
    if (!phone || phone.replace(/\D/g, '').length < 8) {
      setError('Veuillez saisir votre numéro de téléphone.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPhoneOtp(phone);
      setStep('otp');
      setCooldown(RESEND_DELAY);
    } catch (e) {
      // e instanceof ApiError ignorait les Error simples et affichait un
      // message générique là où le vrai message existait.
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'Échec de l’envoi du code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      await verifyPhoneOtp(phone, otp, next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'phone') {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor={phoneId} className="block text-xs font-semibold text-foreground">
            Numéro de téléphone
          </label>
          <PhoneInputWithCountry
            id={phoneId}
            value={phone}
            onChange={(val) => {
              setPhone(val);
              if (error) setError(null);
            }}
            error={error ?? undefined}
          />
          {error && <p id={`${phoneId}-error`} className="text-xs text-error-600 font-medium pt-1">{error}</p>}
        </div>

        <SubmitButton loading={loading} loadingLabel="Envoi…" onClick={handleSend} type="button">
          Recevoir un code SMS
        </SubmitButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-forest-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Changer de numéro
      </button>

      <p className="text-sm text-foreground-muted">
        Code envoyé au <strong className="font-semibold text-foreground">{phone}</strong>
      </p>

      <Field
        id={otpId}
        label="Code de vérification"
        icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}
        error={error ?? undefined}
      >
        <input
          ref={otpRef}
          id={otpId}
          type="text"
          inputMode="numeric"
          // Sans one-time-code, ni iOS ni Android ne proposent le remplissage
          // automatique du SMS. C'est l'attribut le plus rentable du formulaire.
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && handleVerify()}
          placeholder="000000"
          aria-invalid={!!error}
          aria-describedby={error ? `${otpId}-error` : undefined}
          className={`${inputClass(!!error)} !pl-4 text-center font-mono text-lg tracking-[0.4em]`}
        />
      </Field>

      <SubmitButton
        loading={loading}
        loadingLabel="Vérification…"
        onClick={handleVerify}
        type="button"
        disabled={otp.length < 6}
      >
        Valider
      </SubmitButton>

      <p className="text-center text-sm text-foreground-muted">
        {cooldown > 0 ? (
          <>Renvoyer un code dans <span className="tabular-nums">{cooldown}s</span></>
        ) : (
          <button type="button" onClick={handleSend} className="font-semibold text-forest-700 hover:underline">
            Renvoyer le code
          </button>
        )}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-field border bg-background-card py-3 pl-10 pr-3 text-[0.9375rem] text-foreground',
    'placeholder:text-foreground-faint',
    'transition-[border-color,box-shadow] duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    hasError
      ? 'border-error-500 focus:border-error-500 focus:ring-error-500/25'
      : 'border-border focus:border-forest-500 focus:ring-forest-500/25',
  ].join(' ');
}

function Field({
  id, label, icon, error, hint, action, children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        {/* Les labels n'avaient pas de htmlFor et les inputs pas d'id :
            cliquer sur le label ne faisait rien et les lecteurs d'écran
            n'associaient pas les deux. */}
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {action}
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint">
          {icon}
        </span>
        {children}
      </div>

      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-foreground-faint">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-error-600">
          {error}
        </p>
      )}
    </div>
  );
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-field border border-error-500/25 bg-error-50 px-3.5 py-2.5 text-sm text-error-700"
    >
      {children}
    </div>
  );
}

function SubmitButton({
  loading, loadingLabel, children, disabled, type = 'submit', onClick,
}: {
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
}) {
  return (
    /*
      Le bouton est en forest, pas en lime.
      Le lime est réservé à l'action de conversion ; se connecter est une
      action structurante, et les tokens du système la placent sur
      `buttonPrimary` = forest-600. Blanc sur forest-600 : 7:1.

      `disabled:bg-emerald-500` rendait le bouton PLUS clair et plus saturé
      quand il était inactif — l'inverse du signal attendu.
    */
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest-600 px-4 py-3 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-forest-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-forest-600/40 motion-reduce:active:scale-100"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {loading ? loadingLabel : children}
    </button>
  );
}