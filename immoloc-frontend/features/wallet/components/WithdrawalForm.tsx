'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Smartphone } from 'lucide-react';
import type { MethodeRetrait } from '@/lib/nestjs';
import { useWithdrawal } from '../hooks/use-withdrawal';
import { formatFCFA } from '../lib/transaction-labels';

const METHODES: { value: MethodeRetrait; label: string; badgeColor: string }[] = [
  { value: 'WAVE', label: 'Wave', badgeColor: 'bg-[#00C2FF]/10 text-[#0088B8] border-[#00C2FF]/30 dark:text-[#00C2FF]' },
  { value: 'ORANGE_MONEY', label: 'Orange Money', badgeColor: 'bg-[#FF6600]/10 text-[#D44400] border-[#FF6600]/30 dark:text-[#FF7900]' },
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
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema(soldeDisponible)),
    defaultValues: { methode: 'WAVE' },
  });

  function onSubmit(values: FormValues) {
    mutate(values, { onSuccess: () => reset() });
  }

  const presets = [
    { label: '20 000 F', val: 20000 },
    { label: '50 000 F', val: 50000 },
    { label: '100 000 F', val: 100000 },
    { label: 'Tout le solde', val: soldeDisponible },
  ].filter(p => p.val <= soldeDisponible);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Montant */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="eyebrow block">
            Montant (FCFA)
          </label>
          <span className="text-xs text-foreground-muted">
            Solde : <strong className="tabular-nums text-foreground">{formatFCFA(soldeDisponible)}</strong>
          </span>
        </div>

        <input
          type="number"
          step="1000"
          min={20000}
          max={soldeDisponible}
          placeholder="ex: 50 000"
          {...register('montant', { valueAsNumber: true })}
          className="w-full px-4 py-3 rounded-field bg-background-alt border border-border text-sm font-semibold text-foreground placeholder:text-foreground-faint focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20 transition-all tabular-nums"
        />

        {/* Raccourcis de montants */}
        {soldeDisponible >= 20000 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setValue('montant', p.val, { shouldValidate: true })}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-pill bg-background-alt hover:bg-forest-50 dark:hover:bg-forest-900/40 border border-border hover:border-forest-300 text-foreground-muted hover:text-foreground transition-all tabular-nums"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {errors.montant && (
          <p className="text-xs font-medium text-error-500 mt-1.5">{errors.montant.message}</p>
        )}
      </div>

      {/* Méthode */}
      <div>
        <label className="eyebrow block mb-2">
          Méthode de réception
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {METHODES.map((m) => (
            <label key={m.value} className="cursor-pointer">
              <input type="radio" value={m.value} {...register('methode')} className="sr-only peer" />
              <span className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-pill border border-border text-xs font-semibold text-foreground-muted peer-checked:bg-forest-950 peer-checked:border-forest-900 peer-checked:text-on-inverse-marker dark:peer-checked:bg-action dark:peer-checked:text-on-action hover:bg-background-alt transition-all">
                <Smartphone className="w-3.5 h-3.5 opacity-70" />
                {m.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Destinataire */}
      <div>
        <label className="eyebrow block mb-2">
          Numéro Mobile Money (Sénégal)
        </label>
        <input
          type="text"
          placeholder="77 123 45 67"
          {...register('destinataire')}
          className="w-full px-4 py-3 rounded-field bg-background-alt border border-border text-sm font-medium text-foreground placeholder:text-foreground-faint focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20 transition-all"
        />
        {errors.destinataire && (
          <p className="text-xs font-medium text-error-500 mt-1.5">{errors.destinataire.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || soldeDisponible < 20_000}
        className="btn-action w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Envoi du retrait…</>
        ) : (
          <><Send className="w-4 h-4" /> Demander le retrait</>
        )}
      </button>
    </form>
  );
}
