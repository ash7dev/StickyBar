'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Moon, Plus, ScrollText, TrendingDown, Users, X, Smartphone, Wifi, KeyRound, LogIn } from 'lucide-react';
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
        <span className="truncate text-sm text-foreground">{label}</span>
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
  };

  const { register, handleSubmit, watch } = useForm<StepConditionsInput>({
    resolver: zodResolver(stepConditionsSchema),
    defaultValues: {
      reglesMaison: conditions.reglesMaison ?? '',
      instructionsAcces: conditions.instructionsAcces ?? '',
      nomReseauWifi: conditions.nomReseauWifi ?? '',
      codeWifi: conditions.codeWifi ?? '',
      instructionsDigicode: conditions.instructionsDigicode ?? '',
    },
  });

  const reglesLength = watch('reglesMaison')?.length ?? 0;
  const prixBase = annonce.prixBase ?? 0;

  function onSubmit(data: StepConditionsInput) {
    setConditions(data);
    onNext();
  }

  /* Les deux fonctions d'ajout retournaient sans rien dire quand la saisie
     etait incomplete ou incoherente : l'utilisateur cliquait, rien ne se
     passait, aucune explication. */
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

      {/* -- Suppléments voyageurs ------------------------------------------ */}
      <SectionCard
        icon={Users}
        title="Suppléments voyageurs"
        description={`Au-delà de ${capaciteMax} personne${capaciteMax > 1 ? 's' : ''} incluse${capaciteMax > 1 ? 's' : ''}`}
        badge="Optionnel"
        open={showPersonnes}
        onToggle={() => setShowPersonnes((v) => !v)}
      >
        <p className="flex items-start gap-2.5 rounded-inner bg-background-alt p-3.5 text-xs leading-relaxed text-foreground-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
          Le tarif de base couvre <strong className="font-semibold text-foreground">{capaciteMax}</strong>{' '}
          voyageur{capaciteMax > 1 ? 's' : ''}. Ajoutez un supplément pour les personnes additionnelles.
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
          <p className="text-sm font-medium text-foreground">Ajouter un palier</p>
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
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter ce palier
          </button>
        </div>
      </SectionCard>

      {/* -- Réductions longs séjours --------------------------------------- */}
      <SectionCard
        icon={TrendingDown}
        title="Réductions longs séjours"
        description={`Tarifs réduits à partir de ${nuitesMinimum + 1} nuits`}
        badge="Optionnel"
        open={showNuits}
        onToggle={() => setShowNuits((v) => !v)}
      >
        <p className="flex items-start gap-2.5 rounded-inner bg-background-alt p-3.5 text-xs leading-relaxed text-foreground-muted">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
          Un tarif dégressif encourage les séjours longs et réduit vos périodes creuses.
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
          <p className="text-sm font-medium text-foreground">Ajouter un palier</p>
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

          {/* Retour immediat sur la remise : sans ca, l'hote saisit un prix
              sans savoir a quel pourcentage il consent. */}
          {remisePreview && !errN && (
            <p className="text-xs text-success-700">
              Soit une remise de {remisePreview}% sur votre prix de base.
            </p>
          )}
          {errN && <p role="alert" className="text-xs text-error-600">{errN}</p>}

          <button
            type="button"
            onClick={addN}
            className="inline-flex items-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-sm font-semibold text-forest-800 transition-colors duration-150 hover:bg-neutral-100"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter ce palier
          </button>
        </div>
      </SectionCard>

      {/* -- Livret d'accueil digital --------------------------------------- */}
      <SectionCard
        icon={Smartphone}
        title="Livret d'accueil digital & Accès"
        description="Informations transmises en toute sécurité au voyageur après confirmation"
        badge="Recommandé"
      >
        <p className="flex items-start gap-2.5 rounded-inner bg-forest-50 border border-forest-100 p-3.5 text-xs leading-relaxed text-forest-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
          Ces informations ne sont transmises qu'au voyageur disposant d'une réservation confirmée pour ce logement.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor={ids.wifiSsid} optional>Nom du réseau Wi-Fi</FieldLabel>
            <input
              {...register('nomReseauWifi')}
              id={ids.wifiSsid}
              type="text"
              placeholder="Ex : Klef_Guest_5G"
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
            placeholder="Ex : Prenez l'ascenseur jusqu'au 3ème étage, porte de droite. La clé est dans la boîte sécurisée."
            className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
          />
        </div>
      </SectionCard>

      {/* -- Règles ---------------------------------------------------------- */}
      <SectionCard
        icon={ScrollText}
        title="Règles de la maison"
        description="Consignes affichées au voyageur avant réservation"
      >
        <div>
          <FieldLabel htmlFor={ids.regles} optional>Règles intérieures</FieldLabel>
          <textarea
            {...register('reglesMaison')}
            id={ids.regles}
            rows={5}
            maxLength={1000}
            placeholder={"Ex :\n• Pas de fêtes bruyantes\n• Animaux non admis\n• Interdiction de fumer à l'intérieur\n• Respect du voisinage après 22h"}
            className={cn(INPUT_CLS, 'resize-none leading-relaxed')}
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-foreground-muted">
            <span>Affiché avant la réservation</span>
            <span className={cn('tabular-nums', reglesLength > 900 && 'text-warning-600')}>
              {reglesLength} / 1000
            </span>
          </div>
        </div>
      </SectionCard>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}