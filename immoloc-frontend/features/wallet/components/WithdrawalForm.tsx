'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';
import type { MethodeRetrait } from '@/lib/nestjs';
import { useWithdrawal } from '../hooks/use-withdrawal';
import { formatFCFA } from '../lib/transaction-labels';

const METHODES: { value: MethodeRetrait; label: string }[] = [
  { value: 'WAVE', label: 'Wave' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
];

const schema = (soldeMax: number) =>
  z.object({
    montant: z
      .number({ invalid_type_error: 'Montant requis' })
      .min(20_000, 'Minimum 20 000 FCFA')
      .max(soldeMax, `Maximum ${formatFCFA(soldeMax)} (solde disponible)`),
    methode: z.enum(['WAVE', 'ORANGE_MONEY'] as const),
    destinataire: z.string().min(1, 'Numéro de téléphone requis'),
  });

type FormValues = z.infer<ReturnType<typeof schema>>;

interface Props {
  soldeDisponible: number;
}

export function WithdrawalForm({ soldeDisponible }: Props) {
  const { mutate, isPending } = useWithdrawal();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema(soldeDisponible)),
    defaultValues: { methode: 'WAVE' },
  });

  function onSubmit(values: FormValues) {
    mutate(values, { onSuccess: () => reset() });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Montant */}
      <div>
        <label className="text-[10px] font-black text-foreground-muted uppercase tracking-wider block mb-2">
          Montant (FCFA)
        </label>
        <input
          type="number"
          step="1000"
          min={10000}
          max={soldeDisponible}
          placeholder="50 000"
          {...register('montant', { valueAsNumber: true })}
          className="w-full px-4 py-3 rounded-xl bg-background-alt border border-border text-sm font-bold text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
        />
        {errors.montant && (
          <p className="text-xs font-medium text-error-500 mt-1.5">{errors.montant.message}</p>
        )}
        <p className="text-xs font-medium text-foreground-muted mt-1">
          Disponible : <span className="font-black text-foreground">{formatFCFA(soldeDisponible)}</span>
          {' · '}Minimum : <span className="font-black text-foreground">10 000 FCFA</span>
        </p>
      </div>

      {/* Méthode */}
      <div>
        <label className="text-[10px] font-black text-foreground-muted uppercase tracking-wider block mb-2">
          Méthode de retrait
        </label>
        <div className="flex gap-2">
          {METHODES.map((m) => (
            <label key={m.value} className="flex-1 cursor-pointer">
              <input type="radio" value={m.value} {...register('methode')} className="sr-only peer" />
              <span className="flex items-center justify-center px-3 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground-muted peer-checked:bg-primary-600 peer-checked:border-primary-600 peer-checked:text-background-card hover:bg-background-alt transition-all">
                {m.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Destinataire */}
      <div>
        <label className="text-[10px] font-black text-foreground-muted uppercase tracking-wider block mb-2">
          Numéro de téléphone
        </label>
        <input
          type="text"
          placeholder="77 123 45 67"
          {...register('destinataire')}
          className="w-full px-4 py-3 rounded-xl bg-background-alt border border-border text-sm font-medium text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
        />
        {errors.destinataire && (
          <p className="text-xs font-medium text-error-500 mt-1.5">{errors.destinataire.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || soldeDisponible < 10_000}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 bg-primary-600 text-background-card font-black rounded-2xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-primary-500/20"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours…</>
        ) : (
          <><Send className="w-4 h-4" /> Demander le retrait</>
        )}
      </button>
    </form>
  );
}
