'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Check, Loader2, AlertCircle, FileText,
  Home, Building2, TreePine, BedDouble,
  Users, Bath, DoorOpen, BedSingle, MapPin, ChevronDown,
  Pen, Minus, Plus, Info, Star, Moon,
  Armchair, ChefHat, Wifi, Shield, Trees, Accessibility,
  Camera, Upload, X, Trash2, ImageOff,
  TrendingUp, Tag, Sparkles, ChevronRight, Eye,
} from 'lucide-react';
import {
  stepBienSchema, type StepBienInput,
  stepAnnonceSchema, type StepAnnonceInput,
  TYPE_LOGEMENT, SOUS_TYPES_PAR_CATEGORIE, ZONES_SENEGAL,
  EQUIPEMENTS_PAR_CATEGORIE, CATEGORIE_EQUIPEMENT_LABELS,
  CATEGORIE_PHOTO, getZoneFromVille, type ZoneSenegal,
} from '@/schemas/listing.schema';
import type { ListingDetail, ListingPhoto, TarifPersonne, TarifNuit } from '@/lib/nestjs/types';
import { ListingStatusBadge } from '@/features/listings/components/listing-status-badge';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';

/* ─── CustomDropdown ─────────────────────────────────────────────────────── */

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
          open ? 'border-primary-400 ring-2 ring-primary-400/15'
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
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors duration-100',
                  selected ? 'bg-primary-500 text-white' : 'text-neutral-700 hover:bg-neutral-50',
                )}
              >
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

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fcfa(n: number) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

const TYPE_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  APPARTEMENT: { label: 'Appartement', Icon: Building2 },
  VILLA:       { label: 'Villa',       Icon: TreePine },
  CHAMBRE:     { label: 'Chambre',     Icon: BedDouble },
  AUTRES:      { label: 'Autres',      Icon: Home },
};


const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CONFORT: Armchair, CUISINE: ChefHat, CONNECTIVITE: Wifi,
  SECURITE: Shield, EXTERIEUR: Trees, ACCESSIBILITE: Accessibility,
};

const CAT_PHOTO_LABELS: Record<string, string> = {
  SALON: 'Salon', CHAMBRE: 'Chambre', CUISINE: 'Cuisine', SALLE_DE_BAIN: 'Salle de bain',
  TERRASSE: 'Terrasse', VUE: 'Vue', ENTREE: 'Entrée', PISCINE: 'Piscine', AUTRE: 'Autre',
};

const NAV_SECTIONS = [
  { id: 'section-bien',         label: 'Logement',     icon: Home,       dot: 'bg-primary-400' },
  { id: 'section-presentation', label: 'Présentation', icon: Pen,        dot: 'bg-accent-400' },
  { id: 'section-equipements',  label: 'Équipements',  icon: Armchair,   dot: 'bg-emerald-400' },
  { id: 'section-tarification', label: 'Tarification', icon: TrendingUp, dot: 'bg-violet-400' },
  { id: 'section-photos',       label: 'Photos',       icon: Camera,     dot: 'bg-sky-400' },
  { id: 'section-conditions',   label: 'Conditions',   icon: Shield,     dot: 'bg-rose-400' },
] as const;

function computeQuality(listing: ListingDetail): number {
  let score = 0;
  if ((listing.titre?.length ?? 0) >= 20) score += 20;
  if ((listing.description?.length ?? 0) >= 200) score += 20;
  score += Math.min((listing.photos?.length ?? 0) / 5, 1) * 25;
  if ((listing.equipements?.length ?? 0) >= 5) score += 20;
  if ((listing.reglesMaison?.length ?? 0) >= 20) score += 10;
  if ((listing.tarifsNuits?.length ?? 0) > 0 || (listing.tarifsPersonnes?.length ?? 0) > 0) score += 5;
  return Math.round(Math.min(100, score));
}

/* ─── Shared styles ───────────────────────────────────────────────────────── */

const INPUT_CLS = 'w-full px-4 py-3 rounded-xl border border-border bg-white text-foreground placeholder:text-neutral-400 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all';
const INPUT_ERR = 'w-full px-4 py-3 rounded-xl border border-error-500/60 bg-white text-foreground placeholder:text-neutral-400 text-sm outline-none focus:border-error-500 focus:ring-2 focus:ring-error-500/15 transition-all';

/* ─── Shared UI ───────────────────────────────────────────────────────────── */

function SectionCard({ title, icon: Icon, headerBg = 'bg-primary-50', iconBg = 'bg-primary-100', iconColor = 'text-primary-600', accent = 'bg-primary-500', children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  headerBg?: string;
  iconBg?: string;
  iconColor?: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm">
      <div className={cn('h-[3px] w-full rounded-t-2xl', accent)} />
      <div className={cn('flex items-center gap-3.5 px-5 py-4 border-b border-border', headerBg)}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <p className="font-bold text-neutral-900 text-[15px] tracking-tight">{title}</p>
      </div>
      <div className="px-5 py-6 space-y-5">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2.5">
      {children}
      {required && <span className="text-error-500 ml-0.5">*</span>}
      {optional && <span className="ml-2 text-neutral-300 normal-case font-normal text-[10px] tracking-normal">optionnel</span>}
    </label>
  );
}

