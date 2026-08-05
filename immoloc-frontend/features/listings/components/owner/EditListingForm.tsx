'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle, ArrowLeft, Armchair, Bath, BedDouble, BedSingle, Building2,
  Camera, Check, ChevronDown, DoorOpen, Eye, Home, ImageOff, Key, Loader2, MapPin, Minus,
  Pen, Plus, Shield, Smartphone, Star, Trash2, TreePine, TrendingUp, Upload, Users, Wifi, X, Zap,
} from 'lucide-react';
import {
  stepBienSchema, type StepBienInput,
  stepAnnonceSchema, type StepAnnonceInput,
  TYPE_LOGEMENT, SOUS_TYPES_PAR_CATEGORIE, ZONES_SENEGAL,
  EQUIPEMENTS_PAR_CATEGORIE, CATEGORIE_EQUIPEMENT_LABELS,
  CATEGORIE_PHOTO, getZoneFromVille, type ZoneSenegal,
} from '@/schemas/listing.schema';
import type { ListingDetail, TarifPersonne, TarifNuit } from '@/lib/nestjs/types';
import { ListingStatusBadge } from '@/features/listings/components/listing-status-badge';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';
import { CounterRow, FieldError, FieldLabel, INPUT_CLS, INPUT_ERR, SectionCard } from '../wizard/wizard-ui';
import { SelectField } from '../wizard/select-field';
import { usePhotoUpload, MAX_PHOTOS, MAX_FILE_MB, type LocalPhoto } from './use-photo-upload';
import { QualityPanel, computeQuality } from './listing-quality';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const XOF_PER_EUR = 655.957;   // etait 655 : le franc CFA est arrime a 655,957

const TYPE_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  APPARTEMENT: { label: 'Appartement', Icon: Building2 },
  VILLA: { label: 'Villa', Icon: TreePine },
  CHAMBRE: { label: 'Chambre', Icon: BedDouble },
  AUTRES: { label: 'Autres', Icon: Home },
};

const CAT_PHOTO_LABELS: Record<string, string> = {
  SALON: 'Salon', CHAMBRE: 'Chambre', CUISINE: 'Cuisine', SALLE_DE_BAIN: 'Salle d’eau',
  TERRASSE: 'Terrasse', VUE: 'Vue', ENTREE: 'Entrée', PISCINE: 'Piscine', AUTRE: 'Autre',
};

