'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2, Mail, Lock } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/schemas/auth.schema';
import { useAuth, mapSupabaseError } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/nestjs/api-client';

interface Props {
  next?: string;
}

export function LoginForm({ next }: Props) {
  const { loginEmail, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setError(null);
    try {
      await loginEmail(data, next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion');
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

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Connexion</h2>
        <p className="text-foreground-muted text-sm mt-1">Accédez à votre espace ImmoLoc</p>
      </div>

      {/* Tabs email / téléphone */}
      <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800/50 p-1 backdrop-blur-sm mt-2">
        {(['email', 'phone'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg pt-3 pb-2 text-sm font-semibold transition-all duration-300 ${
              activeTab === tab
                ? 'bg-black text-emerald-400 shadow-lg border border-white/10'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
            }`}
          >
            {tab === 'email' ? 'Email' : 'Téléphone'}
          </button>
        ))}
      </div>

      {activeTab === 'email' ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="vous@example.com"
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-neutral-700">Mot de passe</label>
              <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      ) : (
        <PhoneLoginSection next={next} />
      )}

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
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-border rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-all duration-200"
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
        Pas encore de compte ?{' '}
        <Link href={registerHref} className="text-emerald-600 font-medium hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}

// ── Section connexion par téléphone ─────────────────────────────────────────

function PhoneLoginSection({ next }: { next?: string }) {
  const { sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!phone.match(/^\+[1-9]\d{6,14}$/)) {
      setError('Format invalide. Exemple : +221771234567');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPhoneOtp(phone);
      setStep('otp');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erreur lors de l\'envoi');
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
      setError(e instanceof Error ? e.message : 'Code invalide');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'phone') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Numéro de téléphone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+221771234567"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Envoi...' : 'Recevoir un code SMS'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">Code envoyé au <strong>{phone}</strong></p>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Code OTP</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <button
        type="button"
        onClick={handleVerify}
        disabled={loading || otp.length < 6}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Vérification...' : 'Valider'}
      </button>
      <button type="button" onClick={() => setStep('phone')} className="w-full text-sm text-neutral-500 hover:text-neutral-700">
        ← Changer de numéro
      </button>
    </div>
  );
}
