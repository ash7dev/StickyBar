'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, User, Phone, Info } from 'lucide-react';
import { completeProfileSchema, type CompleteProfileInput } from '@/schemas/auth.schema';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ApiError } from '@/lib/nestjs/api-client';

interface CompleteProfileFormProps {
  accessToken: string;
  userEmail?: string;
  next?: string;
}

export function CompleteProfileForm({ accessToken, userEmail, next }: CompleteProfileFormProps) {
  const { completeGoogleProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
  });

  async function onSubmit(data: CompleteProfileInput) {
    setError(null);
    try {
      await completeGoogleProfile(data, accessToken, next);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Erreur lors de la complétion du profil');
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Compléter votre profil</h2>
        {userEmail && (
          <p className="text-foreground-muted text-sm mt-1">Compte Google : <span className="font-medium">{userEmail}</span></p>
        )}
      </div>

      {/* Info téléphone important */}
      <div className="flex gap-3 bg-warning-500/10 border border-warning-500/20 rounded-lg p-3">
        <Info className="h-4 w-4 text-warning-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-warning-700">
          Votre numéro est indispensable pour recevoir les notifications de réservation et les alertes importantes.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Prénom</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                {...register('prenom')}
                placeholder="Amadou"
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {errors.prenom && <p className="text-error-500 text-xs mt-1">{errors.prenom.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nom</label>
            <input
              {...register('nom')}
              placeholder="Diallo"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.nom && <p className="text-error-500 text-xs mt-1">{errors.nom.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              {...register('telephone')}
              type="tel"
              placeholder="+221771234567"
              className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <p className="text-neutral-400 text-xs mt-1">Format international : +221 Sénégal, +33 France…</p>
          {errors.telephone && <p className="text-error-500 text-xs mt-1">{errors.telephone.message}</p>}
        </div>

        {error && (
          <div className="bg-error-500/10 border border-error-500/20 rounded-lg px-3 py-2 text-error-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-500 text-white rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98]"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Enregistrement...' : 'Terminer l\'inscription'}
        </button>
      </form>

      {/* Option passer — sans numéro, actions critiques bloquées */}
      {!skipped && (
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="w-full text-sm text-neutral-400 hover:text-neutral-600"
        >
          Passer pour l&apos;instant
        </button>
      )}

      {skipped && (
        <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-3 text-sm text-warning-700">
          Sans téléphone, vous ne pourrez pas effectuer de réservation ni recevoir les notifications. Vous pourrez compléter votre profil dans les paramètres.
        </div>
      )}
    </div>
  );
}
