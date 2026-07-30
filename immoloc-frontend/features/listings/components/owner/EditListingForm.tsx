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
          'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-field border bg-background-alt text-sm transition-all duration-150 cursor-pointer',
          open ? 'border-forest-600 ring-2 ring-forest-500/20 shadow-xs'
               : error ? 'border-error-500/60' : 'border-border hover:border-border-hover hover:bg-background-card',
          value ? 'text-foreground font-semibold' : 'text-foreground-faint font-normal',
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 text-foreground-muted transition-transform duration-200', open && 'rotate-180')} />
      </button>

      <div
        style={{ zIndex }}
        className={cn(
          'absolute left-0 right-0 bg-background-card rounded-card border border-border',
          'shadow-2xl overflow-hidden transition-all duration-200',
          placement === 'top' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top',
          open ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-95 pointer-events-none',
        )}
      >
        <div className="max-h-56 overflow-y-auto overscroll-contain divide-y divide-border/50">
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 text-sm transition-colors duration-100 cursor-pointer',
                  selected ? 'bg-forest-950 text-lime-300 font-bold' : 'text-foreground hover:bg-background-alt',
                )}
              >
                <span className={cn('font-medium', selected && 'font-bold')}>{opt}</span>
                {selected && <Check className="w-4 h-4 text-lime-400 flex-shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-[11px] text-error-600 mt-1.5 font-semibold">{error}</p>}
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
  { id: 'section-bien',         label: 'Logement',     icon: Home },
  { id: 'section-presentation', label: 'Présentation', icon: Pen },
  { id: 'section-equipements',  label: 'Équipements',  icon: Armchair },
  { id: 'section-tarification', label: 'Tarification', icon: TrendingUp },
  { id: 'section-photos',       label: 'Photos',       icon: Camera },
  { id: 'section-conditions',   label: 'Conditions',   icon: Shield },
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

const INPUT_CLS = 'w-full px-4 py-3 rounded-field border border-border bg-background-alt text-foreground placeholder:text-foreground-faint text-sm font-semibold outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-500/20 transition-all';
const INPUT_ERR = 'w-full px-4 py-3 rounded-field border border-error-500/60 bg-background-alt text-foreground placeholder:text-foreground-faint text-sm font-semibold outline-none focus:border-error-600 focus:ring-2 focus:ring-error-500/20 transition-all';

/* ─── Shared UI ───────────────────────────────────────────────────────────── */

function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-0 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3.5 px-6 py-4.5 border-b border-border/80 bg-background-alt">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
          <Icon className="w-5 h-5 text-lime-400" />
        </div>
        <p className="font-display text-base font-bold text-foreground tracking-tight">{title}</p>
      </div>
      <div className="p-6 sm:p-7 space-y-6">{children}</div>
    </div>
  );
}

function FieldLabel({ children, required, optional }: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <label className="eyebrow block mb-2 font-semibold">
      {children}
      {required && <span className="text-error-600 ml-1">*</span>}
      {optional && <span className="ml-2 text-foreground-faint normal-case font-medium text-xs">optionnel</span>}
    </label>
  );
}

