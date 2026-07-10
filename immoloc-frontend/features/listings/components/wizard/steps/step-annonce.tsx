'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Pen, CircleDollarSign, Moon, Minus, Plus, FileText, Tag,
} from 'lucide-react';
import { stepAnnonceSchema, type StepAnnonceInput } from '@/schemas/listing.schema';
import { useListingFormStore } from '@/stores/listing-form.store';
import { cn } from '@/lib/utils/cn';

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

/* ── SectionCard ──────────────────────────────────────────────────────────── */

function SectionCard({
  icon: Icon, title, description,
  accent = 'bg-primary-500', headerBg = 'bg-primary-50',
  iconBg = 'bg-primary-100', iconColor = 'text-primary-600',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  accent?: string;
  headerBg?: string;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className={cn('h-[3px] w-full rounded-t-2xl', accent)} />
      <div className={cn('flex items-center gap-3.5 px-5 py-4 border-b border-neutral-100', headerBg)}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <p className="font-bold text-neutral-900 text-[15px] tracking-tight">{title}</p>
          {description && <p className="text-[12px] text-neutral-400 mt-0.5 font-medium">{description}</p>}
        </div>
      </div>
      <div className="px-5 py-5 space-y-5">{children}</div>
    </div>
  );
}

const INPUT_CLS = 'w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all';
const INPUT_ERR = 'w-full px-4 py-3 rounded-xl border border-red-300 bg-white text-neutral-900 placeholder:text-neutral-400 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/15 transition-all';

/* ── Main Component ───────────────────────────────────────────────────────── */

export function StepAnnonce({ onNext, submitRef }: Props) {
  const { annonce, setAnnonce } = useListingFormStore();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<StepAnnonceInput>({
    resolver: zodResolver(stepAnnonceSchema),
    defaultValues: {
      titre:         annonce.titre ?? '',
      description:   annonce.description ?? '',
      prixBase:      annonce.prixBase || undefined,
      nuitesMinimum: annonce.nuitesMinimum ?? 1,
    },
  });

  const descLength = watch('description')?.length ?? 0;
  const prixBase   = watch('prixBase') ?? 0;

  function onSubmit(data: StepAnnonceInput) {
    setAnnonce(data);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── Présentation ── */}
      <SectionCard
        icon={Pen}
        title="Présentation"
        description="Un titre accrocheur et une description détaillée"
      >
        {/* Titre */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
              <Pen className="w-3.5 h-3.5 text-accent-600" />
            </div>
            <span className="text-sm font-black text-neutral-800">Titre de l&apos;annonce</span>
            <span className="text-[10px] font-bold text-rose-400 ml-0.5">*</span>
          </div>
          <input
            {...register('titre')}
            placeholder="Ex : Villa avec piscine à Saly, vue mer"
            className={cn(errors.titre ? INPUT_ERR : INPUT_CLS, 'font-semibold')}
          />
          {errors.titre && <p className="text-xs text-red-500">{errors.titre.message}</p>}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
            </div>
            <span className="text-sm font-black text-neutral-800">Description</span>
            <span className="text-[10px] font-bold text-rose-400 ml-0.5">*</span>
          </div>
          <textarea
            {...register('description')}
            rows={6}
            placeholder="Décrivez votre logement en détail : ambiance, points forts, accès…"
            className={cn(errors.description ? INPUT_ERR : INPUT_CLS, 'resize-none leading-relaxed')}
          />
          <div className="space-y-1.5">
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            <div className="flex items-center gap-2.5">
              <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-300',
                    descLength === 0 ? 'w-0'
                    : descLength > 1800 ? 'bg-amber-400'
                    : descLength > 800  ? 'bg-emerald-400'
                    : 'bg-primary-400'
                  )}
                  style={{ width: `${Math.min(100, (descLength / 2000) * 100)}%` }}
                />
              </div>
              <span className={cn('text-[11px] tabular-nums font-bold shrink-0',
                descLength > 1800 ? 'text-amber-600' : descLength > 800 ? 'text-emerald-600' : 'text-neutral-400'
              )}>
                {descLength} / 2000
              </span>
            </div>
            {descLength > 0 && descLength < 100 && (
              <p className="text-[11px] text-neutral-400">💡 Minimum 100 caractères recommandés</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Prix par nuit ── */}
      <SectionCard
        icon={CircleDollarSign}
        title="Votre tarif"
        description="Fixez votre prix de base par nuitée"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-sm font-black text-neutral-800">Prix par nuit</span>
            <span className="text-[10px] font-bold text-rose-400 ml-0.5">*</span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/[0.07] p-4">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Prix de base / nuit</p>
            <div className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-white/[0.06] transition-all',
              errors.prixBase ? 'border-rose-500/50' : 'border-white/10 focus-within:border-emerald-400/60',
            )}>
              <input
                {...register('prixBase')}
                type="number"
                placeholder="25 000"
                className="flex-1 min-w-0 text-2xl font-black text-white tracking-tight outline-none bg-transparent placeholder:text-white/20"
              />
              <span className="text-xs font-bold text-white/40 bg-white/[0.06] border border-white/10 px-2.5 py-1.5 rounded-lg shrink-0">FCFA</span>
            </div>
            {errors.prixBase && <p className="text-xs text-rose-400 mt-2">{errors.prixBase.message}</p>}
            {prixBase > 0 && !errors.prixBase && (
              <p className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                ≈ {(prixBase / 655).toFixed(0)} € / nuit
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Nuits minimum ── */}
      <SectionCard
        icon={Moon}
        title="Durée de séjour"
        description="Nombre de nuits minimum pour une réservation"
        accent="bg-primary-500"
        headerBg="bg-primary-50"
        iconBg="bg-primary-100"
        iconColor="text-primary-600"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
              <Moon className="w-3.5 h-3.5 text-primary-600" />
            </div>
            <span className="text-sm font-black text-neutral-800">Durée minimum de séjour</span>
          </div>

          <Controller name="nuitesMinimum" control={control} render={({ field }) => (<>
            <div className="flex items-center gap-4 px-5 py-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <button type="button" onClick={() => field.onChange(Math.max(1, (field.value ?? 1) - 1))} disabled={(field.value ?? 1) <= 1}
                className="w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all disabled:opacity-30 shrink-0 active:scale-90">
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-black text-neutral-900 tabular-nums">{field.value ?? 1}</span>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">
                  Nuit{(field.value ?? 1) > 1 ? 's' : ''} minimum
                </p>
              </div>
              <button type="button" onClick={() => field.onChange(Math.min(365, (field.value ?? 1) + 1))} disabled={(field.value ?? 1) >= 365}
                className="w-12 h-12 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-neutral-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all disabled:opacity-30 shrink-0 active:scale-90">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {([1, 2, 3, 7, 14, 30] as const).map((n) => (
                <button key={n} type="button" onClick={() => field.onChange(n)}
                  className={cn('py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95',
                    field.value === n
                      ? 'border-primary-400 bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-white hover:border-neutral-300')}>
                  {n === 1 ? '1 nuit' : n === 7 ? '1 sem.' : n === 14 ? '2 sem.' : n === 30 ? '1 mois' : `${n} nuits`}
                </button>
              ))}
            </div>
          </>)} />
        </div>
      </SectionCard>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}
