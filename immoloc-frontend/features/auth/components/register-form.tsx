'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, User, Phone, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@/schemas/auth.schema';
import { useAuth, mapSupabaseError } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/nestjs/api-client';

interface Props {
  next?: string;
}

export function RegisterForm({ next }: Props) {
  const { register: registerUser, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setError(null);
    try {
      const result = await registerUser(data);
      setSuccess(`Un email de confirmation a été envoyé à ${result.email}. Vérifiez votre boîte mail.`);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(mapSupabaseError(e.message));
      } else {
        setError('Erreur lors de la création du compte');
      }
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur Google');
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-success-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Compte créé !</h2>
        <p className="text-foreground-muted text-sm">{success}</p>
        <button
          onClick={() => router.push(next ? `/login?next=${encodeURIComponent(next)}` : '/login')}
          className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]"
        >
          Aller à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Créer un compte</h2>
        <p className="text-foreground-muted text-sm mt-1">Rejoignez la communauté ImmoLoc</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Prénom + Nom */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Prénom</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                {...register('prenom')}
                placeholder="Amadou"
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {errors.prenom && <p className="text-error-500 text-xs mt-1">{errors.prenom.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nom</label>
            <input
              {...register('nom')}
              placeholder="Diallo"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.nom && <p className="text-error-500 text-xs mt-1">{errors.nom.message}</p>}
          </div>
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              {...register('telephone')}
              type="tel"
              placeholder="+221771234567"
              className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <p className="text-neutral-400 text-xs mt-1">Format international : +221 pour le Sénégal, +33 pour la France…</p>
          {errors.telephone && <p className="text-error-500 text-xs mt-1">{errors.telephone.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="vous@example.com"
              className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {errors.email && <p className="text-error-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {errors.password && <p className="text-error-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="bg-error-500/10 border border-error-500/20 rounded-lg px-3 py-2 text-error-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Création...' : 'Créer mon compte'}
        </button>

        <p className="text-xs text-neutral-400 text-center">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="/cgu" className="underline hover:text-neutral-600">conditions d&apos;utilisation</Link>
        </p>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-neutral-400">ou</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 border border-border rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-all duration-200"
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {googleLoading ? 'Redirection...' : 'Continuer avec Google'}
      </button>

      <p className="text-center text-sm text-foreground-muted">
        Déjà un compte ?{' '}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="text-emerald-600 font-medium hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