function Counter({ value, onChange, min = 0, max = 30 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-8 h-8 rounded-full border border-border bg-white flex items-center justify-center text-neutral-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 disabled:opacity-30 transition-all active:scale-90">
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center font-black text-neutral-900 text-[15px] tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-8 h-8 rounded-full border border-border bg-white flex items-center justify-center text-neutral-400 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 disabled:opacity-30 transition-all active:scale-90">
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function CounterRow({ icon: Icon, label, value, onChange, min, max }: {
  icon: React.ComponentType<{ className?: string }>; label: string;
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-neutral-50 hover:bg-white transition-colors">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-neutral-400" />
        <span className="text-sm text-neutral-700 font-semibold">{label}</span>
      </div>
      <Counter value={value} onChange={onChange} min={min} max={max} />
    </div>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function SaveButton({ state, error, onSave, disabled }: { state: SaveState; error?: string | null; onSave: () => void; disabled?: boolean }) {
  const isDisabled = disabled || state === 'saving' || state === 'saved';
  return (
    <div className="flex items-center justify-between pt-5 border-t border-border">
      {error ? (
        <div className="flex items-center gap-2 text-xs text-error-600 font-medium bg-error-500/8 border border-error-500/20 rounded-lg px-3 py-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      ) : <div />}
      <button
        type="button"
        onClick={onSave}
        disabled={isDisabled}
        className={cn(
          'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300',
          state === 'saved'
            ? 'bg-success-500 text-white shadow-md shadow-success-500/25'
            : isDisabled
              ? 'bg-primary-300 text-white cursor-not-allowed opacity-60'
              : 'bg-primary-500 hover:bg-primary-600 text-white shadow-md shadow-primary-500/25 hover:-translate-y-0.5 active:scale-95',
        )}
      >
        {state === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === 'saved' && <Check className="w-4 h-4" />}
        {state === 'saved' ? 'Sauvegardé !' : state === 'saving' ? 'Sauvegarde…' : 'Sauvegarder'}
      </button>
    </div>
  );
}

/* ─── Quality meter ───────────────────────────────────────────────────────── */

function QualityMeter({ score }: { score: number }) {
  const bar   = score >= 80 ? 'bg-success-500' : score >= 50 ? 'bg-warning-500' : 'bg-error-500';
  const ring  = score >= 80 ? 'stroke-success-500' : score >= 50 ? 'stroke-warning-500' : 'stroke-error-500';
  const tc    = score >= 80 ? 'text-success-600' : score >= 50 ? 'text-warning-600' : 'text-error-600';
  const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Bon' : 'À compléter';
  const circ  = 2 * Math.PI * 22;
  return (
    <div className="bg-white rounded-2xl border border-border p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Qualité annonce</p>
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 50 50" className="-rotate-90 w-14 h-14">
            <circle cx="25" cy="25" r="22" fill="none" stroke="currentColor" strokeWidth="4" className="text-neutral-100" />
            <circle cx="25" cy="25" r="22" fill="none" strokeWidth="4"
              strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
              strokeLinecap="round" className={cn('transition-all duration-700', ring)} />
          </svg>
          <span className={cn('absolute inset-0 flex items-center justify-center text-base font-black tabular-nums', tc)}>{score}</span>
        </div>
        <div>
          <p className={cn('text-lg font-black leading-none mb-0.5', tc)}>{label}</p>
          <div className="h-1.5 w-24 bg-neutral-100 rounded-full overflow-hidden mt-2">
            <div className={cn('h-full rounded-full transition-all duration-700', bar)} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Section Bien ────────────────────────────────────────────────────────── */

function SectionBien({ listing }: { listing: ListingDetail }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<StepBienInput>({
    resolver: zodResolver(stepBienSchema),
    defaultValues: {
      type:             listing.type,
      sousType:         listing.sousType ?? '',
      nombreChambres:   listing.nombreChambres,
      nombreSallesBain: listing.nombreSallesBain,
      nombrePieces:     listing.nombrePieces,
      capaciteMax:      listing.capaciteMax,
      ville:            listing.ville,
      adresse:          listing.adresse,
    },
  });

  const selectedType = watch('type');
  const sousTypes = selectedType ? (SOUS_TYPES_PAR_CATEGORIE[selectedType] as readonly string[]) : [];

  const [selectedZone, setSelectedZone] = useState<ZoneSenegal | ''>(() => getZoneFromVille(listing.ville) ?? '');
  const destinationsInZone = selectedZone ? (ZONES_SENEGAL[selectedZone] as readonly string[]) : [];

  async function onSave(data: StepBienInput) {
    setState('saving'); setApiError(null);
    try {
      await nestFetch(NEST_API.LISTINGS.UPDATE(listing.id), { method: 'PATCH', body: JSON.stringify(data) });
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); setTimeout(() => setState('idle'), 2000);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Informations du logement" icon={Home} accent="bg-primary-500" headerBg="bg-primary-50" iconBg="bg-primary-100" iconColor="text-primary-600">

      {/* ── Type de logement ── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            <Home className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <span className="text-sm font-black text-neutral-800">Type de logement</span>
          <span className="text-[10px] font-bold text-rose-400 ml-0.5">*</span>
        </div>

        <Controller name="type" control={control} render={({ field }) => (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {TYPE_LOGEMENT.map((t) => {
              const { label, Icon } = TYPE_META[t];
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
                    <Icon className={cn('w-5 h-5', active ? 'text-white' : 'text-neutral-400')} />
                  </div>
                  <span>{label}</span>
                  {active && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shadow-sm shadow-primary-500/40">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )} />
        {errors.type && <p className="text-xs text-error-500">{errors.type.message}</p>}
      </div>

      {/* ── Type précis ── */}
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
              value={field.value}
              onChange={field.onChange}
              placeholder="Sélectionnez un type"
              error={errors.sousType?.message}
              zIndex={120}
            />
          )} />
        </div>
      )}

      {/* ── Capacité & composition ── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <span className="text-sm font-black text-neutral-800">Capacité & composition</span>
        </div>
        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
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

      {/* ── Localisation ── */}
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
                  value={field.value}
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
              errors.adresse ? 'border-error-400' : 'border-neutral-200 focus-within:border-rose-400',
            )}>
              <MapPin className="w-4 h-4 text-neutral-300 shrink-0" />
              <input
                {...register('adresse')}
                placeholder="Rue, résidence ou description précise"
                className="flex-1 min-w-0 text-sm font-medium text-neutral-900 outline-none bg-transparent placeholder:text-neutral-300"
              />
            </div>
            {errors.adresse && <p className="text-xs text-error-500 mt-1">{errors.adresse.message}</p>}
          </div>
        </div>
      </div>

      <SaveButton state={state} error={apiError} onSave={handleSubmit(onSave)} />
    </SectionCard>
  );
}

/* ─── Section Présentation ────────────────────────────────────────────────── */

function SectionPresentation({ listing }: { listing: ListingDetail }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<StepAnnonceInput>({
    resolver: zodResolver(stepAnnonceSchema),
    defaultValues: {
      titre: listing.titre,
      description: listing.description,
      prixBase: listing.prixBase,
      nuitesMinimum: listing.nuitesMinimum,
    },
  });

  const descLength = watch('description')?.length ?? 0;
  const prix = watch('prixBase') ?? 0;

  async function onSave(data: StepAnnonceInput) {
    setState('saving'); setApiError(null);
    try {
      await nestFetch(NEST_API.LISTINGS.UPDATE(listing.id), { method: 'PATCH', body: JSON.stringify(data) });
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); setTimeout(() => setState('idle'), 2000);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Présentation & Tarif" icon={Pen}>

      {/* ── Titre ── */}
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
          placeholder="Ex: Villa avec piscine à Saly, vue mer"
          className={cn(errors.titre ? INPUT_ERR : INPUT_CLS, 'font-semibold')}
        />
        {errors.titre && <p className="text-xs text-error-500">{errors.titre.message}</p>}
      </div>

      {/* ── Description ── */}
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
          {errors.description && <p className="text-xs text-error-500">{errors.description.message}</p>}
          <div className="flex items-center gap-2.5">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300',
                  descLength === 0 ? 'w-0'
                  : descLength > 1800 ? 'bg-amber-400'
                  : descLength > 800 ? 'bg-emerald-400'
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

      {/* ── Prix de base ── */}
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
          {prix > 0 && !errors.prixBase && (
            <p className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              ≈ {(prix / 655).toFixed(0)} € / nuit
            </p>
          )}
        </div>
      </div>

      {/* ── Durée minimum ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            <Moon className="w-3.5 h-3.5 text-primary-600" />
          </div>
          <span className="text-sm font-black text-neutral-800">Durée minimum de séjour</span>
        </div>

        <Controller name="nuitesMinimum" control={control} render={({ field }) => (<>
          <div className="flex items-center gap-4 px-5 py-4 bg-neutral-50 rounded-2xl border border-border">
            <button type="button" onClick={() => field.onChange(Math.max(1, (field.value ?? 1) - 1))} disabled={(field.value ?? 1) <= 1}
              className="w-12 h-12 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center text-neutral-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all disabled:opacity-30 shrink-0 active:scale-90">
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-4xl font-black text-neutral-900 tabular-nums">{field.value ?? 1}</span>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Nuit{(field.value ?? 1) > 1 ? 's' : ''} minimum</p>
            </div>
            <button type="button" onClick={() => field.onChange(Math.min(365, (field.value ?? 1) + 1))} disabled={(field.value ?? 1) >= 365}
              className="w-12 h-12 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center text-neutral-500 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-all disabled:opacity-30 shrink-0 active:scale-90">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {([1, 2, 3, 7, 14, 30] as const).map((n) => (
              <button key={n} type="button" onClick={() => field.onChange(n)}
                className={cn('py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95',
                  field.value === n
                    ? 'border-primary-400 bg-primary-500 text-white shadow-sm shadow-primary-500/20'
                    : 'border-border bg-neutral-50 text-neutral-500 hover:bg-white hover:border-neutral-300')}>
                {n === 1 ? '1 nuit' : n === 7 ? '1 sem.' : n === 14 ? '2 sem.' : n === 30 ? '1 mois' : `${n} nuits`}
              </button>
            ))}
          </div>
        </>)} />
      </div>

      <SaveButton state={state} error={apiError} onSave={handleSubmit(onSave)} />
    </SectionCard>
  );
}

/* ─── Section Équipements ─────────────────────────────────────────────────── */

function SectionEquipements({ listing }: { listing: ListingDetail }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(listing.equipements.map((e) => e.nom)));
  const [catalogue, setCatalogue] = useState<{ id: string; nom: string }[] | null>(null);
  const [catalogueError, setCatalogueError] = useState(false);
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    nestFetch<{ id: string; nom: string }[]>(NEST_API.LISTINGS.LIST_EQUIPEMENTS, { method: 'GET' })
      .then((data) => { setCatalogue(data); })
      .catch(() => { setCatalogueError(true); });
  }, []);

  function toggle(nom: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(nom) ? next.delete(nom) : next.add(nom);
      return next;
    });
  }

  async function onSave() {
    if (!catalogue) {
      setApiError('Catalogue encore en chargement, réessayez dans un instant');
      return;
    }
    setState('saving'); setApiError(null);
    try {
      const ids = catalogue.filter((e) => selected.has(e.nom)).map((e) => e.id);
      await nestFetch(NEST_API.LISTINGS.SET_EQUIPEMENTS(listing.id), {
        method: 'PUT', body: JSON.stringify({ equipementIds: ids }),
      });
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); setTimeout(() => setState('idle'), 2000);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Équipements & Services" icon={Armchair}>

      {/* Statut du catalogue */}
      {catalogueError && (
        <div className="flex items-center gap-2 text-xs text-error-600 bg-error-500/8 border border-error-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Impossible de charger le catalogue — la sauvegarde est désactivée.
        </div>
      )}

      {/* Barre de statut */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <Check className="w-3 h-3" />
          {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
        </span>
        {!catalogue && !catalogueError && (
          <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Chargement du catalogue…
          </span>
        )}
      </div>

      {/* ── Mobile : accordéons ── */}
      <div className="sm:hidden space-y-2">
        {Object.entries(EQUIPEMENTS_PAR_CATEGORIE).map(([cat, items]) => {
          const Icon = CAT_ICONS[cat] ?? Tag;
          const catItems = items as readonly string[];
          const selCount = catItems.filter((n) => selected.has(n)).length;
          const isOpen = openCats.has(cat);
          return (
            <div key={cat} className="rounded-2xl border border-neutral-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenCats((prev) => {
                  const next = new Set(prev);
                  next.has(cat) ? next.delete(cat) : next.add(cat);
                  return next;
                })}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-white active:bg-neutral-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-neutral-500" />
                </div>
                <span className="flex-1 text-sm font-bold text-neutral-800 text-left">
                  {CATEGORIE_EQUIPEMENT_LABELS[cat]}
                </span>
                {selCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                    {selCount}
                  </span>
                )}
                <ChevronDown className={cn('w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="border-t border-neutral-100 divide-y divide-neutral-50">
                  {catItems.map((nom) => {
                    const active = selected.has(nom);
                    return (
                      <button
                        key={nom}
                        type="button"
                        onClick={() => toggle(nom)}
                        className={cn('w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left active:opacity-80', active ? 'bg-emerald-50' : 'bg-white')}
                      >
                        <div className={cn('w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all', active ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-300')}>
                          {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className={cn('text-sm font-medium flex-1', active ? 'text-emerald-800 font-semibold' : 'text-neutral-700')}>
                          {nom}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop : pills ── */}
      <div className="hidden sm:block space-y-4">
        {Object.entries(EQUIPEMENTS_PAR_CATEGORIE).map(([cat, items]) => {
          const Icon = CAT_ICONS[cat] ?? Tag;
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-md bg-neutral-100 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  {CATEGORIE_EQUIPEMENT_LABELS[cat]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(items as readonly string[]).map((nom) => {
                  const active = selected.has(nom);
                  return (
                    <button key={nom} type="button" onClick={() => toggle(nom)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                        active
                          ? 'bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-500/20'
                          : 'bg-neutral-50 border-border text-neutral-600 hover:bg-white hover:border-neutral-300',
                      )}>
                      {active && <Check className="w-3 h-3" />}
                      {nom}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <SaveButton state={state} error={apiError} onSave={onSave} disabled={!catalogue || catalogueError} />
    </SectionCard>
  );
}

/* ─── Section Conditions ──────────────────────────────────────────────────── */

function SectionConditions({ listing }: { listing: ListingDetail }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [reglesMaison, setReglesMaison] = useState(listing.reglesMaison ?? '');
  const MAX = 1000;

  async function onSave() {
    setState('saving'); setApiError(null);
    try {
      await nestFetch(NEST_API.LISTINGS.UPDATE(listing.id), {
        method: 'PATCH', body: JSON.stringify({ reglesMaison: reglesMaison || null }),
      });
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); setTimeout(() => setState('idle'), 2000);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Règles & Conditions" icon={Shield} accent="bg-rose-500" headerBg="bg-rose-50" iconBg="bg-rose-100" iconColor="text-rose-600">
      <div>
        <FieldLabel optional>Règles de la maison</FieldLabel>
        <textarea
          value={reglesMaison}
          onChange={(e) => setReglesMaison(e.target.value.slice(0, MAX))}
          rows={5}
          placeholder={`Ex :\n• Pas de fêtes ou d'événements\n• Animaux non admis\n• Interdiction de fumer à l'intérieur\n• Silence après 22h`}
          className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
        />
        <div className="flex justify-between items-center px-1 mt-1.5">
          <p className="text-[10px] text-neutral-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Affiché sur votre annonce
          </p>
          <p className={cn('text-[10px] font-bold tabular-nums', reglesMaison.length > 900 ? 'text-error-500' : 'text-neutral-400')}>
            {reglesMaison.length} / {MAX}
          </p>
        </div>
      </div>
      <SaveButton state={state} error={apiError} onSave={onSave} />
    </SectionCard>
  );
}

/* ─── Section Photos ──────────────────────────────────────────────────────── */

interface LocalPhoto extends ListingPhoto {
  uploading?: boolean;
  uploadError?: string;
}

function SectionPhotos({ listing }: { listing: ListingDetail }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<LocalPhoto[]>(listing.photos);
  const [newCategory, setNewCategory] = useState<typeof CATEGORIE_PHOTO[number]>('AUTRE');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [settingMain, setSettingMain] = useState<string | null>(null);

  const canAdd = photos.length < 10;

  async function handleFiles(files: FileList | null) {
    if (!files || !canAdd) return;
    setGlobalError(null);
    const toAdd = Array.from(files).slice(0, 10 - photos.length);

    for (const file of toAdd) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);
      const tempPhoto: LocalPhoto = {
        id: tempId, url: previewUrl, publicId: '',
        categorie: newCategory, estPrincipale: photos.length === 0,
        position: photos.length, uploading: true,
      };
      setPhotos((prev) => [...prev, tempPhoto]);

      try {
        const params = await nestFetch<{
          uploadUrl: string; signature: string; timestamp: number;
          apiKey: string; cloudName: string; folder: string;
        }>(NEST_API.LISTINGS.PHOTO_UPLOAD_PARAMS(listing.id), { method: 'GET' });

        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', params.folder);
        fd.append('signature', params.signature);
        fd.append('timestamp', String(params.timestamp));
        fd.append('api_key', params.apiKey);

        const upRes = await fetch(params.uploadUrl, { method: 'POST', body: fd });
        if (!upRes.ok) throw new Error('Échec upload Cloudinary');
        const upData = await upRes.json() as { secure_url: string; public_id: string };

        const isFirst = photos.filter((p) => !p.uploading).length === 0;
        const saved = await nestFetch<ListingPhoto>(NEST_API.LISTINGS.ADD_PHOTO(listing.id), {
          method: 'POST',
          body: JSON.stringify({
            url: upData.secure_url, publicId: upData.public_id,
            categorie: newCategory, estPrincipale: isFirst, position: photos.length,
          }),
        });

        URL.revokeObjectURL(previewUrl);
        setPhotos((prev) => prev.map((p) => p.id === tempId ? { ...saved } : p));
        await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      } catch {
        setPhotos((prev) => prev.map((p) =>
          p.id === tempId ? { ...p, uploading: false, uploadError: 'Échec upload' } : p,
        ));
      }
    }
  }

  async function deletePhoto(photo: LocalPhoto) {
    if (photo.uploading) return;
    try {
      await nestFetch(NEST_API.LISTINGS.REMOVE_PHOTO(listing.id, photo.id), { method: 'DELETE' });
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
    } catch {
      setGlobalError('Impossible de supprimer la photo');
    }
  }

  async function setMainPhoto(photo: LocalPhoto) {
    if (photo.uploading || photo.estPrincipale) return;
    setSettingMain(photo.id);
    try {
      await nestFetch(NEST_API.LISTINGS.SET_MAIN_PHOTO(listing.id, photo.id), { method: 'PATCH' });
      setPhotos((prev) => prev.map((p) => ({ ...p, estPrincipale: p.id === photo.id })));
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
    } catch {
      setGlobalError('Impossible de définir la photo principale');
    } finally {
      setSettingMain(null);
    }
  }

  return (
    <SectionCard title={`Photos (${photos.length}/10)`} icon={Camera}>
      {globalError && (
        <div className="flex items-center gap-2 text-xs text-error-600 bg-error-500/8 border border-error-500/20 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {globalError}
        </div>
      )}

      {photos.length > 0 ? (<>

        {/* ── Photo principale (hero) ── */}
        {(() => {
          const main = photos.find((p) => p.estPrincipale) ?? photos[0];
          return (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-100 border border-border">
              <Image src={main.url} alt="Photo principale" fill className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  Photo de couverture
                </span>
                <span className="text-[10px] font-semibold text-white/70 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {CAT_PHOTO_LABELS[main.categorie] ?? main.categorie}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ── Grille des autres photos ── */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={cn(
                'group relative aspect-square rounded-xl overflow-hidden bg-neutral-100 border-2 transition-all',
                photo.estPrincipale ? 'border-amber-400 shadow-md shadow-amber-400/20' : 'border-transparent',
              )}
            >
              <Image
                src={photo.url} alt={photo.categorie} fill
                className={cn('object-cover transition-all duration-200 group-active:brightness-75', photo.uploading && 'opacity-50')}
                sizes="(max-width: 640px) 33vw, 25vw"
              />

              {/* Overlay uploading */}
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}

              {/* Overlay erreur */}
              {photo.uploadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-error-500/60 backdrop-blur-sm">
                  <p className="text-[9px] font-bold text-white text-center px-1">{photo.uploadError}</p>
                </div>
              )}

              {/* Badge principale */}
              {photo.estPrincipale && (
                <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow">
                  <Star className="w-2.5 h-2.5 text-white fill-white" />
                </div>
              )}

              {/* Actions au tap (mobile) / hover (desktop) */}
              {!photo.uploading && !photo.uploadError && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 sm:group-hover:opacity-100 active:opacity-100 transition-opacity bg-black/40 flex flex-col items-center justify-center gap-1.5 p-1">
                  {!photo.estPrincipale && (
                    <button
                      type="button"
                      onClick={() => setMainPhoto(photo)}
                      disabled={settingMain === photo.id}
                      className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-400/90 text-white text-[10px] font-bold active:scale-95 transition-transform"
                    >
                      {settingMain === photo.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Star className="w-3 h-3 fill-white" />}
                      Principale
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deletePhoto(photo)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/90 text-white text-[10px] font-bold active:scale-95 transition-transform"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-neutral-400 text-center">
          Appuyez sur une photo pour la définir en couverture ou la supprimer
        </p>
      </>) : (
        <div className="flex flex-col items-center justify-center py-12 gap-4 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 border border-border flex items-center justify-center">
            <ImageOff className="w-6 h-6 text-neutral-300" />
          </div>
          <p className="text-sm text-neutral-400 font-medium">Aucune photo pour l&apos;instant</p>
        </div>
      )}

      {canAdd && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div>
            <FieldLabel optional>Catégorie des nouvelles photos</FieldLabel>
            <div className="relative inline-block">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as typeof CATEGORIE_PHOTO[number])}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border bg-white text-neutral-700 text-xs font-semibold outline-none focus:border-primary-400 cursor-pointer">
                {CATEGORIE_PHOTO.map((c) => (
                  <option key={c} value={c}>{CAT_PHOTO_LABELS[c]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed border-primary-200 hover:border-primary-400 bg-primary-50/50 hover:bg-primary-50 text-primary-600 font-semibold text-sm transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform border border-primary-200">
              <Upload className="w-4 h-4 text-primary-500" />
            </div>
            Ajouter des photos — {10 - photos.length} restante{10 - photos.length > 1 ? 's' : ''}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-neutral-500 bg-neutral-50 rounded-xl px-3 py-2.5 border border-border">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
        <span>Minimum 5 photos recommandées. Appuyez sur une photo pour la mettre en couverture.</span>
      </div>
    </SectionCard>
  );
}

/* ─── Section Tarification ────────────────────────────────────────────────── */

function SectionTarification({ listing }: { listing: ListingDetail }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [tarifsNuits, setTarifsNuits] = useState<TarifNuit[]>(listing.tarifsNuits);
  const [tarifsPersonnes, setTarifsPersonnes] = useState<TarifPersonne[]>(listing.tarifsPersonnes);

  function addTarifNuit() {
    const last = tarifsNuits[tarifsNuits.length - 1];
    const nextMin = last ? (last.nuitsMax ? last.nuitsMax + 1 : last.nuitsMin + 7) : listing.nuitesMinimum + 1;
    setTarifsNuits((prev) => [...prev, { nuitsMin: Math.max(listing.nuitesMinimum + 1, nextMin), nuitsMax: null, prix: listing.prixBase }]);
  }
  function removeTarifNuit(i: number) { setTarifsNuits((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateTarifNuit(i: number, patch: Partial<TarifNuit>) {
    setTarifsNuits((prev) => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  }

  function addTarifPersonne() {
    const last = tarifsPersonnes[tarifsPersonnes.length - 1];
    const nextMin = last ? last.personnesMax + 1 : listing.personnesBase + 1;
    setTarifsPersonnes((prev) => [...prev, { personnesMin: Math.max(listing.personnesBase + 1, nextMin), personnesMax: nextMin + 1, supplement: 5000 }]);
  }
  function removeTarifPersonne(i: number) { setTarifsPersonnes((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateTarifPersonne(i: number, patch: Partial<TarifPersonne>) {
    setTarifsPersonnes((prev) => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  }

  async function onSave() {
    setState('saving'); setApiError(null);
    try {
      await Promise.all([
        nestFetch(NEST_API.LISTINGS.SET_TARIFS_NUITS(listing.id), { method: 'POST', body: JSON.stringify({ tarifs: tarifsNuits }) }),
        nestFetch(NEST_API.LISTINGS.SET_TARIFS_PERSONNES(listing.id), { method: 'POST', body: JSON.stringify({ tarifs: tarifsPersonnes }) }),
      ]);
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); setTimeout(() => setState('idle'), 2000);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Tarification avancée" icon={TrendingUp}>

      {/* ── Prix de base (dark hero card) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-white/[0.07] p-4">
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5">Prix de base</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-white tracking-tight">{fcfa(listing.prixBase)}</span>
          <span className="text-sm font-bold text-white/40 mb-0.5">FCFA / nuit</span>
        </div>
        <p className="text-[11px] text-white/30 mt-1">
          {listing.nuitesMinimum} nuit{listing.nuitesMinimum > 1 ? 's' : ''} minimum · {listing.personnesBase} voyageur{listing.personnesBase > 1 ? 's' : ''} inclus
        </p>
      </div>

      {/* ── Réductions longs séjours ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <span className="text-sm font-black text-neutral-800">Réductions longs séjours</span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500 leading-relaxed bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
          S&apos;applique à partir de <strong className="text-violet-700">{listing.nuitesMinimum + 1} nuits</strong>. Plus le séjour est long, plus le prix peut être attractif.
        </p>

        {tarifsNuits.length > 0 && (
          <div className="space-y-2.5">
            {tarifsNuits.map((t, i) => {
              const reductPct = listing.prixBase > 0 ? Math.round((1 - t.prix / listing.prixBase) * 100) : 0;
              return (
                <div key={i} className="rounded-2xl border border-violet-100 overflow-hidden">
                  {/* Header palier */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Palier {i + 1}</span>
                      {reductPct > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                          -{reductPct}%
                        </span>
                      )}
                      {reductPct < 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-black">
                          +{Math.abs(reductPct)}%
                        </span>
                      )}
                    </div>
                    <button type="button" onClick={() => removeTarifNuit(i)}
                      className="w-7 h-7 rounded-lg bg-white border border-rose-200 flex items-center justify-center text-rose-400 active:scale-90 transition-transform">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Champs — vertical mobile / horizontal desktop */}
                  <div className="p-3.5 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                      {/* Range nuits */}
                      <div className="sm:flex-1">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Durée du séjour</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input type="number" min={listing.nuitesMinimum + 1} value={t.nuitsMin}
                              onChange={(e) => updateTarifNuit(i, { nuitsMin: Math.max(listing.nuitesMinimum + 1, +e.target.value) })}
                              className={cn(INPUT_CLS, 'text-center font-bold')} />
                            <p className="text-[9px] text-neutral-400 text-center mt-1 font-medium">nuits min</p>
                          </div>
                          <span className="text-neutral-300 font-bold text-lg shrink-0">—</span>
                          <div className="flex-1">
                            <input type="number" value={t.nuitsMax ?? ''} placeholder="∞"
                              onChange={(e) => updateTarifNuit(i, { nuitsMax: e.target.value ? +e.target.value : null })}
                              className={cn(INPUT_CLS, 'text-center font-bold')} />
                            <p className="text-[9px] text-neutral-400 text-center mt-1 font-medium">nuits max</p>
                          </div>
                        </div>
                      </div>

                      {/* Séparateur vertical desktop */}
                      <div className="hidden sm:block w-px h-10 bg-neutral-100 self-center" />

                      {/* Prix */}
                      <div className="sm:flex-1">
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Prix par nuit</p>
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-neutral-200 focus-within:border-violet-400 bg-neutral-50 transition-colors">
                          <input type="number" value={t.prix}
                            onChange={(e) => updateTarifNuit(i, { prix: +e.target.value })}
                            className="flex-1 min-w-0 text-xl font-black text-neutral-900 outline-none bg-transparent" />
                          <span className="text-[10px] font-bold text-neutral-400 shrink-0">FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button type="button" onClick={addTarifNuit}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-violet-200 hover:border-violet-400 bg-violet-50/50 hover:bg-violet-50 text-violet-600 text-sm font-bold transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          {tarifsNuits.length === 0 ? 'Ajouter une réduction' : 'Ajouter un palier'}
        </button>
      </div>

      {/* ── Suppléments voyageurs ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-100 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-accent-600" />
          </div>
          <span className="text-sm font-black text-neutral-800">Suppléments voyageurs</span>
        </div>

        <p className="text-[11px] text-neutral-500 leading-relaxed bg-accent-50 border border-accent-100 rounded-xl px-3 py-2.5">
          Le tarif de base couvre <strong className="text-accent-700">{listing.personnesBase} voyageur{listing.personnesBase > 1 ? 's' : ''}</strong>. Ajoutez un supplément par personne supplémentaire.
        </p>

        {tarifsPersonnes.length > 0 && (
          <div className="space-y-2.5">
            {tarifsPersonnes.map((t, i) => (
              <div key={i} className="rounded-2xl border border-accent-100 overflow-hidden">
                {/* Header palier */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-accent-50">
                  <span className="text-[10px] font-black text-accent-600 uppercase tracking-widest">Palier {i + 1}</span>
                  <button type="button" onClick={() => removeTarifPersonne(i)}
                    className="w-7 h-7 rounded-lg bg-white border border-rose-200 flex items-center justify-center text-rose-400 active:scale-90 transition-transform">
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Champs — vertical mobile / horizontal desktop */}
                <div className="p-3.5 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    {/* Range personnes */}
                    <div className="sm:flex-1">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Nombre de voyageurs</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <input type="number" min={listing.personnesBase + 1} value={t.personnesMin}
                            onChange={(e) => updateTarifPersonne(i, { personnesMin: Math.max(listing.personnesBase + 1, +e.target.value) })}
                            className={cn(INPUT_CLS, 'text-center font-bold')} />
                          <p className="text-[9px] text-neutral-400 text-center mt-1 font-medium">pers. min</p>
                        </div>
                        <span className="text-neutral-300 font-bold text-lg shrink-0">—</span>
                        <div className="flex-1">
                          <input type="number" value={t.personnesMax}
                            onChange={(e) => updateTarifPersonne(i, { personnesMax: Math.max(t.personnesMin, +e.target.value) })}
                            className={cn(INPUT_CLS, 'text-center font-bold')} />
                          <p className="text-[9px] text-neutral-400 text-center mt-1 font-medium">pers. max</p>
                        </div>
                      </div>
                    </div>

                    {/* Séparateur vertical desktop */}
                    <div className="hidden sm:block w-px h-10 bg-neutral-100 self-center" />

                    {/* Supplément */}
                    <div className="sm:flex-1">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Supplément par nuit</p>
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-neutral-200 focus-within:border-accent-400 bg-neutral-50 transition-colors">
                        <span className="text-sm font-black text-accent-500 shrink-0">+</span>
                        <input type="number" value={t.supplement}
                          onChange={(e) => updateTarifPersonne(i, { supplement: +e.target.value })}
                          className="flex-1 min-w-0 text-xl font-black text-neutral-900 outline-none bg-transparent" />
                        <span className="text-[10px] font-bold text-neutral-400 shrink-0">FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={addTarifPersonne}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-accent-200 hover:border-accent-400 bg-accent-50/50 hover:bg-accent-50 text-accent-600 text-sm font-bold transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" />
          {tarifsPersonnes.length === 0 ? 'Ajouter un supplément' : 'Ajouter un palier'}
        </button>
      </div>

      <SaveButton state={state} error={apiError} onSave={onSave} />
    </SectionCard>
  );
}

/* ─── Main Export ─────────────────────────────────────────────────────────── */

export function EditListingForm({ listing }: { listing: ListingDetail }) {
  const principale = listing.photos.find((p) => p.estPrincipale) ?? listing.photos[0];
  const quality = computeQuality(listing);

  return (
    <div className="min-h-screen bg-background-alt">

      {/* ─── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-64 sm:h-80">
        {principale ? (
          <Image src={principale.url} alt="" fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 pt-4 sm:pt-5 flex items-center justify-between">
          <Link
            href={`/dashboard/annonces/${listing.id}`}
            className="group w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
          >
            <ArrowLeft className="w-4 h-4 text-white transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/annonces/${listing.id}`}
              className="flex items-center gap-1.5 text-xs font-bold text-white/80 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 hover:bg-white/20 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Aperçu</span>
            </Link>
            <ListingStatusBadge statut={listing.statut} size="sm" />
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-5">
          <div className="max-w-5xl mx-auto">
            {/* Label */}
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-primary-300" />
              <span className="text-[10px] font-black text-primary-300 uppercase tracking-[0.2em]">Modifier l&apos;annonce</span>
            </div>

            {/* Titre */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight line-clamp-2 mb-4 max-w-xl">
              {listing.titre}
            </h1>

            {/* KPI chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Quality score — visible surtout mobile (sidebar cachée) */}
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-black',
                quality >= 70 ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                : quality >= 40 ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                : 'bg-rose-500/20 border-rose-400/30 text-rose-300',
              )}>
                <Sparkles className="w-3 h-3" />
                {quality}%
              </div>

              <div className="w-px h-4 bg-white/15" />

              {[
                { icon: MapPin,    text: listing.ville },
                { icon: Users,     text: `${listing.capaciteMax} pers.` },
                { icon: Camera,    text: `${listing.photos.length} photos` },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-white/65 text-xs font-semibold bg-black/30 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10">
                  <Icon className="w-3.5 h-3.5" />
                  {text}
                </div>
              ))}

              <div className="flex items-center gap-1.5 text-white text-xs font-black bg-primary-500/70 backdrop-blur-sm border border-primary-400/30 rounded-lg px-2.5 py-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                {fcfa(listing.prixBase)} FCFA
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Nav mobile ───────────────────────────────────────────────────────── */}
      <div className="lg:hidden bg-[#0a0a0a] border-b border-white/[0.06]">
        <div className="flex gap-1 overflow-x-auto px-3 py-2.5" style={{ scrollbarWidth: 'none' }}>
          {NAV_SECTIONS.map(({ id, label, icon: Icon, dot }) => (
            <a key={id} href={`#${id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/50 text-xs font-semibold whitespace-nowrap hover:text-white hover:bg-white/8 transition-all shrink-0">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
              <Icon className="w-3.5 h-3.5" />
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex gap-7 items-start">

          {/* Sidebar desktop */}
          <div className="hidden lg:flex flex-col gap-3 w-52 shrink-0 sticky top-8">
            <QualityMeter score={quality} />
            <div className="bg-white rounded-2xl border border-border shadow-sm p-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 py-2">Navigation</p>
              {NAV_SECTIONS.map(({ id, label, icon: Icon, dot }) => (
                <a key={id} href={`#${id}`}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-all">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', dot)} />
                  <Icon className="w-[15px] h-[15px] shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-35 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="flex-1 min-w-0 space-y-6">
            <div id="section-bien" className="scroll-mt-6"><SectionBien listing={listing} /></div>
            <div id="section-presentation" className="scroll-mt-6"><SectionPresentation listing={listing} /></div>
            <div id="section-equipements" className="scroll-mt-6"><SectionEquipements listing={listing} /></div>
            <div id="section-tarification" className="scroll-mt-6"><SectionTarification listing={listing} /></div>
            <div id="section-photos" className="scroll-mt-6"><SectionPhotos listing={listing} /></div>
            <div id="section-conditions" className="scroll-mt-6"><SectionConditions listing={listing} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
