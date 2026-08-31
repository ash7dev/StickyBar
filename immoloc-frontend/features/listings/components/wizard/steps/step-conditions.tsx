'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Info, Moon, Plus, ScrollText, TrendingDown, Users, X,
  Smartphone, Zap, BatteryCharging, Plug, ShieldCheck,
} from 'lucide-react';
import {
  stepConditionsSchema, type StepConditionsInput,
  type TarifPersonnes, type TarifNuits,
} from '@/schemas/listing.schema';
import { useListingFormStore } from '@/stores/listing-form.store';
import { cn } from '@/lib/utils/cn';
import { FieldLabel, INPUT_CLS, SectionCard } from '../wizard-ui';

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

const fcfa = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

function TarifRow({
  icon: Icon, label, value, onRemove,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-inner border border-border bg-background-alt px-4 py-3">
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-foreground-faint" aria-hidden="true" />
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-semibold tabular-nums text-forest-900">{value}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer le palier ${label}`}
          className="grid h-7 w-7 place-items-center rounded-pill text-foreground-muted transition-colors hover:bg-error-50 hover:text-error-600"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

export function StepConditions({ onNext, submitRef }: Props) {
  const {
    conditions, setConditions,
    bien, annonce,
    tarifsPersonnes, addTarifPersonnes, removeTarifPersonnes,
    tarifsNuits, addTarifNuits, removeTarifNuits,
  } = useListingFormStore();

  const capaciteMax = bien.capaciteMax ?? 1;
  const nuitesMinimum = annonce.nuitesMinimum ?? 1;

  const [showPersonnes, setShowPersonnes] = useState(tarifsPersonnes.length > 0);
  const [showNuits, setShowNuits] = useState(tarifsNuits.length > 0);

  useEffect(() => {
    const store = useListingFormStore.getState();

    for (let i = store.tarifsPersonnes.length - 1; i >= 0; i--) {
      if (store.tarifsPersonnes[i].personnesMin <= capaciteMax) {
        store.removeTarifPersonnes(i);
      }
    }
    for (let i = store.tarifsNuits.length - 1; i >= 0; i--) {
      if (store.tarifsNuits[i].nuitsMin <= nuitesMinimum) {
        store.removeTarifNuits(i);
      }
    }
  }, [capaciteMax, nuitesMinimum]);

  const [newP, setNewP] = useState<Partial<TarifPersonnes>>({});
  const [newN, setNewN] = useState<Partial<TarifNuits>>({});
  const [errP, setErrP] = useState<string | null>(null);
  const [errN, setErrN] = useState<string | null>(null);

  const ids = {
    pMin: useId(), pMax: useId(), pSup: useId(),
    nMin: useId(), nMax: useId(), nPrix: useId(),
    regles: useId(), instructions: useId(),
    wifiSsid: useId(), wifiPass: useId(), digicode: useId(),
    elecDetails: useId(),
  };

  const { register, control, handleSubmit, watch } = useForm<StepConditionsInput>({
    resolver: zodResolver(stepConditionsSchema),
    defaultValues: {
      reglesMaison: conditions.reglesMaison ?? '',
      instructionsAcces: conditions.instructionsAcces ?? '',
      nomReseauWifi: conditions.nomReseauWifi ?? '',
      codeWifi: conditions.codeWifi ?? '',
      instructionsDigicode: conditions.instructionsDigicode ?? '',
      regimeElectricite: conditions.regimeElectricite ?? 'INCLUS',
      detailsElectricite: conditions.detailsElectricite ?? '',
    },
  });

  const reglesLength = watch('reglesMaison')?.length ?? 0;
  const prixBase = annonce.prixBase ?? 0;

  function onSubmit(data: StepConditionsInput) {
    setConditions(data);
    onNext();
  }

  function addP() {
    if (!newP.personnesMin || !newP.personnesMax || newP.supplement === undefined) {
      setErrP('Renseignez les trois champs.');
      return;
    }
    if (newP.personnesMax < newP.personnesMin) {
      setErrP('Le maximum doit être supérieur au minimum.');
      return;
    }
    const overlap = tarifsPersonnes.some(
      (t) => newP.personnesMin! <= t.personnesMax && newP.personnesMax! >= t.personnesMin,
    );
    if (overlap) {
      setErrP('Ce palier chevauche un palier existant.');
      return;
    }
    addTarifPersonnes(newP as TarifPersonnes);
    setNewP({});
    setErrP(null);
  }

  function addN() {
    if (!newN.nuitsMin || !newN.prix) {
      setErrN('Renseignez le nombre de nuits et le prix.');
      return;
    }
    if (newN.nuitsMax != null && newN.nuitsMax < newN.nuitsMin) {
      setErrN('Le maximum doit être supérieur au minimum.');
      return;
    }
    if (prixBase > 0 && newN.prix >= prixBase) {
      setErrN(`Un tarif dégressif doit être inférieur au prix de base (${fcfa.format(prixBase)} FCFA).`);
      return;
    }
    addTarifNuits({ ...newN, nuitsMax: newN.nuitsMax ?? null } as TarifNuits);
    setNewN({});
    setErrN(null);
  }

  const remisePreview = useMemo(() => {
    if (!prixBase || !newN.prix) return null;
    const pct = Math.round(((prixBase - newN.prix) / prixBase) * 100);
    return pct > 0 ? pct : null;
  }, [prixBase, newN.prix]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ── 1. Règles de la maison ───────────────────────────────────────── */}
      <SectionCard
        icon={ScrollText}
        title="Règles de la maison"
        description="Consignes affichées au voyageur avant la réservation"
      >
        <div>
          <FieldLabel htmlFor={ids.regles} optional>Règles intérieures</FieldLabel>
          <textarea
            {...register('reglesMaison')}
            id={ids.regles}
            rows={4}
            maxLength={1000}
            placeholder={"Ex :\n• Pas de fêtes ni d'événements bruyants\n• Animaux non admis\n• Interdiction de fumer à l'intérieur\n• Respect du calme du quartier après 22h"}
            className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-foreground-muted">
            <span>Ces consignes seront lues et acceptées avant le paiement.</span>
            <span className={cn('tabular-nums font-mono', reglesLength > 900 && 'text-warning-600 font-semibold')}>
              {reglesLength} / 1000
            </span>
          </div>
        </div>
      </SectionCard>

      {/* ── 2. Gestion de l'Électricité & Woyofal ───────────────────────── */}
      <SectionCard
        icon={Zap}
        title="Gestion de l'Électricité & Woyofal"
        description="Précisez le mode de gestion de l'électricité pour le séjour"
      >
        <p className="flex items-start gap-2.5 rounded-inner border border-forest-100 bg-forest-50/60 p-3.5 text-xs leading-relaxed text-forest-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
          Au Sénégal, la clarté sur la gestion du compteur Woyofal prévient tout malentendu lors de l'utilisation de la climatisation.
        </p>

        <Controller
          name="regimeElectricite"
          control={control}
          render={({ field }) => (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  value: 'INCLUS',
                  label: '100% Inclus',
                  desc: 'Électricité entièrement comprise dans le prix.',
                  icon: Zap,
                },
                {
                  value: 'FORFAIT_RECHARGE',
                  label: 'Forfait offert',
                  desc: 'Recharge initiale fournie à l’arrivée.',
                  icon: BatteryCharging,
                },
                {
                  value: 'WOYOFAL_LOCATAIRE',
                  label: 'Woyofal voyageur',
                  desc: 'Le voyageur recharge le compteur directement.',
                  icon: Plug,
                },
              ].map((opt) => {
                const active = field.value === opt.value;
                const OptIcon = opt.icon;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex cursor-pointer flex-col gap-2.5 rounded-inner border p-4 transition-colors duration-150',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                      active
                        ? 'border-forest-600 bg-forest-100'
                        : 'border-border bg-background-card hover:border-border-hover',
                    )}
                  >
                    <input
                      type="radio"
                      name="regime-electricite"
                      value={opt.value}
                      checked={active}
                      onChange={() => field.onChange(opt.value)}
                      className="sr-only"
                    />
                    <span className={cn(
                      'grid h-9 w-9 place-items-center rounded-inner transition-colors duration-150',
                      active ? 'bg-forest-600 text-white' : 'bg-neutral-100 text-foreground-muted',
                    )}>
                      <OptIcon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className={cn('text-xs font-semibold', active ? 'text-forest-900' : 'text-foreground')}>
                        {opt.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-foreground-muted">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        />

        {watch('regimeElectricite') !== 'INCLUS' && (
          <div className="space-y-1.5 pt-1">
            <FieldLabel htmlFor={ids.elecDetails} optional>
              Précisions ou quota (ex: Recharge de 5 000 FCFA offerte)
            </FieldLabel>
            <textarea
              {...register('detailsElectricite')}
              id={ids.elecDetails}
              rows={2}
              maxLength={500}
              placeholder="Ex : Une recharge Woyofal de 5 000 FCFA est mise à disposition à votre arrivée. Les recharges supplémentaires sont achetées via Wave ou Orange Money."
              className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
            />
          </div>
        )}
      </SectionCard>

      {/* ── 3. Suppléments voyageurs ─────────────────────────────────────── */}
      <SectionCard
        icon={Users}
        title="Suppléments voyageurs"
        description={`Au-delà de ${capaciteMax} personne${capaciteMax > 1 ? 's' : ''} incluse${capaciteMax > 1 ? 's' : ''}`}
        badge="Optionnel"
        open={showPersonnes}
        onToggle={() => setShowPersonnes((v) => !v)}
      >
        <p className="flex items-start gap-2.5 rounded-inner border border-forest-100 bg-forest-50/60 p-3.5 text-xs leading-relaxed text-forest-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
          Le tarif de base couvre <strong className="font-semibold text-foreground">{capaciteMax}</strong>{' '}
          voyageur{capaciteMax > 1 ? 's' : ''}. Vous pouvez définir un tarif additionnel par palier.
        </p>

        {tarifsPersonnes.length > 0 && (
          <ul className="space-y-2">
            {tarifsPersonnes.map((t, i) => (
              <TarifRow
                key={`${t.personnesMin}-${t.personnesMax}`}
                icon={Users}
                label={`${t.personnesMin} à ${t.personnesMax} personnes`}
                value={`+${fcfa.format(t.supplement)} FCFA`}
                onRemove={() => removeTarifPersonnes(i)}
              />
            ))}
          </ul>
        )}

        <div className="space-y-3 rounded-inner border border-border bg-background-alt p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Ajouter un palier de voyageurs</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor={ids.pMin}>Pers. min</FieldLabel>
              <input
                id={ids.pMin} type="number" inputMode="numeric"
                min={capaciteMax + 1}
                placeholder={String(capaciteMax + 1)}
                value={newP.personnesMin ?? ''}
                onChange={(e) => setNewP((p) => ({ ...p, personnesMin: Number(e.target.value) || undefined }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <FieldLabel htmlFor={ids.pMax}>Pers. max</FieldLabel>
              <input
                id={ids.pMax} type="number" inputMode="numeric"
                placeholder="Max"
                value={newP.personnesMax ?? ''}
                onChange={(e) => setNewP((p) => ({ ...p, personnesMax: Number(e.target.value) || undefined }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <FieldLabel htmlFor={ids.pSup}>Supplément (FCFA)</FieldLabel>
              <input
                id={ids.pSup} type="number" inputMode="numeric"
                placeholder="5000"
                value={newP.supplement ?? ''}
                onChange={(e) => setNewP((p) => ({ ...p, supplement: Number(e.target.value) || undefined }))}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {errP && <p role="alert" className="text-xs text-error-600">{errP}</p>}

          <button
            type="button"
            onClick={addP}
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
            Ajouter ce palier
          </button>
        </div>
      </SectionCard>

      {/* ── 4. Réductions longs séjours ──────────────────────────────────── */}
      <SectionCard
        icon={TrendingDown}
        title="Réductions longs séjours"
        description={`Tarifs réduits à partir de ${nuitesMinimum + 1} nuits`}
        badge="Optionnel"
        open={showNuits}
        onToggle={() => setShowNuits((v) => !v)}
      >
        <p className="flex items-start gap-2.5 rounded-inner border border-forest-100 bg-forest-50/60 p-3.5 text-xs leading-relaxed text-forest-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
          Un tarif dégressif encourage les séjours longs et optimise le taux d'occupation de votre bien.
        </p>

        {tarifsNuits.length > 0 && (
          <ul className="space-y-2">
            {tarifsNuits.map((t, i) => (
              <TarifRow
                key={`${t.nuitsMin}-${t.nuitsMax ?? 'inf'}`}
                icon={Moon}
                label={`${t.nuitsMin}${t.nuitsMax ? ` à ${t.nuitsMax}` : '+'} nuits`}
                value={`${fcfa.format(t.prix)} FCFA`}
                onRemove={() => removeTarifNuits(i)}
              />
            ))}
          </ul>
        )}

        <div className="space-y-3 rounded-inner border border-border bg-background-alt p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Ajouter un tarif dégressif</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor={ids.nMin}>Nuits min</FieldLabel>
              <input
                id={ids.nMin} type="number" inputMode="numeric"
                min={nuitesMinimum + 1}
                placeholder={String(nuitesMinimum + 1)}
                value={newN.nuitsMin ?? ''}
                onChange={(e) => setNewN((p) => ({ ...p, nuitsMin: Number(e.target.value) || undefined }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <FieldLabel htmlFor={ids.nMax} optional>Nuits max</FieldLabel>
              <input
                id={ids.nMax} type="number" inputMode="numeric"
                placeholder="Sans limite"
                value={newN.nuitsMax ?? ''}
                onChange={(e) => setNewN((p) => ({ ...p, nuitsMax: e.target.value ? Number(e.target.value) : null }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <FieldLabel htmlFor={ids.nPrix}>Prix (FCFA)</FieldLabel>
              <input
                id={ids.nPrix} type="number" inputMode="numeric"
                placeholder="Prix réduit"
                value={newN.prix ?? ''}
                onChange={(e) => setNewN((p) => ({ ...p, prix: Number(e.target.value) || undefined }))}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {remisePreview && !errN && (
            <p className="text-xs font-medium text-forest-700">
              ✓ Soit une remise de {remisePreview}% par rapport à votre prix de base.
            </p>
          )}
          {errN && <p role="alert" className="text-xs text-error-600">{errN}</p>}

          <button
            type="button"
            onClick={addN}
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2 text-xs font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
            Ajouter ce palier
          </button>
        </div>
      </SectionCard>

      {/* ── 5. Livret d'accueil digital & Accès ──────────────────────────── */}
      <SectionCard
        icon={Smartphone}
        title="Livret d'accueil digital & Accès"
        description="Informations d'arrivée communiquées en toute sécurité au voyageur après réservation"
        badge="Recommandé"
      >
        <p className="flex items-start gap-2.5 rounded-inner border border-forest-100 bg-forest-50/60 p-3.5 text-xs leading-relaxed text-forest-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
          Ces données confidentielles ne seront jamais publiques et seront transmises uniquement au voyageur dont la réservation est confirmée et réglée.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={ids.wifiSsid} optional>Nom du réseau Wi-Fi</FieldLabel>
            <input
              {...register('nomReseauWifi')}
              id={ids.wifiSsid}
              type="text"
              placeholder="Ex : Klef_Residence_5G"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <FieldLabel htmlFor={ids.wifiPass} optional>Mot de passe Wi-Fi</FieldLabel>
            <input
              {...register('codeWifi')}
              id={ids.wifiPass}
              type="text"
              placeholder="Ex : Dakar2026!"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor={ids.digicode} optional>Digicode / Boîte à clés</FieldLabel>
          <input
            {...register('instructionsDigicode')}
            id={ids.digicode}
            type="text"
            placeholder="Ex : Code portail #4829 - Boîte à clés code 1234"
            className={INPUT_CLS}
          />
        </div>

        <div>
          <FieldLabel htmlFor={ids.instructions} optional>Instructions d'accès & arrivée</FieldLabel>
          <textarea
            {...register('instructionsAcces')}
            id={ids.instructions}
            rows={3}
            maxLength={1000}
            placeholder="Ex : Ascenseur jusqu'au 3ème étage, porte de droite. La clé se trouve dans le boîtier sécurisé à côté de la porte."
            className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
          />
        </div>
      </SectionCard>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}