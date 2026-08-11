'use client';

import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, MailCheck, Phone, User } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/schemas/auth.schema';
import { useAuth, mapSupabaseError } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/nestjs/api-client';
import {
  AuthDivider, ErrorBanner, Field, GoogleButton,
  PasswordStrength, SubmitButton, inputClass,
} from './auth-form-primitives';

import { ActivationVerificationModal } from './ActivationVerificationModal';

interface Props {
  next?: string;
  referralCode?: string;
}

const RESEND_DELAY = 60;

export function RegisterForm({ next, referralCode }: Props) {
  const { register: registerUser, loginWithGoogle, resendConfirmation } = useAuth();
  const router = useRouter();

  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);

  // Modal verification state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');

  const ids = {
    prenom: useId(), nom: useId(), tel: useId(), email: useId(), password: useId(),
  };

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<RegisterInput>({
      resolver: zodResolver(registerSchema),
      mode: 'onBlur',
      defaultValues: { codeParrain: referralCode || '' },
    });

  const password = watch('password') ?? '';

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function onSubmit(data: RegisterInput) {
    setError(null);
    try {
      await registerUser(data);
      setRegisteredEmail(data.email);
      setRegisteredPhone(data.telephone);
      setIsModalOpen(true);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else if (e instanceof Error) setError(mapSupabaseError(e.message));
      else setError('Erreur lors de la création du compte');
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle(next);
    } catch (e) {
      setError(e instanceof Error ? mapSupabaseError(e.message) : 'Erreur Google');
      setGoogleLoading(false);
    }
  }

  async function handleResend() {
    if (!sentTo || cooldown > 0) return;
    try {
      await resendConfirmation?.(sentTo);
      setResent(true);
      setCooldown(RESEND_DELAY);
    } catch {
      setError('Impossible de renvoyer l’email pour le moment.');
    }
  }

  // ── Écran de confirmation ───────────────────────────────────────────────
  if (sentTo) {
    return (
      <div className="space-y-6">
        {/* L'icône faisait 64 px en success-500 plein : le point le plus lourd
            d'un écran dont le vrai sujet est le message. Réduite et posée
            dans un squircle du système. */}
        <span className="grid h-12 w-12 place-items-center rounded-inner bg-success-50 text-success-600">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </span>

        <div>
          <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-forest-900">
            Vérifiez votre boîte mail
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
            Nous avons envoyé un lien de confirmation à{' '}
            <strong className="font-semibold text-foreground">{sentTo}</strong>.
            Ouvrez-le pour activer votre compte Klef.
          </p>
        </div>

        {resent && (
          <p role="status" className="rounded-field bg-success-50 px-3.5 py-2.5 text-sm text-success-700">
            Email renvoyé.
          </p>
        )}
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <SubmitButton
          loading={false}
          loadingLabel=""
          type="button"
          onClick={() => router.push(next ? `/login?next=${encodeURIComponent(next)}` : '/login')}
        >
          Aller à la connexion
        </SubmitButton>

        {/* L'écran d'origine était un cul-de-sac : si l'email n'arrivait pas,
            ou si l'adresse était mal saisie, il n'y avait aucune sortie. */}
        <div className="space-y-2.5 border-t border-border pt-5 text-center text-sm">
          <p className="text-foreground-muted">
            {cooldown > 0 ? (
              <>Vous pouvez renvoyer l’email dans <span className="tabular-nums">{cooldown}s</span></>
            ) : (
              <button type="button" onClick={handleResend} className="font-semibold text-forest-700 hover:underline">
                Renvoyer l’email de confirmation
              </button>
            )}
          </p>
          <p className="text-foreground-faint">
            Adresse incorrecte&nbsp;?{' '}
            <button
              type="button"
              onClick={() => { setSentTo(null); setResent(false); setError(null); }}
              className="font-medium text-forest-700 hover:underline"
            >
              Modifier
            </button>
          </p>
          <p className="text-xs text-foreground-faint">
            Pensez à regarder dans vos spams.
          </p>
        </div>
      </div>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <header>
        <Link href="/" className="mb-8 inline-flex items-baseline lg:hidden">
          <span className="font-display text-2xl font-semibold tracking-tight text-forest-800">klef</span>
          <span className="font-display text-2xl font-semibold text-lime-600" aria-hidden="true">.</span>
        </Link>
        <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.02em] text-forest-900">
          Créer un compte
        </h1>
      </header>

      {referralCode && (
        <div className="flex items-center gap-3 rounded-card border border-gold-200 bg-gold-50/60 p-3.5 text-xs text-gold-900 dark:border-gold-800/40 dark:bg-gold-950/20 dark:text-gold-200">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-gold-100 dark:bg-gold-900/60 text-base">
            🤝
          </span>
          <div>
            <p className="font-semibold text-gold-900 dark:text-gold-100">Invitation Klef Teranga Club</p>
            <p className="text-foreground-muted">
              Code parrain <strong className="font-mono text-foreground font-bold">{referralCode.toUpperCase()}</strong> détecté. Votre parrain recevra son bonus lors de votre 1er séjour !
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        {/* grid-cols-2 s'appliquait dès 320px : deux champs de 150 px côte à
            côte sur un téléphone. Ils s'empilent maintenant sous sm. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={ids.prenom} label="Prénom" icon={<User className="h-4 w-4" aria-hidden="true" />} error={errors.prenom?.message}>
            <input
              {...register('prenom')}
              id={ids.prenom}
              autoComplete="given-name"
              autoFocus
              placeholder="Amadou"
              aria-invalid={!!errors.prenom}
              aria-describedby={errors.prenom ? `${ids.prenom}-error` : undefined}
              className={inputClass(!!errors.prenom)}
            />
          </Field>

          {/* Le champ Nom n'avait pas d'icône alors que Prénom en avait, et
              son padding gauche différait. Alignés. */}
          <Field id={ids.nom} label="Nom" icon={<User className="h-4 w-4" aria-hidden="true" />} error={errors.nom?.message}>
            <input
              {...register('nom')}
              id={ids.nom}
              autoComplete="family-name"
              placeholder="Diallo"
              aria-invalid={!!errors.nom}
              aria-describedby={errors.nom ? `${ids.nom}-error` : undefined}
              className={inputClass(!!errors.nom)}
            />
          </Field>
        </div>

        <Field
          id={ids.tel}
          label="Téléphone"
          icon={<Phone className="h-4 w-4" aria-hidden="true" />}
          error={errors.telephone?.message}
          hint="Indicatif compris : +221 pour le Sénégal."
        >
          <input
            {...register('telephone')}
            id={ids.tel}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+221 77 123 45 67"
            aria-invalid={!!errors.telephone}
            aria-describedby={errors.telephone ? `${ids.tel}-error` : `${ids.tel}-hint`}
            className={inputClass(!!errors.telephone)}
          />
        </Field>

        <Field id={ids.email} label="Email" icon={<Mail className="h-4 w-4" aria-hidden="true" />} error={errors.email?.message}>
          <input
            {...register('email')}
            id={ids.email}
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? `${ids.email}-error` : undefined}
            className={inputClass(!!errors.email)}
          />
        </Field>

        <div>
          <Field id={ids.password} label="Mot de passe" icon={<Lock className="h-4 w-4" aria-hidden="true" />} error={errors.password?.message}>
            <input
              {...register('password')}
              id={ids.password}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? `${ids.password}-error` : undefined}
              className={`${inputClass(!!errors.password)} pr-11`}
            />
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
          <PasswordStrength value={password} />
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <SubmitButton loading={isSubmitting} loadingLabel="Création…">
          Créer mon compte
        </SubmitButton>

        <p className="text-center text-xs leading-relaxed text-foreground-faint">
          En créant un compte, vous acceptez les{' '}
          <Link href="/cgu" className="font-medium text-foreground-muted underline underline-offset-2 hover:text-forest-700">
            conditions d’utilisation
          </Link>{' '}
          et la{' '}
          <Link href="/confidentialite" className="font-medium text-foreground-muted underline underline-offset-2 hover:text-forest-700">
            politique de confidentialité
          </Link>.
        </p>
      </form>

      <AuthDivider />

      <GoogleButton loading={googleLoading} onClick={handleGoogle} label="S’inscrire avec Google" />

      <p className="text-center text-sm text-foreground-muted">
        Déjà un compte&nbsp;?{' '}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-semibold text-forest-700 hover:underline"
        >
          Se connecter
        </Link>
      </p>

      {/* Verification Modal post-registration */}
      <ActivationVerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        email={registeredEmail}
        phone={registeredPhone}
        next={next}
      />
    </div>
  );
}