const NAV_SECTIONS = [
  { id: 'section-bien', label: 'Logement', icon: Home },
  { id: 'section-presentation', label: 'Présentation', icon: Pen },
  { id: 'section-equipements', label: 'Équipements', icon: Armchair },
  { id: 'section-tarification', label: 'Tarification', icon: TrendingUp },
  { id: 'section-photos', label: 'Photos', icon: Camera },
  { id: 'section-conditions', label: 'Conditions', icon: Shield },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════
   Garde de modifications non enregistrees.

   Six sections, six boutons « Enregistrer » independants : quitter la page
   avec une section modifiee perdait tout, en silence. Chaque section declare
   son etat au registre ; la page previent avant fermeture et affiche un
   bandeau persistant.

   Limite connue : l'App Router n'expose pas d'API pour bloquer une navigation
   interne. beforeunload couvre la fermeture d'onglet et le rechargement ; le
   bandeau couvre le reste.
   ═══════════════════════════════════════════════════════════════════════════ */

function useDirtyRegistry() {
  const [dirty, setDirty] = useState<Set<string>>(new Set());

  const report = useCallback((id: string, isDirty: boolean) => {
    setDirty((prev) => {
      if (isDirty === prev.has(id)) return prev;
      const next = new Set(prev);
      if (isDirty) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (dirty.size === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty.size]);

  return { dirtyCount: dirty.size, report };
}

/* ─── Bouton d'enregistrement ─────────────────────────────────────────────── */

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function SaveBar({ state, error, onSave, disabled, dirty }: {
  state: SaveState; error?: string | null; onSave: () => void;
  disabled?: boolean; dirty?: boolean;
}) {
  const busy = state === 'saving';
  return (
    <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
      <div className="min-w-0">
        {error ? (
          <p role="alert" className="flex items-center gap-2 rounded-inner bg-error-50 px-3.5 py-2.5 text-xs text-error-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : state === 'saved' ? (
          <p role="status" className="flex items-center gap-2 text-xs font-medium text-success-700">
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            Modifications enregistrées
          </p>
        ) : dirty ? (
          <p className="text-xs text-warning-700">Modifications non enregistrées</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={busy || disabled}
        /* L'etat « saved » repassait le bouton en bg-forest-600 text-lime-300 :
           l'accent portait du texte, et le bouton changeait de couleur pour
           dire « c'est fait » alors qu'un message suffit. */
        className="flex shrink-0 items-center justify-center gap-2 rounded-pill bg-forest-600 px-8 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-700 disabled:opacity-50 sm:min-w-[200px]"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {busy ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  );
}

/* ─── Section Logement ────────────────────────────────────────────────────── */

function SectionBien({ listing, report }: { listing: ListingDetail; report: (id: string, d: boolean) => void }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const adresseId = useId();
  const groupId = useId();

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isDirty } } =
    useForm<StepBienInput>({
      resolver: zodResolver(stepBienSchema),
      defaultValues: {
        type: listing.type, sousType: listing.sousType ?? '',
        nombreChambres: listing.nombreChambres, nombreSallesBain: listing.nombreSallesBain,
        nombrePieces: listing.nombrePieces, capaciteMax: listing.capaciteMax,
        ville: listing.ville, adresse: listing.adresse,
        latitude: listing.latitude ?? undefined, longitude: listing.longitude ?? undefined,
      },
    });

  useEffect(() => { report('bien', isDirty); }, [isDirty, report]);

  const selectedType = watch('type');
  const sousTypes = selectedType ? (SOUS_TYPES_PAR_CATEGORIE[selectedType] as readonly string[]) : [];
  const [zone, setZone] = useState<ZoneSenegal | ''>(() => getZoneFromVille(listing.ville) ?? '');
  const villes = zone ? (ZONES_SENEGAL[zone] as readonly string[]) : [];

  async function onSave(data: StepBienInput) {
    setState('saving'); setApiError(null);
    try {
      await nestFetch(NEST_API.LISTINGS.UPDATE(listing.id), { method: 'PATCH', body: JSON.stringify(data) });
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); report('bien', false); setTimeout(() => setState('idle'), 2500);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Informations du logement" icon={Home}>
      <div>
        <span id={groupId} className="mb-2 block text-sm font-medium text-foreground">
          Type de logement <span className="ml-1 text-error-600" aria-hidden="true">*</span>
        </span>
        <Controller name="type" control={control} render={({ field }) => (
          // Quatre choix exclusifs : de vrais boutons radio, pas des <button>.
          <div role="radiogroup" aria-labelledby={groupId} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TYPE_LOGEMENT.map((t) => {
              const { label, Icon } = TYPE_META[t];
              const active = field.value === t;
              return (
                <label key={t} className={cn(
                  'flex cursor-pointer flex-col items-center gap-2.5 rounded-inner border px-3 py-4 text-center transition-colors duration-150',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                  active ? 'border-forest-600 bg-forest-100' : 'border-border bg-background-card hover:border-border-hover',
                )}>
                  <input
                    type="radio" name="type-logement" value={t} checked={active}
                    onChange={() => { field.onChange(t); setValue('sousType', '', { shouldDirty: true }); }}
                    className="sr-only"
                  />
                  <span className={cn(
                    'grid h-10 w-10 place-items-center rounded-inner transition-colors duration-150',
                    active ? 'bg-forest-600 text-white' : 'bg-neutral-100 text-foreground-muted',
                  )}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={cn('text-xs font-medium', active ? 'text-forest-800' : 'text-foreground-muted')}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        )} />
        <FieldError>{errors.type?.message}</FieldError>
      </div>

      {sousTypes.length > 0 && (
        <Controller name="sousType" control={control} render={({ field }) => (
          <SelectField
            label="Type précis" required options={sousTypes}
            value={field.value ?? ''} onChange={field.onChange}
            placeholder="Sélectionnez le sous-type" error={errors.sousType?.message}
          />
        )} />
      )}

      <div>
        <FieldLabel>Capacité et composition</FieldLabel>
        <div className="divide-y divide-border overflow-hidden rounded-inner border border-border">
          <Controller name="capaciteMax" control={control} render={({ field }) => (
            <CounterRow icon={Users} label="Capacité d'accueil" value={field.value ?? 1} onChange={field.onChange} min={1} max={50} />
          )} />
          <Controller name="nombrePieces" control={control} render={({ field }) => (
            <CounterRow icon={DoorOpen} label="Nombre de pièces" value={field.value ?? 1} onChange={field.onChange} min={1} max={30} />
          )} />
          <Controller name="nombreChambres" control={control} render={({ field }) => (
            <CounterRow icon={BedSingle} label="Nombre de chambres" value={field.value ?? 1} onChange={field.onChange} min={0} max={20} />
          )} />
          <Controller name="nombreSallesBain" control={control} render={({ field }) => (
            <CounterRow icon={Bath} label="Salles d'eau" value={field.value ?? 1} onChange={field.onChange} min={0} max={20} />
          )} />
        </div>
      </div>

      <SelectField
        label="Zone ou région" required
        options={Object.keys(ZONES_SENEGAL) as ZoneSenegal[]}
        value={zone}
        onChange={(z) => { setZone(z as ZoneSenegal); setValue('ville', '', { shouldDirty: true }); }}
        placeholder="Sélectionnez la zone"
      />

      {zone && (
        <Controller name="ville" control={control} render={({ field }) => (
          <SelectField
            label={zone === 'Dakar' ? 'Quartier' : 'Ville ou destination'} required
            options={villes} value={field.value ?? ''} onChange={field.onChange}
            placeholder="Sélectionnez" error={errors.ville?.message}
          />
        )} />
      )}

      <div>
        <FieldLabel htmlFor={adresseId} required>Adresse précise & Position GPS</FieldLabel>
        <input
          {...register('adresse')} id={adresseId} autoComplete="street-address"
          placeholder="Rue, résidence ou point de repère"
          aria-invalid={!!errors.adresse}
          className={errors.adresse ? INPUT_ERR : INPUT_CLS}
        />
        <FieldError>{errors.adresse?.message}</FieldError>

        {/* Bouton de Capture GPS */}
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setValue('latitude', pos.coords.latitude, { shouldDirty: true });
                    setValue('longitude', pos.coords.longitude, { shouldDirty: true });
                  },
                  (err) => alert('Impossible d\'obtenir la géolocalisation: ' + err.message)
                );
              }
            }}
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-forest-800 transition-colors hover:bg-neutral-100 cursor-pointer"
          >
            <MapPin className="h-4 w-4 text-forest-600" aria-hidden="true" />
            <span>Capturer ma position GPS</span>
          </button>
          {watch('latitude') != null && watch('longitude') != null && !isNaN(Number(watch('latitude'))) && (
            <span className="text-xs font-medium text-forest-800">
              Coordonnées : {Number(watch('latitude')).toFixed(5)}, {Number(watch('longitude')).toFixed(5)}
            </span>
          )}
        </div>
      </div>

      <SaveBar state={state} error={apiError} dirty={isDirty} onSave={handleSubmit(onSave)} />
    </SectionCard>
  );
}

/* ─── Section Présentation ────────────────────────────────────────────────── */

function SectionPresentation({ listing, report }: { listing: ListingDetail; report: (id: string, d: boolean) => void }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const ids = { titre: useId(), desc: useId(), prix: useId() };

  const { register, control, handleSubmit, watch, formState: { errors, isDirty } } =
    useForm<StepAnnonceInput>({
      resolver: zodResolver(stepAnnonceSchema),
      defaultValues: {
        titre: listing.titre, description: listing.description,
        prixBase: listing.prixBase, nuitesMinimum: listing.nuitesMinimum,
        isInstantBooking: listing.isInstantBooking ?? false,
      },
    });

  useEffect(() => { report('presentation', isDirty); }, [isDirty, report]);

  const descLength = watch('description')?.length ?? 0;
  const prix = watch('prixBase') ?? 0;

  async function onSave(data: StepAnnonceInput) {
    setState('saving'); setApiError(null);
    try {
      await nestFetch(NEST_API.LISTINGS.UPDATE(listing.id), { method: 'PATCH', body: JSON.stringify(data) });
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); report('presentation', false); setTimeout(() => setState('idle'), 2500);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Présentation et tarif de base" icon={Pen}>
      <div>
        <FieldLabel htmlFor={ids.titre} required>Titre de l&apos;annonce</FieldLabel>
        <input
          {...register('titre')} id={ids.titre} maxLength={80}
          placeholder="Ex : Villa avec piscine à Saly, vue mer"
          aria-invalid={!!errors.titre}
          className={errors.titre ? INPUT_ERR : INPUT_CLS}
        />
        <FieldError>{errors.titre?.message}</FieldError>
      </div>

      <div>
        <FieldLabel htmlFor={ids.desc} required>Description</FieldLabel>
        <textarea
          {...register('description')} id={ids.desc} rows={6} maxLength={2000}
          placeholder="Ambiance, aménagements, points forts, accès…"
          aria-invalid={!!errors.description}
          className={cn(errors.description ? INPUT_ERR : INPUT_CLS, 'resize-none leading-relaxed')}
        />
        <div className="mt-1.5 flex items-center justify-between text-xs text-foreground-muted">
          <span>{descLength < 100 ? '100 caractères minimum recommandés' : 'Bonne longueur'}</span>
          <span className={cn('tabular-nums', descLength > 1900 && 'text-warning-600')}>{descLength} / 2000</span>
        </div>
        <FieldError>{errors.description?.message}</FieldError>
      </div>

      <div>
        <FieldLabel htmlFor={ids.prix} required>Prix par nuit</FieldLabel>
        <div className="section-inverse rounded-card p-5">
          <p className="eyebrow">Prix de base</p>
          <Controller name="prixBase" control={control} render={({ field }) => (
            <div className="mt-2 flex items-center gap-3">
              {/* type="number" laissait la molette modifier le prix au scroll
                  et n'affichait aucun separateur de milliers. */}
              <input
                id={ids.prix} type="text" inputMode="numeric" autoComplete="off"
                value={field.value ? nf.format(field.value) : ''}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, '');
                  field.onChange(d ? Number(d) : undefined);
                }}
                placeholder="25 000"
                className="w-full bg-transparent font-display text-3xl font-semibold tabular-nums text-neutral-50 outline-none placeholder:text-forest-300"
              />
              <span className="shrink-0 rounded-pill bg-lime-400/15 px-3 py-1.5 text-xs font-semibold text-lime-400">
                FCFA / nuit
              </span>
            </div>
          )} />
          {prix > 0 && (
            <p className="mt-2 text-xs text-forest-200">
              Environ {nf.format(prix / XOF_PER_EUR)} € par nuit
            </p>
          )}
        </div>
        <FieldError>{errors.prixBase?.message}</FieldError>
      </div>

      <Controller name="nuitesMinimum" control={control} render={({ field }) => {
        const v = field.value ?? 1;
        const btn = 'grid h-11 w-11 place-items-center rounded-pill border border-border bg-background-card text-foreground-muted transition-colors duration-150 hover:border-forest-500 hover:text-forest-700 disabled:pointer-events-none disabled:opacity-30';
        return (
          <div>
            <FieldLabel>Durée minimale de séjour</FieldLabel>
            <div className="flex items-center gap-4 rounded-inner border border-border bg-background-alt px-5 py-4">
              <button type="button" onClick={() => field.onChange(Math.max(1, v - 1))} disabled={v <= 1} aria-label="Diminuer" className={btn}>
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex-1 text-center">
                <span aria-live="polite" className="block font-display text-3xl font-semibold tabular-nums text-forest-900">{v}</span>
                <span className="mt-0.5 block text-xs text-foreground-muted">nuit{v > 1 ? 's' : ''} minimum</span>
              </div>
              <button type="button" onClick={() => field.onChange(Math.min(365, v + 1))} disabled={v >= 365} aria-label="Augmenter" className={btn}>
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      }} />

      {/* Switch Fast Booking / Réservation Instantanée */}
      <Controller
        name="isInstantBooking"
        control={control}
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-inner border border-border bg-background-alt p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-inner bg-forest-100 text-forest-700">
                <Zap className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Réservation Instantanée
                </p>
                <p className="text-xs text-foreground-muted">
                  Les voyageurs vérifiés réservent immédiatement sans attente de validation.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!!field.value}
              onClick={() => field.onChange(!field.value)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ml-4',
                field.value ? 'bg-forest-600' : 'bg-neutral-300'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  field.value ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        )}
      />

      <SaveBar state={state} error={apiError} dirty={isDirty} onSave={handleSubmit(onSave)} />
    </SectionCard>
  );
}

