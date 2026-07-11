'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { BirthdatePicker } from '@/features/gate/components/BirthdatePicker';
import { cn } from '@/lib/utils/cn';

const schema = z.object({
  prenom: z.string().min(2, 'Minimum 2 caractères'),
  nom:    z.string().min(2, 'Minimum 2 caractères'),
  dateNaissance: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance requise')
    .refine((val) => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
      return age >= 18;
    }, 'Vous devez avoir au moins 18 ans'),
});

type FormData = z.infer<typeof schema>;

interface Props { onDone: () => void }

const inputCls = cn(
  'w-full rounded-xl border border-border px-4 py-3 text-sm text-neutral-900',
  'placeholder:text-neutral-300',
  'outline-none transition-all',
  'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
);

export function StepProfile({ onDone }: Props) {
  const { setGateStatus, setOnboardingDraft, needsOnboarding } = useRoleStore();
  const { refreshIfNeeded } = useNestToken();

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    if (needsOnboarding) {
      setOnboardingDraft({
        prenom: data.prenom,
        nom: data.nom,
        dateNaissance: data.dateNaissance,
      });
      setGateStatus({ profileCompleted: true, dateNaissance: data.dateNaissance });
      onDone();
      return;
    }

    const token = await refreshIfNeeded();
    await nestFetch(NEST_API.USERS.ME, {
      method: 'PATCH',
      token: token ?? undefined,
      body: JSON.stringify(data),
    });
    setGateStatus({ profileCompleted: true, dateNaissance: data.dateNaissance });
    onDone();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-600">Prénom</label>
          <input
            {...register('prenom')}
            placeholder="Mamadou"
            className={cn(inputCls, errors.prenom && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100')}
          />
          {errors.prenom && (
            <p className="text-[11px] font-medium text-rose-500">{errors.prenom.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-neutral-600">Nom</label>
          <input
            {...register('nom')}
            placeholder="Diallo"
            className={cn(inputCls, errors.nom && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100')}
          />
          {errors.nom && (
            <p className="text-[11px] font-medium text-rose-500">{errors.nom.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-neutral-600">Date de naissance</label>
        <Controller
          control={control}
          name="dateNaissance"
          render={({ field }) => (
            <BirthdatePicker
              value={field.value}
              onChange={field.onChange}
              error={!!errors.dateNaissance}
            />
          )}
        />
        {errors.dateNaissance && (
          <p className="text-[11px] font-medium text-rose-500">{errors.dateNaissance.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl py-3 transition-colors"
      >
        {isSubmitting ? 'Enregistrement…' : 'Continuer'}
      </button>
    </form>
  );
}
