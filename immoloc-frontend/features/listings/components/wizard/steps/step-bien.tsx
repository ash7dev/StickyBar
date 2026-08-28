'use client';

import { useId, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bath, BedDouble, BedSingle, Building2, DoorOpen, Home,
  MapPin, TreePine, Users,
} from 'lucide-react';
import {
  stepBienSchema, type StepBienInput, type TypeLogement,
  TYPE_LOGEMENT, SOUS_TYPES_PAR_CATEGORIE,
  ZONES_SENEGAL, type ZoneSenegal, getZoneFromVille,
} from '@/schemas/listing.schema';
import { useListingFormStore } from '@/stores/listing-form.store';
import { cn } from '@/lib/utils/cn';
import { CounterRow, FieldError, FieldLabel, INPUT_CLS, INPUT_ERR, SectionCard } from '../wizard-ui';
import { SelectField } from '../select-field';

const TYPE_META: Record<TypeLogement, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = {
  APPARTEMENT: { label: 'Appartement', Icon: Building2 },
  VILLA: { label: 'Villa', Icon: TreePine },
  CHAMBRE: { label: 'Chambre', Icon: BedDouble },
  AUTRES: { label: 'Autres', Icon: Home },
};

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

export function StepBien({ onNext, submitRef }: Props) {
  const { bien, setBien } = useListingFormStore();
  const adresseId = useId();
  const typeGroupId = useId();

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<StepBienInput>({
      resolver: zodResolver(stepBienSchema),
      defaultValues: {
        type: bien.type,
        sousType: bien.sousType ?? '',
        nombreChambres: bien.nombreChambres ?? 1,
        nombreSallesBain: bien.nombreSallesBain ?? 1,
        nombrePieces: bien.nombrePieces ?? 1,
        capaciteMax: bien.capaciteMax ?? 1,
        ville: bien.ville ?? '',
        adresse: bien.adresse ?? '',
      },
    });

  const watchedType = watch('type') as TypeLogement | undefined;
  const sousTypes = watchedType ? (SOUS_TYPES_PAR_CATEGORIE[watchedType] as readonly string[]) : [];

  const [zone, setZone] = useState<ZoneSenegal | ''>(() => getZoneFromVille(bien.ville ?? '') ?? '');
  const [zoneError, setZoneError] = useState<string | null>(null);
  const villes = zone ? (ZONES_SENEGAL[zone] as readonly string[]) : [];

  function onSubmit(data: StepBienInput) {
    // La zone n'etait rattachee a aucune validation : on pouvait soumettre
    // sans l'avoir choisie tant que `ville` etait remplie par ailleurs.
    if (!zone) { setZoneError('Choisissez une zone.'); return; }
    setBien(data);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* -- Type de logement ------------------------------------------- */}
      <SectionCard
        icon={Building2}
        title="Type de logement"
        description="La catégorie qui décrit le mieux votre bien"
      >
        <div>
          <span id={typeGroupId} className="mb-2 block text-sm font-medium text-foreground">
            Type principal <span className="ml-1 text-error-600" aria-hidden="true">*</span>
          </span>

          <Controller name="type" control={control} render={({ field }) => (
            // Quatre choix mutuellement exclusifs : ce sont des boutons radio.
            // Rendus en <button>, un lecteur d'ecran annoncait « bouton » sans
            // dire qu'il y en avait quatre ni lequel etait retenu.
            <div role="radiogroup" aria-labelledby={typeGroupId} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TYPE_LOGEMENT.map((t) => {
                const { label, Icon } = TYPE_META[t];
                const active = field.value === t;
                return (
                  <label
                    key={t}
                    className={cn(
                      'flex cursor-pointer flex-col items-center gap-2.5 rounded-inner border px-3 py-4 text-center transition-colors duration-150',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                      active
                        // L'etat actif etait bg-forest-950 text-on-inverse-marker avec
                        // une pastille lime flottante en coin : sur quatre
                        // cartes, la selection produisait un bloc noir et un
                        // badge fluo pour dire « coche ».
                        ? 'border-forest-600 bg-forest-100'
                        : 'border-border bg-background-card hover:border-border-hover',
                    )}
                  >
                    <input
                      type="radio"
                      name="type-logement"
                      value={t}
                      checked={active}
                      onChange={() => { field.onChange(t); setValue('sousType', ''); }}
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
              label="Type précis"
              required
              options={sousTypes}
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder="Sélectionnez le sous-type"
              error={errors.sousType?.message}
            />
          )} />
        )}
      </SectionCard>

      {/* -- Capacité ---------------------------------------------------- */}
      <SectionCard
        icon={Users}
        title="Capacité et composition"
        description="Personnes accueillies, pièces et salles de bain"
      >
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
            <CounterRow icon={Bath} label="Salles de bain" value={field.value ?? 1} onChange={field.onChange} min={0} max={20} />
          )} />
        </div>
      </SectionCard>

      {/* -- Localisation ------------------------------------------------ */}
      <SectionCard
        icon={MapPin}
        title="Localisation"
        description="Zone, quartier et adresse précise"
      >
        <SelectField
          label="Zone ou région"
          required
          options={Object.keys(ZONES_SENEGAL) as ZoneSenegal[]}
          value={zone}
          onChange={(z) => {
            setZone(z as ZoneSenegal);
            setZoneError(null);
            setValue('ville', '', { shouldValidate: false });
          }}
          placeholder="Sélectionnez la zone"
          error={zoneError ?? undefined}
        />

        {zone && (
          <Controller name="ville" control={control} render={({ field }) => (
            <SelectField
              label={zone === 'Dakar' ? 'Quartier' : 'Ville ou destination'}
              required
              options={villes}
              value={field.value ?? ''}
              onChange={field.onChange}
              placeholder={zone === 'Dakar' ? 'Sélectionnez le quartier' : 'Sélectionnez la destination'}
              error={errors.ville?.message}
            />
          )} />
        )}

        <div>
          <FieldLabel htmlFor={adresseId} required>Adresse précise</FieldLabel>
          <input
            {...register('adresse')}
            id={adresseId}
            autoComplete="street-address"
            placeholder="Rue, résidence ou point de repère"
            aria-invalid={!!errors.adresse}
            aria-describedby={errors.adresse ? `${adresseId}-error` : undefined}
            className={errors.adresse ? INPUT_ERR : INPUT_CLS}
          />
          <FieldError id={`${adresseId}-error`}>{errors.adresse?.message}</FieldError>
        </div>

        {/* GPS Location Capture Option */}
        <div className="rounded-inner border border-border bg-background-alt p-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-forest-900">
                Coordonnées GPS (Optionnel)
              </p>
              <p className="text-[0.75rem] text-foreground-muted">
                Si vous êtes sur place, capturez la position exacte de ce logement pour maximiser vos réservations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!('geolocation' in navigator)) return;
                setValue('latitude', undefined);
                setValue('longitude', undefined);
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setValue('latitude', pos.coords.latitude);
                    setValue('longitude', pos.coords.longitude);
                  },
                  (err) => console.warn('Erreur GPS:', err.message),
                  { enableHighAccuracy: true },
                );
              }}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-pill border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-forest-800 shadow-xs transition-colors hover:bg-neutral-50"
            >
              <MapPin className="h-3.5 w-3.5 text-forest-600" />
              <span>
                {watch('latitude') && watch('longitude')
                  ? `📍 Capturé (${Number(watch('latitude')).toFixed(3)}, ${Number(watch('longitude')).toFixed(3)})`
                  : '📍 Capturer ma position GPS'}
              </span>
            </button>
          </div>
        </div>
      </SectionCard>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}