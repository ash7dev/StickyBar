'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Accessibility, AlertCircle, Armchair, ChefHat, ChevronDown,
  Loader2, RotateCw, Search, Shield, Tag, Trees, Wifi, X,
} from 'lucide-react';
import {
  stepEquipementsSchema, type StepEquipementsInput,
  EQUIPEMENTS_PAR_CATEGORIE, CATEGORIE_EQUIPEMENT_LABELS,
} from '@/schemas/listing.schema';
import { useListingFormStore } from '@/stores/listing-form.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';
import { SectionCard } from '../wizard-ui';

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CONFORT: Armchair, CUISINE: ChefHat, CONNECTIVITE: Wifi,
  SECURITE: Shield, EXTERIEUR: Trees, ACCESSIBILITE: Accessibility,
};

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

type Catalogue = { id: string; nom: string }[];
type LoadState = 'loading' | 'ready' | 'error';

/** Retire accents et casse pour que « clim » trouve « Climatisation ». */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function StepEquipements({ onNext, submitRef }: Props) {
  const { equipements, toggleEquipement, setEquipementIds } = useListingFormStore();

  const [catalogue, setCatalogue] = useState<Catalogue>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [openCats, setOpenCats] = useState<Set<string>>(new Set());

  /*
    L'ancienne version faisait `.catch(() => {})` puis, dans onSubmit,
    `if (catalogueRef.current.length > 0)`. Si l'appel echouait, la selection
    de l'hote n'etait jamais convertie en identifiants et l'etape passait
    quand meme : les equipements disparaissaient sans le moindre message.
    Ici l'echec est visible et rejouable.
  */
  async function loadCatalogue() {
    setLoadState('loading');
    try {
      const data = await nestFetch<Catalogue>(NEST_API.LISTINGS.LIST_EQUIPEMENTS, { method: 'GET' });
      setCatalogue(data);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }

  useEffect(() => { loadCatalogue(); }, []);

  const { handleSubmit, formState: { errors }, setValue, clearErrors } =
    useForm<StepEquipementsInput>({
      resolver: zodResolver(stepEquipementsSchema),
      defaultValues: { equipements: equipements.equipements },
    });

  useEffect(() => {
    setValue('equipements', equipements.equipements, { shouldValidate: true });
  }, [equipements.equipements, setValue]);

  const selected = equipements.equipements;
  const total = selected.length;

  function onSubmit() {
    if (catalogue.length > 0) {
      setEquipementIds(
        catalogue.filter((e) => selected.includes(e.nom)).map((e) => e.id),
      );
    }
    onNext();
  }

  function toggle(name: string) {
    toggleEquipement(name);
    clearErrors('equipements');
  }

  /* Filtre : masque les categories sans resultat et ouvre celles qui en ont. */
  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return Object.entries(EQUIPEMENTS_PAR_CATEGORIE)
      .map(([cat, items]) => [
        cat,
        (items as readonly string[]).filter((n) => !q || norm(n).includes(q)),
      ] as const)
      .filter(([, items]) => items.length > 0);
  }, [query]);

  useEffect(() => {
    if (query.trim()) setOpenCats(new Set(filtered.map(([cat]) => cat)));
  }, [query, filtered]);

  const noResult = query.trim() && filtered.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {errors.equipements && (
        <p role="alert" className="flex items-center gap-2.5 rounded-inner bg-error-50 px-4 py-3 text-sm text-error-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {errors.equipements.message}
        </p>
      )}

      {loadState === 'error' && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-inner bg-warning-50 px-4 py-3">
          <p className="flex items-center gap-2.5 text-sm text-warning-700">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Le catalogue n&apos;a pas pu être chargé. Vos choix risquent de ne pas être enregistrés.
          </p>
          <button
            type="button"
            onClick={loadCatalogue}
            className="inline-flex items-center gap-1.5 rounded-pill border border-warning-500/30 bg-background-card px-3 py-1.5 text-xs font-semibold text-warning-700 transition-colors hover:bg-warning-50"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      )}

      <SectionCard
        icon={Armchair}
        title="Équipements et services"
        description="Cochez ce que vous mettez à disposition des voyageurs"
      >
        {/* Compteur + recherche */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* badge-verified est la pastille doree « Verifie » : un compteur
              n'est pas une verification. */}
          <p className="text-sm text-foreground-muted" aria-live="polite">
            <span className="font-semibold tabular-nums text-forest-900">{total}</span>
            {' '}équipement{total > 1 ? 's' : ''} sélectionné{total > 1 ? 's' : ''}
            {loadState === 'loading' && (
              <Loader2 className="ml-2 inline h-3.5 w-3.5 animate-spin text-foreground-faint" aria-hidden="true" />
            )}
          </p>

          {/* Une cinquantaine de cases reparties en six categories : sans
              recherche, trouver « Groupe electrogene » demande de tout
              parcourir. */}
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-faint" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un équipement"
              aria-label="Rechercher un équipement"
              className="w-full rounded-pill border border-border bg-background-card py-2.5 pl-9 pr-9 text-sm outline-none transition-[border-color,box-shadow] duration-150 focus:border-forest-500 focus:ring-2 focus:ring-forest-500/25"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-pill text-foreground-faint transition-colors hover:bg-neutral-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {noResult && (
          <p className="py-6 text-center text-sm text-foreground-muted">
            Aucun équipement ne correspond à « {query} ».
          </p>
        )}

        {/* -- Mobile : accordeons --------------------------------------- */}
        <div className="space-y-2 sm:hidden">
          {filtered.map(([cat, items]) => {
            const Icon = CAT_ICONS[cat] ?? Tag;
            const count = items.filter((n) => selected.includes(n)).length;
            const isOpen = openCats.has(cat);

            return (
              <div key={cat} className="overflow-hidden rounded-inner border border-border">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenCats((prev) => {
                    const next = new Set(prev);
                    if (next.has(cat)) next.delete(cat); else next.add(cat);
                    return next;
                  })}
                  className="flex w-full items-center gap-3 bg-background-alt px-4 py-3 transition-colors active:bg-neutral-100"
                >
                  {/* Les squircles forest-950 a icone lime etaient repetes
                      douze fois sur cet ecran, mobile et desktop confondus. */}
                  <Icon className="h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                  <span className="flex-1 text-left text-sm font-medium text-foreground">
                    {CATEGORIE_EQUIPEMENT_LABELS[cat]}
                  </span>
                  {count > 0 && (
                    <span className="rounded-pill bg-forest-100 px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-forest-700">
                      {count}
                    </span>
                  )}
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-200', isOpen && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <ul className="divide-y divide-border border-t border-border">
                    {items.map((nom) => (
                      <li key={nom}>
                        <CheckItem nom={nom} checked={selected.includes(nom)} onToggle={toggle} variant="row" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* -- Desktop : pastilles --------------------------------------- */}
        <div className="hidden space-y-5 sm:block">
          {filtered.map(([cat, items]) => {
            const Icon = CAT_ICONS[cat] ?? Tag;
            return (
              // fieldset + legend : les categories n'avaient aucune semantique
              // de groupe, chaque case etait annoncee hors contexte.
              <fieldset key={cat}>
                <legend className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                  <Icon className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
                  {CATEGORIE_EQUIPEMENT_LABELS[cat]}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {items.map((nom) => (
                    <CheckItem key={nom} nom={nom} checked={selected.includes(nom)} onToggle={toggle} variant="pill" />
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      </SectionCard>

      <button type="submit" ref={submitRef} className="hidden" />
    </form>
  );
}

/* ---------------------------------------------------------------------------
   Case a cocher reelle, visuellement masquee.

   Avant : des <button> stylises. Un lecteur d'ecran annoncait « bouton »
   au lieu de « case a cocher, cochee », et la barre d'espace ne basculait
   pas l'etat nativement. Sur une cinquantaine d'items, c'est inutilisable.
   ------------------------------------------------------------------------ */

function CheckItem({
  nom, checked, onToggle, variant,
}: {
  nom: string;
  checked: boolean;
  onToggle: (n: string) => void;
  variant: 'row' | 'pill';
}) {
  const base =
    'cursor-pointer transition-colors duration-150 ' +
    'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring';

  if (variant === 'row') {
    return (
      <label className={cn(base, 'flex items-center gap-3 bg-background-card px-4 py-3 active:bg-background-alt')}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(nom)}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border transition-colors duration-150',
            checked ? 'border-forest-600 bg-forest-600 text-white' : 'border-border bg-background-card',
          )}
        >
          {checked && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </span>
        <span className={cn('flex-1 text-sm', checked ? 'font-medium text-forest-900' : 'text-foreground')}>
          {nom}
        </span>
      </label>
    );
  }

  return (
    <label
      className={cn(
        base,
        'inline-flex items-center gap-2 rounded-pill border px-3.5 py-2 text-sm',
        checked
          // L'etat actif etait bg-forest-600 avec texte lime-300 : l'accent
          // portait du texte, et cinquante pastilles vert fonce faisaient
          // un mur. Teinte forest + bordure + coche = trois signaux, sans
          // assombrir l'ecran.
          ? 'border-forest-600 bg-forest-100 font-medium text-forest-800'
          : 'border-border bg-background-card text-foreground-muted hover:border-border-hover hover:text-foreground',
      )}
    >
      <input type="checkbox" checked={checked} onChange={() => onToggle(nom)} className="sr-only" />
      {checked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {nom}
    </label>
  );
}