/* ─── Section Équipements ─────────────────────────────────────────────────── */

function SectionEquipements({ listing, report }: { listing: ListingDetail; report: (id: string, d: boolean) => void }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const initial = useMemo(() => new Set(listing.equipements.map((e) => e.nom)), [listing.equipements]);
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [catalogue, setCatalogue] = useState<{ id: string; nom: string }[] | null>(null);
  const [catalogueError, setCatalogueError] = useState(false);

  const isDirty = selected.size !== initial.size || [...selected].some((n) => !initial.has(n));
  useEffect(() => { report('equipements', isDirty); }, [isDirty, report]);

  const load = useCallback(async () => {
    setCatalogueError(false);
    try {
      setCatalogue(await nestFetch(NEST_API.LISTINGS.LIST_EQUIPEMENTS, { method: 'GET' }));
    } catch { setCatalogueError(true); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function onSave() {
    if (!catalogue) return;
    setState('saving'); setApiError(null);
    try {
      const ids = catalogue.filter((e) => selected.has(e.nom)).map((e) => e.id);
      await nestFetch(NEST_API.LISTINGS.SET_EQUIPEMENTS(listing.id), {
        method: 'PUT', body: JSON.stringify({ equipementIds: ids }),
      });
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); setTimeout(() => setState('idle'), 2500);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Équipements et services" icon={Armchair}>
      {catalogueError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-inner bg-warning-50 px-4 py-3">
          <p className="text-sm text-warning-700">Le catalogue n&apos;a pas pu être chargé.</p>
          <button type="button" onClick={load} className="rounded-pill border border-warning-500/30 bg-background-card px-3 py-1.5 text-xs font-semibold text-warning-700">
            Réessayer
          </button>
        </div>
      )}

      <p className="text-sm text-foreground-muted" aria-live="polite">
        <span className="font-semibold tabular-nums text-forest-900">{selected.size}</span> sélectionné{selected.size > 1 ? 's' : ''}
        {!catalogue && !catalogueError && <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      </p>

      <div className="space-y-5">
        {Object.entries(EQUIPEMENTS_PAR_CATEGORIE).map(([cat, items]) => (
          <fieldset key={cat}>
            <legend className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
              {CATEGORIE_EQUIPEMENT_LABELS[cat]}
            </legend>
            <div className="flex flex-wrap gap-2">
              {(items as readonly string[]).map((nom) => {
                const active = selected.has(nom);
                return (
                  // De vraies cases a cocher : un <button> etait annonce
                  // « bouton » au lieu de « case a cocher, cochee ».
                  <label key={nom} className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-pill border px-3.5 py-2 text-sm transition-colors duration-150',
                    'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                    active
                      ? 'border-forest-600 bg-forest-100 font-medium text-forest-800'
                      : 'border-border bg-background-card text-foreground-muted hover:border-border-hover hover:text-foreground',
                  )}>
                    <input
                      type="checkbox" checked={active} className="sr-only"
                      onChange={() => setSelected((p) => {
                        const n = new Set(p);
                        if (n.has(nom)) n.delete(nom); else n.add(nom);
                        return n;
                      })}
                    />
                    {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    {nom}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <SaveBar state={state} error={apiError} dirty={isDirty} onSave={onSave} disabled={!catalogue} />
    </SectionCard>
  );
}

/* ─── Section Tarification ────────────────────────────────────────────────── */

function SectionTarification({ listing, report }: { listing: ListingDetail; report: (id: string, d: boolean) => void }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [nuits, setNuits] = useState<TarifNuit[]>(listing.tarifsNuits);
  const [personnes, setPersonnes] = useState<TarifPersonne[]>(listing.tarifsPersonnes);
  const [acomptePct, setAcomptePct] = useState<number>(listing.acomptePourcentage ?? 30);
  const [derniereMinActive, setDerniereMinActive] = useState<boolean>(listing.derniereMinuteActive ?? false);

  const isDirty =
    JSON.stringify(nuits) !== JSON.stringify(listing.tarifsNuits) ||
    JSON.stringify(personnes) !== JSON.stringify(listing.tarifsPersonnes) ||
    acomptePct !== (listing.acomptePourcentage ?? 30) ||
    derniereMinActive !== (listing.derniereMinuteActive ?? false);

  useEffect(() => { report('tarification', isDirty); }, [isDirty, report]);

  const errNuits = useMemo(() => nuits.map((t, i) => {
    if (t.nuitsMin < listing.nuitesMinimum + 1) return `Doit démarrer à ${listing.nuitesMinimum + 1} nuits minimum.`;
    if (t.nuitsMax != null && t.nuitsMax < t.nuitsMin) return 'Le maximum est inférieur au minimum.';
    if (!t.prix || t.prix >= listing.prixBase) return `Doit être inférieur au prix de base (${nf.format(listing.prixBase)} FCFA).`;
    const overlap = nuits.some((o, j) => j !== i && t.nuitsMin <= (o.nuitsMax ?? Infinity) && (t.nuitsMax ?? Infinity) >= o.nuitsMin);
    return overlap ? 'Ce palier en chevauche un autre.' : null;
  }), [nuits, listing.nuitesMinimum, listing.prixBase]);

  const errPers = useMemo(() => personnes.map((t, i) => {
    if (t.personnesMin < listing.personnesBase + 1) return `Doit démarrer à ${listing.personnesBase + 1} personnes.`;
    if (t.personnesMax < t.personnesMin) return 'Le maximum est inférieur au minimum.';
    if (!t.supplement || t.supplement <= 0) return 'Indiquez un supplément positif.';
    const overlap = personnes.some((o, j) => j !== i && t.personnesMin <= o.personnesMax && t.personnesMax >= o.personnesMin);
    return overlap ? 'Ce palier en chevauche un autre.' : null;
  }), [personnes, listing.personnesBase]);

  const hasErrors = [...errNuits, ...errPers].some(Boolean);

  async function onSave() {
    if (hasErrors) return;
    setState('saving'); setApiError(null);
    try {
      await Promise.all([
        nestFetch(NEST_API.LISTINGS.SET_TARIFS_NUITS(listing.id), { method: 'POST', body: JSON.stringify({ tarifs: nuits }) }),
        nestFetch(NEST_API.LISTINGS.SET_TARIFS_PERSONNES(listing.id), { method: 'POST', body: JSON.stringify({ tarifs: personnes }) }),
        nestFetch(NEST_API.LISTINGS.UPDATE(listing.id), { method: 'PATCH', body: JSON.stringify({ acomptePourcentage: acomptePct, derniereMinuteActive: derniereMinActive }) }),
      ]);
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); setTimeout(() => setState('idle'), 2500);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  const numCls = 'w-full rounded-field border border-border bg-background-card px-3 py-2.5 text-sm tabular-nums outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/25';

  return (
    <SectionCard title="Tarification & Option d'Acompte" icon={TrendingUp}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-inner bg-background-alt p-5">
          <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-foreground-faint">Prix de base</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums text-forest-900">{nf.format(listing.prixBase)}</span>
            <span className="text-sm text-foreground-muted">FCFA / nuit · {listing.personnesBase} pers.</span>
          </p>
        </div>

        <div className="rounded-inner border border-border bg-background-alt p-5 space-y-2">
          <label className="text-xs font-bold text-foreground block">
            Pourcentage d&apos;Acompte Requis (%)
          </label>
          <div className="flex items-center gap-2">
            {[30, 50, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setAcomptePct(pct)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-pill text-xs font-bold transition-all border cursor-pointer',
                  acomptePct === pct
                    ? 'border-forest-600 bg-forest-950 text-lime-300 shadow-xs'
                    : 'border-border bg-background-card text-foreground-muted hover:border-neutral-300'
                )}
              >
                {pct === 100 ? '100% (Total)' : `${pct}% Acompte`}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-foreground-muted">
            {acomptePct < 100
              ? `Le voyageur paie ${acomptePct}% à la réservation et le solde (${100 - acomptePct}%) à son arrivée.`
              : `Le voyageur paie 100% de la totalité au moment de la réservation.`}
          </p>
        </div>
      </div>

      {/* Offre ⚡ -15% Dernière Minute */}
      <div className="rounded-inner border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Offre &quot;Dernière Minute&quot; (-15%)</span>
          </div>
          <p className="text-xs text-foreground-muted">
            Applique automatiquement une réduction de 15% pour toute réservation effectuée moins de 48 heures avant l&apos;arrivée.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDerniereMinActive((v) => !v)}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
            derniereMinActive ? 'bg-amber-500' : 'bg-neutral-300'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
              derniereMinActive ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>

      {/* Suppléments voyageurs */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Suppléments par voyageur additionnel</h3>
        {personnes.length === 0 && (
          <p className="rounded-inner bg-background-alt p-3.5 text-sm text-foreground-muted">
            Aucun supplément : les personnes additionnelles ne sont pas facturées.
          </p>
        )}
        {personnes.map((t, i) => (
          <div key={i} className={cn('space-y-3 rounded-inner border p-4', errPers[i] ? 'border-error-500/40 bg-error-50' : 'border-border bg-background-alt')}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-forest-900">Palier {i + 1}</span>
              <button type="button" onClick={() => setPersonnes((p) => p.filter((_, j) => j !== i))}
                aria-label={`Supprimer le palier ${i + 1}`}
                className="grid h-8 w-8 place-items-center rounded-pill text-foreground-muted transition-colors hover:bg-error-50 hover:text-error-600">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {([
                ['Pers. min', t.personnesMin, (v: number) => ({ personnesMin: v })],
                ['Pers. max', t.personnesMax, (v: number) => ({ personnesMax: v })],
                ['Supplément (FCFA)', t.supplement, (v: number) => ({ supplement: v })],
              ] as const).map(([label, value, patch]) => (
                <label key={label} className="block">
                  <span className="mb-1 block text-xs text-foreground-muted">{label}</span>
                  <input type="number" inputMode="numeric" value={value}
                    onChange={(e) => setPersonnes((p) => p.map((x, j) => j === i ? { ...x, ...patch(Number(e.target.value)) } : x))}
                    className={numCls} />
                </label>
              ))}
            </div>
            {errPers[i] && <p role="alert" className="text-xs text-error-600">{errPers[i]}</p>}
          </div>
        ))}
        <button type="button"
          onClick={() => setPersonnes((p) => {
            const last = p[p.length - 1];
            const min = last ? last.personnesMax + 1 : listing.personnesBase + 1;
            return [...p, { personnesMin: min, personnesMax: min + 1, supplement: 5000 }];
          })}
          className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors hover:bg-neutral-100">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un palier
        </button>
      </div>

      {/* Réductions longs séjours */}
      <div className="space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-medium text-foreground">Réductions longs séjours</h3>
        {nuits.length === 0 && (
          <p className="rounded-inner bg-background-alt p-3.5 text-sm text-foreground-muted">
            Aucun tarif dégressif configuré.
          </p>
        )}
        {nuits.map((t, i) => (
          <div key={i} className={cn('space-y-3 rounded-inner border p-4', errNuits[i] ? 'border-error-500/40 bg-error-50' : 'border-border bg-background-alt')}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-forest-900">
                {t.nuitsMin}{t.nuitsMax ? ` à ${t.nuitsMax}` : '+'} nuits
                {t.prix > 0 && t.prix < listing.prixBase && (
                  <span className="ml-2 rounded-pill bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">
                    −{Math.round(((listing.prixBase - t.prix) / listing.prixBase) * 100)}%
                  </span>
                )}
              </span>
              <button type="button" onClick={() => setNuits((p) => p.filter((_, j) => j !== i))}
                aria-label={`Supprimer le palier ${i + 1}`}
                className="grid h-8 w-8 place-items-center rounded-pill text-foreground-muted transition-colors hover:bg-error-50 hover:text-error-600">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs text-foreground-muted">Nuits min</span>
                <input type="number" inputMode="numeric" value={t.nuitsMin}
                  onChange={(e) => setNuits((p) => p.map((x, j) => j === i ? { ...x, nuitsMin: Number(e.target.value) } : x))}
                  className={numCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-foreground-muted">Nuits max</span>
                <input type="number" inputMode="numeric" value={t.nuitsMax ?? ''} placeholder="Sans limite"
                  onChange={(e) => setNuits((p) => p.map((x, j) => j === i ? { ...x, nuitsMax: e.target.value ? Number(e.target.value) : null } : x))}
                  className={numCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-foreground-muted">Prix réduit (FCFA)</span>
                <input type="number" inputMode="numeric" value={t.prix}
                  onChange={(e) => setNuits((p) => p.map((x, j) => j === i ? { ...x, prix: Number(e.target.value) } : x))}
                  className={numCls} />
              </label>
            </div>
            {errNuits[i] && <p role="alert" className="text-xs text-error-600">{errNuits[i]}</p>}
          </div>
        ))}
        <button type="button"
          onClick={() => setNuits((p) => {
            const last = p[p.length - 1];
            const min = last ? (last.nuitsMax ? last.nuitsMax + 1 : last.nuitsMin + 7) : listing.nuitesMinimum + 1;
            return [...p, { nuitsMin: min, nuitsMax: null, prix: Math.round(listing.prixBase * 0.9) }];
          })}
          className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors hover:bg-neutral-100">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Ajouter un palier
        </button>
      </div>

      <SaveBar state={state} error={apiError} dirty={isDirty} onSave={onSave} disabled={hasErrors} />
    </SectionCard>
  );
}

/* ─── Section Photos ──────────────────────────────────────────────────────── */

function SectionPhotos({ listing }: { listing: ListingDetail }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { photos, error, busy, upload, remove, setMain, setError } = usePhotoUpload(listing.id, listing.photos);
  // newCategory existait sans aucune interface : toutes les photos partaient
  // en « AUTRE ». La categorie est maintenant choisie avant l'ajout.
  const [categorie, setCategorie] = useState<string>('SALON');

  const remaining = MAX_PHOTOS - photos.length;

  return (
    <SectionCard title={`Photos (${photos.length}/${MAX_PHOTOS})`} icon={Camera}>
      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-inner bg-error-50 px-4 py-3">
          <p className="text-sm text-error-700">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Fermer" className="shrink-0 text-error-600">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className={cn(
              'group relative aspect-[4/3] overflow-hidden rounded-inner border-2 bg-neutral-100',
              photo.estPrincipale ? 'border-gold-400' : photo.uploadError ? 'border-error-500' : 'border-border',
            )}>
              <Image src={photo.url} alt="" fill sizes="(max-width:640px) 50vw, 25vw" unoptimized
                className={cn('object-cover', photo.uploading && 'opacity-40')} />

              {photo.estPrincipale && (
                <span className="badge-verified absolute left-2 top-2 z-10 !mb-0">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  Couverture
                </span>
              )}

              {photo.uploading && (
                <span className="absolute inset-0 z-20 grid place-items-center bg-forest-950/50">
                  <Loader2 className="h-6 w-6 animate-spin text-lime-400" aria-hidden="true" />
                </span>
              )}

              {photo.uploadError && (
                <span className="absolute inset-x-2 bottom-2 z-20 rounded-pill bg-error-600 px-2 py-1 text-center text-[0.6875rem] font-medium text-white">
                  {photo.uploadError}
                </span>
              )}

              {!photo.uploading && !photo.uploadError && (
                /* Le degrade from-black/80 salissait chaque vignette. Une
                   barre en glass sombre suffit et respecte le systeme. */
                <div className="glass-dark absolute inset-x-2 bottom-2 z-10 flex items-center justify-between gap-2 rounded-pill p-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {!photo.estPrincipale && (
                    <button type="button" onClick={() => setMain(photo)}
                      className="rounded-pill px-2.5 py-1 text-[0.6875rem] font-semibold text-neutral-50 transition-colors hover:bg-white/10">
                      Couverture
                    </button>
                  )}
                  <button type="button" onClick={() => remove(photo)}
                    aria-label="Supprimer la photo"
                    className="ml-auto grid h-7 w-7 place-items-center rounded-pill text-neutral-50 transition-colors hover:bg-error-600">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}

              {photo.uploadError && (
                <button type="button" onClick={() => remove(photo)}
                  aria-label="Retirer la photo en échec"
                  className="absolute right-2 top-2 z-20 grid h-7 w-7 place-items-center rounded-pill bg-error-600 text-white">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid place-items-center gap-2 rounded-inner border border-dashed border-border bg-background-alt py-10 text-center">
          <ImageOff className="h-8 w-8 text-neutral-300" aria-hidden="true" />
          <p className="text-sm text-foreground-muted">Aucune photo</p>
        </div>
      )}

      {remaining > 0 && (
        <div className="space-y-3">
          <SelectField
            label="Catégorie des prochaines photos"
            options={CATEGORIE_PHOTO as readonly string[]}
            value={categorie}
            onChange={setCategorie}
            placeholder="Choisir"
          />
          <p className="text-xs text-foreground-faint">
            {CAT_PHOTO_LABELS[categorie] ?? categorie} · JPEG, PNG, WebP ou HEIC · {MAX_FILE_MB} Mo maximum
          </p>

          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
            className="flex w-full items-center justify-center gap-2.5 rounded-field border-2 border-dashed border-border bg-background-alt py-4 text-sm font-semibold text-forest-800 transition-colors hover:border-forest-500 hover:bg-background-card disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            {busy ? 'Envoi en cours…' : `Ajouter des photos (${remaining} restantes)`}
          </button>

          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { upload(e.target.files, categorie); e.target.value = ''; }} />
        </div>
      )}

      {/* ── Sub-section Vidéo de présentation 60s ── */}
      <EditVideoSection listing={listing} />
    </SectionCard>
  );
}

/* ─── Section Conditions ──────────────────────────────────────────────────── */

function SectionConditions({ listing, report }: { listing: ListingDetail; report: (id: string, d: boolean) => void }) {
  const qc = useQueryClient();
  const [state, setState] = useState<SaveState>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [regles, setRegles] = useState(listing.reglesMaison ?? '');
  const [nomWifi, setNomWifi] = useState(listing.nomReseauWifi ?? '');
  const [codeWifi, setCodeWifi] = useState(listing.codeWifi ?? '');
  const [digicode, setDigicode] = useState(listing.instructionsDigicode ?? '');
  const id = useId();
  const MAX = 1000;

  const isDirty =
    regles !== (listing.reglesMaison ?? '') ||
    nomWifi !== (listing.nomReseauWifi ?? '') ||
    codeWifi !== (listing.codeWifi ?? '') ||
    digicode !== (listing.instructionsDigicode ?? '');

  useEffect(() => { report('conditions', isDirty); }, [isDirty, report]);

  async function onSave() {
    setState('saving'); setApiError(null);
    try {
      await nestFetch(NEST_API.LISTINGS.UPDATE(listing.id), {
        method: 'PATCH',
        body: JSON.stringify({
          reglesMaison: regles || null,
          nomReseauWifi: nomWifi || null,
          codeWifi: codeWifi || null,
          instructionsDigicode: digicode || null,
        }),
      });
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      setState('saved'); setTimeout(() => setState('idle'), 2500);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erreur inattendue'); setState('error');
    }
  }

  return (
    <SectionCard title="Règles & Livret d'Accueil Digital" icon={Shield}>
      <div>
        <FieldLabel htmlFor={id} optional>Règles intérieures</FieldLabel>
        <textarea
          id={id} value={regles} rows={4} maxLength={MAX}
          onChange={(e) => setRegles(e.target.value)}
          placeholder={"Ex :\n• Pas de fêtes bruyantes\n• Animaux non admis\n• Interdiction de fumer à l'intérieur"}
          className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
        />
        <div className="mt-1.5 flex items-center justify-between text-xs text-foreground-muted">
          <span>Affiché au voyageur avant réservation</span>
          <span className={cn('tabular-nums', regles.length > 900 && 'text-warning-600')}>{regles.length} / {MAX}</span>
        </div>
      </div>

      {/* Livret d'Accueil Digital */}
      <div className="mt-6 border-t border-border pt-6 space-y-4">
        <div className="flex items-center gap-2 text-forest-900 font-bold text-sm">
          <Smartphone className="h-4 w-4 text-forest-700" aria-hidden="true" />
          <span>📱 Livret d&apos;Accueil Digital (Accès Voyageur Confirmé)</span>
        </div>
        <p className="text-xs text-foreground-muted">
          Ces informations sécurisées sont visibles uniquement par les locataires ayant une réservation confirmée.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel optional>
              <span className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-forest-600" />
                Nom du réseau Wi-Fi
              </span>
            </FieldLabel>
            <input
              type="text"
              value={nomWifi}
              onChange={(e) => setNomWifi(e.target.value)}
              placeholder="Ex : ImmoLoc_FreeBox_5G"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <FieldLabel optional>
              <span className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-forest-600" />
                Mot de passe Wi-Fi
              </span>
            </FieldLabel>
            <input
              type="text"
              value={codeWifi}
              onChange={(e) => setCodeWifi(e.target.value)}
              placeholder="Ex : wifi-pass-2026"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <FieldLabel optional>Instructions Digicode & Accès Clés</FieldLabel>
          <textarea
            value={digicode}
            rows={3}
            onChange={(e) => setDigicode(e.target.value)}
            placeholder="Ex : Code portail 4582A. Boîte à clés sous les escaliers à droite, code 1234."
            className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
          />
        </div>
      </div>

      <SaveBar state={state} error={apiError} dirty={isDirty} onSave={onSave} />
    </SectionCard>
  );
}

/* ─── Export ──────────────────────────────────────────────────────────────── */

export function EditListingForm({ listing }: { listing: ListingDetail }) {
  const { dirtyCount, report } = useDirtyRegistry();
  const quality = computeQuality(listing);

  return (
    <div className="space-y-6 pb-16">
      {/* Bandeau de modifications non enregistrées */}
      {dirtyCount > 0 && (
        <div role="status" className="sticky top-4 z-40 flex items-center gap-2.5 rounded-card border border-warning-500/30 bg-warning-50 px-4 py-3 shadow-md">
          <AlertCircle className="h-4 w-4 shrink-0 text-warning-700" aria-hidden="true" />
          <p className="text-sm text-warning-700">
            {dirtyCount === 1 ? 'Une section a des modifications non enregistrées.' : `${dirtyCount} sections ont des modifications non enregistrées.`}
          </p>
        </div>
      )}

      <div className="section-inverse space-y-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/dashboard/annonces/${listing.id}`}
            className="inline-flex items-center gap-2 rounded-pill border border-white/15 px-4 py-2 text-sm font-medium text-neutral-50 transition-colors hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/logements/${(listing as any).slug ?? listing.id}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-pill border border-white/15 px-4 py-2 text-sm font-medium text-neutral-50 transition-colors hover:bg-white/10">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Aperçu
            </Link>
            <ListingStatusBadge statut={listing.statut} size="sm" />
          </div>
        </div>

        <div>
          <p className="eyebrow">Édition</p>
          {/* Le titre etait en on-inverse-display, soit du lime : l'accent
              portait le titre principal de la page. */}
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-neutral-50 sm:text-3xl">
            {listing.titre}
          </h1>
          <p className="mt-1 text-sm text-forest-200">{listing.adresse}, {listing.ville}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="rounded-pill bg-white/[0.06] px-3.5 py-1.5 text-sm tabular-nums text-neutral-50">
            {nf.format(listing.prixBase)} FCFA / nuit
          </span>
          <span className="rounded-pill bg-white/[0.06] px-3.5 py-1.5 text-sm tabular-nums text-forest-200">
            Qualité {quality}%
          </span>
        </div>
      </div>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <aside className="sticky top-6 hidden w-72 shrink-0 space-y-4 lg:block">
          <QualityPanel listing={listing} />
          <nav aria-label="Sections" className="space-y-1 rounded-card border border-border bg-background-card p-3 shadow-sm">
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
              <a key={id} href={`#${id}`}
                className="flex items-center gap-3 rounded-inner px-3 py-2.5 text-sm text-foreground-muted transition-colors hover:bg-background-alt hover:text-forest-800">
                <Icon className="h-4 w-4 text-foreground-faint" aria-hidden="true" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className="w-full flex-1 space-y-6">
          <div id="section-bien" className="scroll-mt-24"><SectionBien listing={listing} report={report} /></div>
          <div id="section-presentation" className="scroll-mt-24"><SectionPresentation listing={listing} report={report} /></div>
          <div id="section-equipements" className="scroll-mt-24"><SectionEquipements listing={listing} report={report} /></div>
          <div id="section-tarification" className="scroll-mt-24"><SectionTarification listing={listing} report={report} /></div>
          <div id="section-photos" className="scroll-mt-24"><SectionPhotos listing={listing} /></div>
          <div id="section-conditions" className="scroll-mt-24"><SectionConditions listing={listing} report={report} /></div>
        </div>
      </div>
    </div>
  );
}

function EditVideoSection({ listing }: { listing: ListingDetail }) {
  const qc = useQueryClient();
  const [videoUrl, setVideoUrl] = useState<string | null>(listing.videoUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadDetails, setUploadDetails] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = objectUrl;

    tempVideo.onloadedmetadata = async () => {
      const duration = tempVideo.duration;

      if (!isNaN(duration) && isFinite(duration) && duration > 90) {
        setError(`La vidéo choisie fait ${Math.round(duration)}s. La durée maximale autorisée est de 1m30 (90 secondes).`);
        URL.revokeObjectURL(objectUrl);
        e.target.value = '';
        return;
      }

      // Prévisualisation immédiate pour réactivité maximale
      setVideoUrl(objectUrl);
      setIsUploading(true);
      setUploadPercent(0);
      setUploadDetails('Préparation de l\'envoi…');

      try {
        const uploadParams = await nestFetch<{
          uploadUrl: string;
          signature: string;
          timestamp: number;
          apiKey: string;
          folder: string;
        }>(NEST_API.LISTINGS.VIDEO_UPLOAD_PARAMS(listing.id), { method: 'GET' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', uploadParams.apiKey);
        formData.append('timestamp', uploadParams.timestamp.toString());
        formData.append('signature', uploadParams.signature);
        formData.append('folder', uploadParams.folder);

        // Upload avec XMLHttpRequest pour suivi de progression en temps réel
        const cloudinaryRes = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', uploadParams.uploadUrl);

          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              const loadedMb = (evt.loaded / (1024 * 1024)).toFixed(1);
              const totalMb = (evt.total / (1024 * 1024)).toFixed(1);
              setUploadPercent(pct);
              setUploadDetails(`${pct}% · ${loadedMb} Mo / ${totalMb} Mo`);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error('Erreur de lecture de la réponse vidéo.'));
              }
            } else {
              reject(new Error('Échec du téléversement vidéo.'));
            }
          };

          xhr.onerror = () => reject(new Error('Erreur réseau lors de l\'envoi de la vidéo.'));
          xhr.send(formData);
        });

        // Enregistrement final sur le Backend NestJS
        await nestFetch(NEST_API.LISTINGS.UPDATE(listing.id), {
          method: 'PATCH',
          body: JSON.stringify({ videoUrl: cloudinaryRes.secure_url, videoPublicId: cloudinaryRes.public_id }),
        });

        setVideoUrl(cloudinaryRes.secure_url);
        await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du téléversement.');
        setVideoUrl(listing.videoUrl ?? null);
      } finally {
        setIsUploading(false);
        setUploadPercent(0);
        setUploadDetails('');
        e.target.value = '';
      }
    };

    tempVideo.onerror = () => {
      setError('Impossible de lire la durée du fichier vidéo sélectionné.');
    };
  };

  const handleDeleteVideo = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await nestFetch(NEST_API.LISTINGS.DELETE_VIDEO(listing.id), { method: 'DELETE' });
      setVideoUrl(null);
      await qc.invalidateQueries({ queryKey: ['listing-owner', listing.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-border pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Vidéo de présentation (1m30 MAX)</h3>
        {videoUrl && !isUploading && (
          <span className="rounded-pill bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-800">
            Vidéo configurée
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-inner bg-error-50 px-3.5 py-2.5 text-xs text-error-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Barre de progression en temps réel */}
      {isUploading && (
        <div className="space-y-2 rounded-inner border border-forest-600/30 bg-forest-950/5 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-forest-900">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-forest-700" />
              Téléversement de la vidéo en cours…
            </span>
            <span className="tabular-nums font-bold text-forest-800">{uploadDetails}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-forest-600 transition-all duration-300 ease-out"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      )}

      {videoUrl ? (
        <div className="space-y-3">
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-inner border border-border bg-neutral-100 shadow-xs">
            <video src={videoUrl} controls className="h-full w-full object-contain" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-forest-800 transition-colors hover:bg-neutral-100">
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5 text-forest-700" aria-hidden="true" />}
              <span>{isUploading ? 'Envoi en cours…' : 'Remplacer la vidéo'}</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                disabled={isUploading || isDeleting}
                onChange={handleVideoSelect}
              />
            </label>

            <button
              type="button"
              onClick={handleDeleteVideo}
              disabled={isUploading || isDeleting}
              className="inline-flex items-center gap-2 rounded-pill border border-error-500/30 bg-error-50 px-4 py-2 text-xs font-semibold text-error-700 transition-colors hover:bg-error-100"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
              <span>{isDeleting ? 'Suppression…' : 'Supprimer la vidéo'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-inner border border-border bg-background-alt p-4">
          <div>
            <p className="text-xs font-medium text-foreground">Ajouter une vidéo de présentation (1m30 MAX)</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              Format MP4 / MOV vertical (9:16) · Maximum 1 min 30 s (90s)
            </p>
          </div>
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-forest-800 transition-colors hover:bg-neutral-100">
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5 text-forest-700" aria-hidden="true" />}
            <span>{isUploading ? 'Envoi en cours…' : 'Choisir une vidéo'}</span>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              disabled={isUploading}
              onChange={handleVideoSelect}
            />
          </label>
        </div>
      )}
    </div>
  );
}