'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2, TreePine, BedDouble, Home,
  MapPin, Users, ChevronDown, Minus, Plus, Bath,
  DoorOpen, BedSingle, Check, ChevronRight,
} from 'lucide-react';
import {
  stepBienSchema, type StepBienInput, type TypeLogement,
  TYPE_LOGEMENT, SOUS_TYPES_PAR_CATEGORIE,
  ZONES_SENEGAL, type ZoneSenegal, getZoneFromVille,
} from '@/schemas/listing.schema';
import { useListingFormStore } from '@/stores/listing-form.store';
import { cn } from '@/lib/utils/cn';

/* ── Type meta ────────────────────────────────────────────────────────────── */

const TYPE_META: Record<TypeLogement, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconCls: string;
}> = {
  APPARTEMENT: { label: 'Appartement', Icon: Building2, iconCls: 'text-sky-500' },
  VILLA:       { label: 'Villa',       Icon: TreePine,  iconCls: 'text-emerald-500' },
  CHAMBRE:     { label: 'Chambre',     Icon: BedDouble, iconCls: 'text-amber-500' },
  AUTRES:      { label: 'Autres',      Icon: Home,      iconCls: 'text-violet-500' },
};

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

/* ── SectionCard ──────────────────────────────────────────────────────────── */

function SectionCard({
  icon: Icon, title, description,
  accent = 'bg-emerald-500', headerBg = 'bg-emerald-50',
  iconBg = 'bg-emerald-100', iconColor = 'text-emerald-600',
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

/* ── Counter ──────────────────────────────────────────────────────────────── */

function Counter({ value, onChange, min = 0, max = 30 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-emerald-400 hover:text-emerald-500 disabled:opacity-20 transition-all active:scale-90">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center font-black text-neutral-900 text-[15px] tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-emerald-400 hover:text-emerald-500 disabled:opacity-20 transition-all active:scale-90">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ── CounterRow ───────────────────────────────────────────────────────────── */

function CounterRow({ icon: Icon, label, value, onChange, min, max }: {
  icon: React.ComponentType<{ className?: string }>; label: string;
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-white transition-colors">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-neutral-400" />
        <span className="text-sm text-neutral-700 font-semibold">{label}</span>
      </div>
      <Counter value={value} onChange={onChange} min={min} max={max} />
    </div>
  );
}

/* ── CustomDropdown ───────────────────────────────────────────────────────── */

function CustomDropdown({
  options, value, onChange, placeholder, error, zIndex = 200, placement = 'bottom',
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  zIndex?: number;
  placement?: 'top' | 'bottom';
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border bg-white text-sm transition-all duration-150',
          open ? 'border-emerald-400 ring-2 ring-emerald-400/15'
               : error ? 'border-red-300' : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm',
          value ? 'text-neutral-900 font-semibold' : 'text-neutral-400 font-normal',
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 text-neutral-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <div
        style={{ zIndex }}
        className={cn(
          'absolute left-0 right-0 bg-white rounded-2xl border border-neutral-100/80',
          'shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden transition-all duration-200',
          placement === 'top' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top',
          open ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none',
        )}
      >
        <div className="max-h-56 overflow-y-auto overscroll-contain divide-y divide-neutral-50">
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors duration-100',
                  selected ? 'bg-emerald-500 text-white' : 'text-neutral-700 hover:bg-neutral-50',
                )}>
                <span className={cn('font-medium', selected && 'font-semibold')}>{opt}</span>
                {selected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export function StepBien({ onNext, submitRef }: Props) {
  const { bien, setBien } = useListingFormStore();

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<StepBienInput>({
    resolver: zodResolver(stepBienSchema),
    defaultValues: {
      type:             bien.type,
      sousType:         bien.sousType ?? '',
      nombreChambres:   bien.nombreChambres ?? 1,
      nombreSallesBain: bien.nombreSallesBain ?? 1,
      nombrePieces:     bien.nombrePieces ?? 1,
      capaciteMax:      bien.capaciteMax ?? 1,
      ville:            bien.ville ?? '',
      adresse:          bien.adresse ?? '',
    },
  });

  const watchedType = watch('type') as TypeLogement | undefined;
  const sousTypes = watchedType ? (SOUS_TYPES_PAR_CATEGORIE[watchedType] as readonly string[]) : [];

  const [selectedZone, setSelectedZone] = useState<ZoneSenegal | ''>(() => getZoneFromVille(bien.ville ?? '') ?? '');
  const destinationsInZone = selectedZone ? (ZONES_SENEGAL[selectedZone] as readonly string[]) : [];

  function onSubmit(data: StepBienInput) {
    setBien(data);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* ── Type de logement ── */}
      <SectionCard
        icon={Building2}
        title="Type de logement"
        description="Quelle catégorie décrit le mieux votre bien ?"
        accent="bg-emerald-500"
        headerBg="bg-emerald-50"
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
      >
        {/* Chips type */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Home className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-sm font-black text-neutral-800">Type de logement</span>
            <span className="text-[10px] font-bold text-rose-400 ml-0.5">*</span>
          </div>

          <Controller name="type" control={control} render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TYPE_LOGEMENT.map((t) => {
                const { label, Icon, iconCls } = TYPE_META[t];
                const active = field.value === t;
                return (
                  <button key={t} type="button"
                    onClick={() => { field.onChange(t); setValue('sousType', ''); }}
                    className={cn(
                      'relative flex flex-col items-center gap-2.5 py-4 px-3 rounded-2xl border-2 text-xs font-bold transition-all duration-200 active:scale-95',
                      active
                        ? 'border-transparent bg-[#0a0a0a] text-white shadow-lg'
                        : 'border-neutral-100 bg-neutral-50 text-neutral-500 hover:bg-white hover:border-neutral-200',
                    )}>
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                      active ? 'bg-white/10' : 'bg-white border border-neutral-200',
                    )}>
                      <Icon className={cn('w-5 h-5', active ? 'text-white' : iconCls)} />
                    </div>
                    <span>{label}</span>
                    {active && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/40">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )} />
          {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
        </div>

        {/* Type précis */}
        {sousTypes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <span className="text-sm font-black text-neutral-800">Type précis</span>
              <span className="text-[10px] font-bold text-rose-400 ml-0.5">*</span>
            </div>
            <Controller name="sousType" control={control} render={({ field }) => (
              <CustomDropdown
                options={sousTypes}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Sélectionnez un type"
                error={errors.sousType?.message}
                zIndex={120}
              />
            )} />
          </div>
        )}
      </SectionCard>

      {/* ── Capacité & Dimensions ── */}
      <SectionCard
        icon={Users}
        title="Capacité & Dimensions"
        description="Nombre de personnes, pièces et salles"
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <span className="text-sm font-black text-neutral-800">Capacité & composition</span>
          </div>
          <div className="rounded-2xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
            <Controller name="capaciteMax" control={control} render={({ field }) => (
              <CounterRow icon={Users} label="Capacité max" value={field.value ?? 1} onChange={field.onChange} min={1} max={50} />
            )} />
            <Controller name="nombrePieces" control={control} render={({ field }) => (
              <CounterRow icon={DoorOpen} label="Pièces" value={field.value ?? 1} onChange={field.onChange} min={1} max={30} />
            )} />
            <Controller name="nombreChambres" control={control} render={({ field }) => (
              <CounterRow icon={BedSingle} label="Chambres" value={field.value ?? 1} onChange={field.onChange} min={0} max={20} />
            )} />
            <Controller name="nombreSallesBain" control={control} render={({ field }) => (
              <CounterRow icon={Bath} label="Salles de bain" value={field.value ?? 1} onChange={field.onChange} min={0} max={20} />
            )} />
          </div>
        </div>
      </SectionCard>

      {/* ── Localisation ── */}
      <div className="relative z-20">
        <SectionCard
          icon={MapPin}
          title="Localisation"
          description="Où se situe votre bien ?"
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <span className="text-sm font-black text-neutral-800">Localisation</span>
              <span className="text-[10px] font-bold text-rose-400 ml-0.5">*</span>
            </div>

            <div className="space-y-2">
              {/* Zone */}
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Zone</p>
                <CustomDropdown
                  options={Object.keys(ZONES_SENEGAL) as ZoneSenegal[]}
                  value={selectedZone}
                  onChange={(z) => {
                    setSelectedZone(z as ZoneSenegal);
                    setValue('ville', '', { shouldValidate: false });
                  }}
                  placeholder="Sélectionnez une zone"
                  zIndex={150}
                />
              </div>

              {/* Quartier / Destination */}
              {selectedZone && (
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                    {selectedZone === 'Dakar' ? 'Quartier' : 'Destination'}
                  </p>
                  <Controller name="ville" control={control} render={({ field }) => (
                    <CustomDropdown
                      options={destinationsInZone}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder={selectedZone === 'Dakar' ? 'Sélectionnez un quartier' : 'Sélectionnez une destination'}
                      error={errors.ville?.message}
                      zIndex={300}
                      placement="top"
                    />
                  )} />
                </div>
              )}

              {/* Adresse */}
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Adresse précise</p>
                <div className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border-2 bg-white transition-all',
                  errors.adresse ? 'border-rose-400' : 'border-neutral-200 focus-within:border-rose-400',
                )}>
                  <MapPin className="w-4 h-4 text-neutral-300 shrink-0" />
                  <input
                    {...register('adresse')}
                    placeholder="Rue, résidence ou description précise"
                    className="flex-1 min-w-0 text-sm font-medium text-neutral-900 outline-none bg-transparent placeholder:text-neutral-300"
                  />
                </div>
                {errors.adresse && <p className="text-xs text-red-500 mt-1">{errors.adresse.message}</p>}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}
