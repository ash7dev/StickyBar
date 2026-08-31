'use client';

import { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleDollarSign, Film, Minus, Moon, Pen, Plus, Video, Zap } from 'lucide-react';
import { stepAnnonceSchema, type StepAnnonceInput } from '@/schemas/listing.schema';
import { useListingFormStore } from '@/stores/listing-form.store';
import { cn } from '@/lib/utils/cn';
import { FieldError, FieldLabel, INPUT_CLS, INPUT_ERR, SectionCard } from '../wizard-ui';

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

// Le franc CFA est arrime a l'euro a 655,957. Le code utilisait 655, ce qui
// fausse legerement une valeur presentee comme une conversion.
const XOF_PER_EUR = 655.957;

const DESC_MAX = 2000;
const TITRE_MAX = 80;

const PRESETS = [
  { n: 1, label: '1 nuit' },
  { n: 2, label: '2 nuits' },
  { n: 3, label: '3 nuits' },
  { n: 7, label: '1 sem.' },
  { n: 14, label: '2 sem.' },
  { n: 30, label: '1 mois' },
] as const;

export function StepAnnonce({ onNext, submitRef }: Props) {
  const { annonce, setAnnonce } = useListingFormStore();
  const ids = { titre: useId(), desc: useId(), prix: useId(), nuits: useId() };

  const { register, control, handleSubmit, watch, formState: { errors } } =
    useForm<StepAnnonceInput>({
      resolver: zodResolver(stepAnnonceSchema),
      defaultValues: {
        titre: annonce.titre ?? '',
        description: annonce.description ?? '',
        prixBase: annonce.prixBase || undefined,
        nuitesMinimum: annonce.nuitesMinimum ?? 1,
      },
    });

  const titreLength = watch('titre')?.length ?? 0;
  const descLength = watch('description')?.length ?? 0;
  const prixBase = watch('prixBase') ?? 0;

  function onSubmit(data: StepAnnonceInput) {
    setAnnonce(data);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* -- Présentation ------------------------------------------------ */}
      <SectionCard
        icon={Pen}
        title="Présentation"
        description="Le titre et la description que verront vos voyageurs"
      >
        <div>
          <FieldLabel htmlFor={ids.titre} required>Titre de l&apos;annonce</FieldLabel>
          <input
            {...register('titre')}
            id={ids.titre}
            maxLength={TITRE_MAX}
            placeholder="Ex : Villa avec piscine à Saly, vue mer"
            aria-invalid={!!errors.titre}
            aria-describedby={errors.titre ? `${ids.titre}-error` : `${ids.titre}-count`}
            className={errors.titre ? INPUT_ERR : INPUT_CLS}
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-foreground-muted">
            <span>Mentionnez le quartier et l&apos;atout principal</span>
            {/* Le titre n'avait aucun compteur : l'hote decouvrait la limite
                au moment de la validation. */}
            <span id={`${ids.titre}-count`} className={cn('tabular-nums', titreLength > TITRE_MAX - 10 && 'text-warning-600')}>
              {titreLength} / {TITRE_MAX}
            </span>
          </div>
          <FieldError id={`${ids.titre}-error`}>{errors.titre?.message}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor={ids.desc} required>Description</FieldLabel>
          <textarea
            {...register('description')}
            id={ids.desc}
            rows={6}
            // Le compteur annoncait « / 2000 » mais rien ne bornait la saisie :
            // on pouvait taper 3000 caracteres et ne l'apprendre qu'a la
            // validation, apres avoir tout redige.
            maxLength={DESC_MAX}
            placeholder="Ambiance, aménagements, points forts, accès, voisinage…"
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? `${ids.desc}-error` : `${ids.desc}-count`}
            className={cn(errors.description ? INPUT_ERR : INPUT_CLS, 'resize-none leading-relaxed')}
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-foreground-muted">
            <span>{descLength < 100 ? '100 caractères minimum recommandés' : 'Bonne longueur'}</span>
            <span id={`${ids.desc}-count`} className={cn('tabular-nums', descLength > DESC_MAX - 100 && 'text-warning-600')}>
              {descLength} / {DESC_MAX}
            </span>
          </div>
          <FieldError id={`${ids.desc}-error`}>{errors.description?.message}</FieldError>
        </div>
      </SectionCard>

      {/* -- Tarif ------------------------------------------------------- */}
      <SectionCard
        icon={CircleDollarSign}
        title="Tarif de base"
        description="Votre prix par nuit, hors suppléments et réductions"
      >
        <div>
          <FieldLabel htmlFor={ids.prix} required>Prix par nuit</FieldLabel>

          <div className="section-inverse rounded-card p-5">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Prix de base par nuitée</p>
              <span className="text-[11px] font-medium text-forest-200">Saisie obligatoire *</span>
            </div>

            <Controller
              name="prixBase"
              control={control}
              render={({ field }) => (
                <div className="mt-3 flex items-center gap-3 rounded-inner border border-white/20 bg-white/10 px-4 py-3 transition-all duration-150 focus-within:border-action focus-within:ring-2 focus-within:ring-action/30">
                  <input
                    id={ids.prix}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={field.value ? nf.format(field.value) : ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      field.onChange(digits ? Number(digits) : undefined);
                    }}
                    placeholder="Saisissez votre tarif (ex: 25 000)"
                    aria-invalid={!!errors.prixBase}
                    aria-describedby={errors.prixBase ? `${ids.prix}-error` : undefined}
                    className="w-full bg-transparent font-display text-xl sm:text-2xl font-semibold tabular-nums text-neutral-50 outline-none placeholder:text-forest-200/60 placeholder:text-sm sm:placeholder:text-base placeholder:font-normal"
                  />
                  <span className="shrink-0 rounded-pill bg-marker-bg px-3 py-1.5 text-xs font-semibold text-on-inverse-marker">
                    FCFA / nuit
                  </span>
                </div>
              )}
            />

            {prixBase > 0 ? (
              <p className="mt-2.5 text-xs text-forest-200">
                Environ {nf.format(prixBase / XOF_PER_EUR)} € par nuit
              </p>
            ) : (
              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-forest-200/90">
                <span>👉</span> Indiquez ici le tarif d'une nuitée pour votre logement en FCFA.
              </p>
            )}
          </div>

          <FieldError id={`${ids.prix}-error`}>{errors.prixBase?.message}</FieldError>
        </div>
      </SectionCard>

      {/* -- Durée minimale ---------------------------------------------- */}
      <SectionCard
        icon={Moon}
        title="Durée minimale de séjour"
        description="Le nombre de nuits en dessous duquel vous n'acceptez pas de réservation"
      >
        <Controller name="nuitesMinimum" control={control} render={({ field }) => {
          const v = field.value ?? 1;
          const btn =
            'grid h-11 w-11 place-items-center rounded-pill border border-border bg-background-card ' +
            'text-foreground-muted transition-colors duration-150 hover:border-forest-500 hover:text-forest-700 ' +
            'disabled:pointer-events-none disabled:opacity-30';

          return (
            <div className="space-y-3">
              <div className="flex items-center gap-4 rounded-inner border border-border bg-background-alt px-5 py-4">
                <button
                  type="button"
                  onClick={() => field.onChange(Math.max(1, v - 1))}
                  disabled={v <= 1}
                  aria-label="Diminuer la durée minimale"
                  className={btn}
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="flex-1 text-center">
                  {/* aria-live : la valeur changeait sans qu'aucun lecteur
                      d'ecran ne l'annonce. */}
                  <span
                    id={ids.nuits}
                    aria-live="polite"
                    className="block font-display text-3xl font-semibold tabular-nums text-forest-900"
                  >
                    {v}
                  </span>
                  <span className="mt-0.5 block text-xs text-foreground-muted">
                    nuit{v > 1 ? 's' : ''} minimum
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => field.onChange(Math.min(365, v + 1))}
                  disabled={v >= 365}
                  aria-label="Augmenter la durée minimale"
                  className={btn}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {PRESETS.map(({ n, label }) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => field.onChange(n)}
                    // aria-pressed : rien n'indiquait quel raccourci etait
                    // actif en dehors de la couleur.
                    aria-pressed={v === n}
                    className={cn(
                      'rounded-pill border py-2.5 text-xs font-medium transition-colors duration-150',
                      v === n
                        // Etait bg-forest-600 text-on-inverse-marker : accent sur du
                        // texte, sur six pastilles.
                        ? 'border-forest-600 bg-forest-100 text-forest-800'
                        : 'border-border bg-background-card text-foreground-muted hover:border-border-hover hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        }} />
      </SectionCard>

      {/* -- Réservation Instantanée & Vidéo ---------------------------- */}
      <SectionCard
        icon={Zap}
        title="Réservation Instantanée"
        description="Recevez des réservations immédiates sans validation manuelle 24h"
      >
        <Controller
          name="isInstantBooking"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between rounded-inner border border-forest-500/20 bg-action/[0.04] p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-pill bg-marker-bg px-2.5 py-0.5 text-[0.6875rem] font-bold text-forest-900">
                    ⚡ Fast Booking
                  </span>
                  <p className="text-sm font-semibold text-forest-900">Activer la réservation instantanée</p>
                </div>
                <p className="text-xs text-foreground-muted">
                  Les voyageurs ayant un profil vérifié pourront réserver directement. Vos réservations augmentent de +35%.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!field.value}
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                  field.value ? 'bg-forest-800' : 'bg-neutral-300'
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
      </SectionCard>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}