function Counter({ value, onChange, min = 0, max = 30 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-border bg-background-card text-foreground-muted hover:border-forest-600 hover:text-forest-600 hover:bg-background-alt disabled:opacity-30 transition-all active:scale-90 cursor-pointer"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-8 text-center font-display font-bold text-foreground text-base tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-full border border-border bg-background-card text-foreground-muted hover:border-forest-600 hover:text-forest-600 hover:bg-background-alt disabled:opacity-30 transition-all active:scale-90 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CounterRow({ icon: Icon, label, value, onChange, min, max }: {
  icon: React.ComponentType<{ className?: string }>; label: string;
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between px-4.5 py-3.5 rounded-inner border border-border bg-background-alt hover:bg-background-card transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-foreground-muted" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <Counter value={value} onChange={onChange} min={min} max={max} />
    </div>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function SaveButton({ state, error, onSave, disabled }: { state: SaveState; error?: string | null; onSave: () => void; disabled?: boolean }) {
  const isDisabled = disabled || state === 'saving' || state === 'saved';
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-border/80">
      {error ? (
        <div className="flex items-center gap-2 text-xs text-error-600 font-semibold bg-error-50 border border-error-500/30 rounded-inner px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      ) : <div />}
      <button
        type="button"
        onClick={onSave}
        disabled={isDisabled}
        className={cn(
          'btn-action px-8 sm:px-10 py-3.5 sm:py-3 text-xs sm:text-sm font-bold min-w-full sm:min-w-[220px] justify-center cursor-pointer transition-all duration-300 shadow-action active:scale-98',
          state === 'saved' && 'bg-forest-600 text-lime-300 font-bold border border-lime-400/30 shadow-none',
          isDisabled && state !== 'saved' && 'opacity-50 cursor-not-allowed',
        )}
      >
        {state === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === 'saved' && <Check className="w-4 h-4 text-lime-300" />}
        {state === 'saved' ? 'Modifications enregistrées !' : state === 'saving' ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </button>
    </div>
  );
}

/* ─── Quality meter ───────────────────────────────────────────────────────── */

function QualityMeter({ score }: { score: number }) {
  const label = score >= 80 ? 'Excellente' : score >= 50 ? 'Bonne' : 'À optimiser';
  return (
    <div className="card p-5 space-y-3 shadow-xs">
      <p className="eyebrow block">Qualité de l&apos;annonce</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-inner bg-forest-950 border border-forest-800 text-lime-300 font-display font-extrabold text-lg flex items-center justify-center shrink-0 shadow-xs tabular-nums">
          {score}%
        </div>
        <div>
          <p className="font-display text-base font-bold text-foreground">{label}</p>
          <div className="h-2 w-28 bg-background-alt border border-border rounded-pill overflow-hidden mt-1.5">
            <div className="h-full rounded-pill bg-forest-600 transition-all duration-700" style={{ width: `${score}%` }} />
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
    <SectionCard title="Informations du logement" icon={Home}>
      {/* Type de logement */}
      <div className="space-y-3">
        <FieldLabel required>Type de logement</FieldLabel>
        <Controller name="type" control={control} render={({ field }) => (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TYPE_LOGEMENT.map((t) => {
              const { label, Icon } = TYPE_META[t];
              const active = field.value === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { field.onChange(t); setValue('sousType', ''); }}
                  className={cn(
                    'relative flex flex-col items-center gap-2.5 py-4 px-3 rounded-inner border text-xs font-semibold transition-all duration-150 cursor-pointer',
                    active
                      ? 'bg-forest-950 text-lime-300 border-forest-900 shadow-md'
                      : 'bg-background-alt text-foreground-muted border-border hover:bg-background-card hover:border-border-hover',
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-inner flex items-center justify-center transition-all',
                    active ? 'bg-forest-900 border border-lime-400/20 text-lime-400' : 'bg-background-card border border-border text-foreground-muted',
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{label}</span>
                  {active && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-lime-400 text-forest-950 flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 text-forest-950" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )} />
        {errors.type && <p className="text-xs text-error-600 font-semibold">{errors.type.message}</p>}
      </div>

      {/* Sous-type */}
      {sousTypes.length > 0 && (
        <div className="space-y-2">
          <FieldLabel required>Type précis</FieldLabel>
          <Controller name="sousType" control={control} render={({ field }) => (
            <CustomDropdown
              options={sousTypes}
              value={field.value}
              onChange={field.onChange}
              placeholder="Sélectionnez le sous-type précis"
              error={errors.sousType?.message}
              zIndex={120}
            />
          )} />
        </div>
      )}

      {/* Capacité & composition */}
      <div className="space-y-3">
        <FieldLabel>Capacité & composition</FieldLabel>
        <div className="rounded-inner border border-border overflow-hidden divide-y divide-border">
          <Controller name="capaciteMax" control={control} render={({ field }) => (
            <CounterRow icon={Users} label="Capacité d'accueil max" value={field.value ?? 1} onChange={field.onChange} min={1} max={50} />
          )} />
          <Controller name="nombrePieces" control={control} render={({ field }) => (
            <CounterRow icon={DoorOpen} label="Nombre de pièces" value={field.value ?? 1} onChange={field.onChange} min={1} max={30} />
          )} />
          <Controller name="nombreChambres" control={control} render={({ field }) => (
            <CounterRow icon={BedSingle} label="Nombre de chambres" value={field.value ?? 1} onChange={field.onChange} min={0} max={20} />
          )} />
          <Controller name="nombreSallesBain" control={control} render={({ field }) => (
            <CounterRow icon={Bath} label="Salles de bain" value={field.value ?? 1} onChange={field.onChange} min={0} max={20} />
          )} />
        </div>
      </div>

      {/* Localisation */}
      <div className="space-y-3">
        <FieldLabel required>Localisation au Sénégal</FieldLabel>
        <div className="space-y-3">
          <div>
            <label className="eyebrow block mb-1.5 text-[10px]">Zone / Région</label>
            <CustomDropdown
              options={Object.keys(ZONES_SENEGAL) as ZoneSenegal[]}
              value={selectedZone}
              onChange={(z) => {
                setSelectedZone(z as ZoneSenegal);
                setValue('ville', '', { shouldValidate: false });
              }}
              placeholder="Sélectionnez la zone"
              zIndex={150}
            />
          </div>

          {selectedZone && (
            <div>
              <label className="eyebrow block mb-1.5 text-[10px]">{selectedZone === 'Dakar' ? 'Quartier' : 'Ville / Destination'}</label>
              <Controller name="ville" control={control} render={({ field }) => (
                <CustomDropdown
                  options={destinationsInZone}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={selectedZone === 'Dakar' ? 'Sélectionnez le quartier' : 'Sélectionnez la ville'}
                  error={errors.ville?.message}
                  zIndex={300}
                  placement="top"
                />
              )} />
            </div>
          )}

          <div>
            <label className="eyebrow block mb-1.5 text-[10px]">Adresse précise</label>
            <input
              {...register('adresse')}
              placeholder="Rue, résidence ou point de repère précis"
              className={INPUT_CLS}
            />
            {errors.adresse && <p className="text-xs text-error-600 font-semibold mt-1">{errors.adresse.message}</p>}
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
    <SectionCard title="Présentation & Tarif de base" icon={Pen}>
      {/* Titre */}
      <div className="space-y-2">
        <FieldLabel required>Titre commercial de l&apos;annonce</FieldLabel>
        <input
          {...register('titre')}
          placeholder="Ex: Superbe villa avec piscine à Saly Niakh Niakhal"
          className={cn(errors.titre ? INPUT_ERR : INPUT_CLS)}
        />
        {errors.titre && <p className="text-xs text-error-600 font-semibold">{errors.titre.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <FieldLabel required>Description détaillée</FieldLabel>
        <textarea
          {...register('description')}
          rows={6}
          placeholder="Décrivez votre logement en détail : ambiance, aménagements, points forts, accès…"
          className={cn(errors.description ? INPUT_ERR : INPUT_CLS, 'resize-none leading-relaxed')}
        />
        <div className="flex justify-between items-center text-xs text-foreground-muted">
          <span>Minimum 100 caractères recommandés</span>
          <span className="tabular-nums font-semibold">{descLength} / 2000</span>
        </div>
        {errors.description && <p className="text-xs text-error-600 font-semibold">{errors.description.message}</p>}
      </div>

      {/* Prix de base */}
      <div className="space-y-2">
        <FieldLabel required>Prix de nuitée de base (FCFA)</FieldLabel>
        <div className="section-inverse p-5 relative overflow-hidden border border-forest-800 rounded-card space-y-2">
          <p className="eyebrow text-lime-300">Prix de base par nuit</p>
          <div className="flex items-center gap-3">
            <input
              {...register('prixBase', { valueAsNumber: true })}
              type="number"
              placeholder="25000"
              className="w-full text-3xl font-display font-bold text-lime-300 bg-transparent outline-none tabular-nums"
            />
            <span className="text-xs font-bold text-lime-400 bg-forest-900 border border-lime-400/20 px-3 py-1.5 rounded-pill shrink-0">FCFA / nuit</span>
          </div>
          {prix > 0 && (
            <p className="text-xs text-on-inverse-muted font-medium pt-1">
              ≈ {fcfa(prix / 655)} € par nuitée
            </p>
          )}
        </div>
        {errors.prixBase && <p className="text-xs text-error-600 font-semibold">{errors.prixBase.message}</p>}
      </div>

      {/* Durée minimum */}
      <div className="space-y-3">
        <FieldLabel>Durée minimum de séjour (Nuitées)</FieldLabel>
        <Controller name="nuitesMinimum" control={control} render={({ field }) => (
          <div className="space-y-3">
            <div className="flex items-center gap-4 px-5 py-4 bg-background-alt rounded-inner border border-border">
              <button
                type="button"
                onClick={() => field.onChange(Math.max(1, (field.value ?? 1) - 1))}
                disabled={(field.value ?? 1) <= 1}
                className="w-10 h-10 rounded-full bg-background-card border border-border flex items-center justify-center text-foreground-muted hover:text-foreground disabled:opacity-30 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-display font-bold text-foreground tabular-nums">{field.value ?? 1}</span>
                <p className="eyebrow text-[10px] mt-0.5">Nuit{(field.value ?? 1) > 1 ? 's' : ''} minimum</p>
              </div>
              <button
                type="button"
                onClick={() => field.onChange(Math.min(365, (field.value ?? 1) + 1))}
                disabled={(field.value ?? 1) >= 365}
                className="w-10 h-10 rounded-full bg-background-card border border-border flex items-center justify-center text-foreground-muted hover:text-foreground disabled:opacity-30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {([1, 2, 3, 7, 14, 30] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => field.onChange(n)}
                  className={cn(
                    'py-2.5 rounded-pill text-xs font-semibold border transition-all cursor-pointer',
                    field.value === n
                      ? 'bg-forest-600 border-forest-600 text-lime-300 font-bold shadow-xs'
                      : 'border-border bg-background-alt text-foreground-muted hover:bg-background-card',
                  )}
                >
                  {n === 1 ? '1 nuit' : n === 7 ? '1 sem.' : n === 14 ? '2 sem.' : n === 30 ? '1 mois' : `${n} nuits`}
                </button>
              ))}
            </div>
          </div>
        )} />
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
      {catalogueError && (
        <div className="flex items-center gap-2 text-xs text-error-600 bg-error-50 border border-error-500/30 rounded-inner px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Impossible de charger le catalogue des équipements.
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="badge-verified">
          <Check className="w-3.5 h-3.5 text-gold-600" />
          {selected.size} équipement{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
        </span>
        {!catalogue && !catalogueError && (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground-muted">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Chargement…
          </span>
        )}
      </div>

      <div className="space-y-5">
        {Object.entries(EQUIPEMENTS_PAR_CATEGORIE).map(([cat, items]) => {
          const Icon = CAT_ICONS[cat] ?? Tag;
          return (
            <div key={cat} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-inner bg-forest-950 text-lime-400 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="eyebrow text-foreground">{CATEGORIE_EQUIPEMENT_LABELS[cat]}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(items as readonly string[]).map((nom) => {
                  const active = selected.has(nom);
                  return (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => toggle(nom)}
                      className={cn(
                        'flex items-center gap-2 px-3.5 py-2 rounded-pill text-xs font-semibold border transition-all cursor-pointer',
                        active
                          ? 'bg-forest-600 border-forest-600 text-lime-300 font-bold shadow-xs'
                          : 'bg-background-alt border-border text-foreground-muted hover:bg-background-card hover:text-foreground',
                      )}
                    >
                      {active && <Check className="w-3.5 h-3.5 text-lime-300" />}
                      <span>{nom}</span>
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
    <SectionCard title="Règles & Conditions d'accueil" icon={Shield}>
      <div>
        <FieldLabel optional>Règles intérieures de la maison</FieldLabel>
        <textarea
          value={reglesMaison}
          onChange={(e) => setReglesMaison(e.target.value.slice(0, MAX))}
          rows={5}
          placeholder={`Ex :\n• Pas de soirées ou fêtes bruyantes\n• Animaux domestiques non admis\n• Interdiction de fumer à l'intérieur\n• Respect du voisinage après 22h`}
          className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
        />
        <div className="flex justify-between items-center px-1 mt-1.5 text-xs text-foreground-muted">
          <span>Affiché clairement aux voyageurs avant réservation</span>
          <span className="tabular-nums font-semibold">{reglesMaison.length} / {MAX}</span>
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
    const initialCount = photos.length;
    let addedIndex = 0;

    for (const file of toAdd) {
      const isFirstPhoto = initialCount === 0 && addedIndex === 0;
      addedIndex++;

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);
      const tempPhoto: LocalPhoto = {
        id: tempId, url: previewUrl, publicId: '',
        categorie: newCategory, estPrincipale: isFirstPhoto,
        position: initialCount + addedIndex - 1, uploading: true,
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

        const saved = await nestFetch<ListingPhoto>(NEST_API.LISTINGS.ADD_PHOTO(listing.id), {
          method: 'POST',
          body: JSON.stringify({
            url: upData.secure_url, publicId: upData.public_id,
            categorie: newCategory, estPrincipale: isFirstPhoto, position: initialCount + addedIndex - 1,
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
    <SectionCard title={`Galerie Photos (${photos.length}/10)`} icon={Camera}>
      {globalError && (
        <div className="flex items-center gap-2 text-xs text-error-600 bg-error-50 border border-error-500/30 rounded-inner px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {globalError}
        </div>
      )}

      {photos.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  'group relative aspect-16/10 sm:aspect-4/3 rounded-inner overflow-hidden border-2 bg-background-alt transition-all shadow-xs flex flex-col justify-end',
                  photo.estPrincipale ? 'border-gold-400 ring-2 ring-gold-400/20 shadow-md' : 'border-border',
                )}
              >
                <Image
                  src={photo.url} alt={photo.categorie} fill
                  className={cn('object-cover transition-all duration-200', photo.uploading && 'opacity-50')}
                  sizes="(max-width: 640px) 100vw, 25vw"
                />

                {photo.estPrincipale && (
                  <div className="absolute top-2.5 left-2.5 badge-verified shadow-md z-10">
                    <Star className="w-3.5 h-3.5 text-gold-600 fill-gold-600" />
                    <span className="font-bold">Couverture</span>
                  </div>
                )}

                {photo.uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                    <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
                  </div>
                )}

                {/* Overlays / Action Bar (Persistent sur mobile, hover sur desktop) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5 z-10">
                  {!photo.estPrincipale ? (
                    <button
                      type="button"
                      onClick={() => setMainPhoto(photo)}
                      disabled={settingMain === photo.id}
                      className="px-3 py-1.5 rounded-pill bg-lime-400 text-forest-950 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <Star className="w-3.5 h-3.5 fill-forest-950 text-forest-950" />
                      <span>Définir couverture</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-lime-300 bg-forest-950/80 px-2.5 py-1 rounded-pill backdrop-blur-sm border border-forest-800">
                      Photo principale
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => deletePhoto(photo)}
                    className="w-8 h-8 rounded-full bg-error-600 text-white hover:bg-error-700 cursor-pointer shadow-md flex items-center justify-center shrink-0 active:scale-95 transition-transform ml-auto"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3 bg-background-alt rounded-inner border border-dashed border-border text-center">
          <ImageOff className="w-8 h-8 text-foreground-muted" />
          <p className="text-xs font-semibold text-foreground-muted">Aucune photo ajoutée pour l&apos;instant</p>
        </div>
      )}

      {canAdd && (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-field border-2 border-dashed border-border bg-background-alt hover:border-forest-600 hover:bg-background-card text-foreground font-semibold text-xs transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-forest-600" />
            <span>Ajouter de nouvelles photos ({10 - photos.length} restantes)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
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
    setTarifsNuits((prev) => [...prev, { nuitsMin: Math.max(listing.nuitesMinimum + 1, nextMin), nuitsMax: null, prix: Math.round(listing.prixBase * 0.9) }]);
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
    <SectionCard title="Tarification dynamique & Paliers" icon={TrendingUp}>
      <div className="section-inverse p-5 border border-forest-800 rounded-card space-y-1">
        <p className="eyebrow text-lime-300">Prix de base par nuit</p>
        <p className="text-2xl sm:text-3xl font-display font-bold text-lime-300 tabular-nums">
          {fcfa(listing.prixBase)} FCFA <span className="text-xs text-on-inverse-muted font-normal">/ nuit (couvre {listing.personnesBase} pers.)</span>
        </p>
      </div>

      {/* Paliers Suppléments Voyageurs */}
      <div className="space-y-3 pt-2">
        <div className="p-3.5 rounded-inner bg-forest-950 border border-forest-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-inner bg-forest-900 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-lime-400" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-lime-300">Suppléments par voyageur additionnel</p>
              <p className="text-[11px] text-on-inverse-muted font-medium">Au-delà de {listing.personnesBase} personne{listing.personnesBase > 1 ? 's' : ''} incluse{listing.personnesBase > 1 ? 's' : ''}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-lime-300 bg-forest-900 border border-lime-400/20 px-2.5 py-1 rounded-pill hidden sm:inline-block">
            Optionnel
          </span>
        </div>

        {tarifsPersonnes.length > 0 ? (
          <div className="space-y-3">
            {tarifsPersonnes.map((t, i) => (
              <div key={i} className="p-3.5 sm:p-4 rounded-inner bg-background-alt border border-border space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <span className="badge-verified text-xs">
                    <Users className="w-3.5 h-3.5 text-gold-600" />
                    <span>Palier #{i + 1} ({t.personnesMin} à {t.personnesMax} pers.)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTarifPersonne(i)}
                    className="w-8 h-8 rounded-full bg-background-card border border-border text-error-600 hover:bg-error-50 flex items-center justify-center cursor-pointer transition-colors"
                    title="Supprimer ce palier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="eyebrow block text-[10px] mb-1">Pers. min</label>
                    <input
                      type="number"
                      min={listing.personnesBase + 1}
                      value={t.personnesMin}
                      onChange={(e) => updateTarifPersonne(i, { personnesMin: +e.target.value })}
                      className="w-full px-3 py-2 rounded-field border border-border bg-background-card text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block text-[10px] mb-1">Pers. max</label>
                    <input
                      type="number"
                      min={t.personnesMin}
                      value={t.personnesMax}
                      onChange={(e) => updateTarifPersonne(i, { personnesMax: +e.target.value })}
                      className="w-full px-3 py-2 rounded-field border border-border bg-background-card text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block text-[10px] mb-1">Supplément (FCFA / nuit)</label>
                    <input
                      type="number"
                      value={t.supplement}
                      onChange={(e) => updateTarifPersonne(i, { supplement: +e.target.value })}
                      className="w-full px-3 py-2 rounded-field border border-border bg-background-card text-foreground font-bold tabular-nums"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-foreground-muted italic bg-background-alt p-3 rounded-inner border border-border">
            Aucun supplément voyageur configuré. Les personnes supplémentaires voyageront gratuitement.
          </p>
        )}

        <button
          type="button"
          onClick={addTarifPersonne}
          className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-pill bg-forest-950 hover:bg-forest-900 border border-forest-800 text-lime-300 text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-lime-400" />
          <span>Ajouter un palier de personnes</span>
        </button>
      </div>

      {/* Paliers Longs Séjours */}
      <div className="space-y-3 pt-5 border-t border-border/80">
        <div className="p-3.5 rounded-inner bg-forest-950 border border-forest-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-inner bg-forest-900 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-lime-400" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-lime-300">Réductions longs séjours</p>
              <p className="text-[11px] text-on-inverse-muted font-medium">Tarifs réduits à partir de {listing.nuitesMinimum + 1} nuits</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-lime-300 bg-forest-900 border border-lime-400/20 px-2.5 py-1 rounded-pill hidden sm:inline-block">
            Optionnel
          </span>
        </div>

        {tarifsNuits.length > 0 ? (
          <div className="space-y-3">
            {tarifsNuits.map((t, i) => (
              <div key={i} className="p-3.5 sm:p-4 rounded-inner bg-background-alt border border-border space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <span className="badge-verified text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-gold-600" />
                    <span>Séjour de {t.nuitsMin} {t.nuitsMax ? `à ${t.nuitsMax}` : '+'} nuits</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTarifNuit(i)}
                    className="w-8 h-8 rounded-full bg-background-card border border-border text-error-600 hover:bg-error-50 flex items-center justify-center cursor-pointer transition-colors"
                    title="Supprimer ce palier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="eyebrow block text-[10px] mb-1">Nuits min</label>
                    <input
                      type="number"
                      min={listing.nuitesMinimum + 1}
                      value={t.nuitsMin}
                      onChange={(e) => updateTarifNuit(i, { nuitsMin: +e.target.value })}
                      className="w-full px-3 py-2 rounded-field border border-border bg-background-card text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block text-[10px] mb-1">Nuits max (Optionnel)</label>
                    <input
                      type="number"
                      value={t.nuitsMax ?? ''}
                      placeholder="Illimité (∞)"
                      onChange={(e) => updateTarifNuit(i, { nuitsMax: e.target.value ? +e.target.value : null })}
                      className="w-full px-3 py-2 rounded-field border border-border bg-background-card text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="eyebrow block text-[10px] mb-1">Prix réduit (FCFA / nuit)</label>
                    <input
                      type="number"
                      value={t.prix}
                      onChange={(e) => updateTarifNuit(i, { prix: +e.target.value })}
                      className="w-full px-3 py-2 rounded-field border border-border bg-background-card text-foreground font-bold tabular-nums"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-foreground-muted italic bg-background-alt p-3 rounded-inner border border-border">
            Aucun palier de réduction configuré.
          </p>
        )}

        <button
          type="button"
          onClick={addTarifNuit}
          className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-pill bg-forest-950 hover:bg-forest-900 border border-forest-800 text-lime-300 text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 text-lime-400" />
          <span>Ajouter un palier de nuitées</span>
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
    <div className="space-y-6 pb-16">
      {/* Hero Banner en section-inverse ImmoLoc v2 */}
      <div className="section-inverse p-6 sm:p-8 relative overflow-hidden border border-forest-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link
            href={`/dashboard/annonces/${listing.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-forest-900/90 hover:bg-forest-800 border border-lime-400/20 hover:border-lime-400/40 text-lime-300 font-semibold text-xs transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-lime-400" />
            <span>Retour aux détails</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/annonces/${listing.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-forest-900/90 hover:bg-forest-800 border border-lime-400/20 hover:border-lime-400/40 text-lime-300 font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Eye className="w-4 h-4 text-lime-400" />
              <span>Aperçu</span>
            </Link>
            <ListingStatusBadge statut={listing.statut} size="sm" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="eyebrow text-lime-300">Édition de votre bien</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-inverse-display tracking-tight">
            {listing.titre}
          </h1>
          <p className="text-xs sm:text-sm text-on-inverse-muted">{listing.adresse}, {listing.ville}</p>
        </div>

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <span className="btn-action text-xs px-4 py-1.5 shadow-action tabular-nums">
            <TrendingUp className="w-3.5 h-3.5" />
            {fcfa(listing.prixBase)} FCFA / nuit
          </span>
          <span className="px-3.5 py-1.5 rounded-pill bg-forest-800 border border-border-inverse text-xs font-semibold text-lime-300">
            Qualité {quality}%
          </span>
        </div>
      </div>

      {/* Layout principal avec Sidebar et Sections */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="hidden lg:block w-64 shrink-0 space-y-4 sticky top-6">
          <QualityMeter score={quality} />
          <div className="card p-3 rounded-card border border-border shadow-xs space-y-1">
            <p className="eyebrow px-3 py-1.5 block">Navigation Rapide</p>
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-inner text-xs font-semibold text-foreground-muted hover:text-foreground hover:bg-background-alt transition-colors"
              >
                <Icon className="w-4 h-4 text-forest-600" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full space-y-6">
          <div id="section-bien" className="scroll-mt-6"><SectionBien listing={listing} /></div>
          <div id="section-presentation" className="scroll-mt-6"><SectionPresentation listing={listing} /></div>
          <div id="section-equipements" className="scroll-mt-6"><SectionEquipements listing={listing} /></div>
          <div id="section-tarification" className="scroll-mt-6"><SectionTarification listing={listing} /></div>
          <div id="section-photos" className="scroll-mt-6"><SectionPhotos listing={listing} /></div>
          <div id="section-conditions" className="scroll-mt-6"><SectionConditions listing={listing} /></div>
        </div>
      </div>
    </div>
  );
}
