'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Moon, ShieldCheck, Loader2, ChevronRight,
  CalendarDays, Lock, Info, Check, CheckCircle2, Minus, Plus, AlertCircle, Zap, Coins,
} from 'lucide-react';
import { listingsApi } from '@/lib/nestjs';
import type { DateRange } from 'react-day-picker';
import { TenantPriceDisplay } from '@/components/ui/TenantPriceDisplay';
import type { TarifNuit, TarifPersonne, PricePreviewResponse } from '@/lib/nestjs';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useGatedAction } from '@/features/gate/hooks/use-gated-action';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { useToastError } from '@/lib/hooks/use-toast-error';

/**
 * Date civile locale au format YYYY-MM-DD.
 *
 * ⚠️ NE PAS remplacer par toISOString().split('T')[0].
 * toISOString() convertit en UTC. Un utilisateur en France (UTC+1/+2) qui
 * sélectionne le 5 août obtient un Date à minuit heure locale, soit
 * 2026-08-04T22:00:00Z → la requête part sur le 4 août. La diaspora qui
 * réserve depuis l'Europe pour Dakar ou Saly décalait donc tout son séjour
 * d'un jour, silencieusement, jusqu'au récapitulatif de paiement.
 * Le Sénégal étant à UTC+0, le bug était invisible en test local.
 *
 * À déplacer dans `@/lib/date` et à utiliser partout où une date part vers
 * l'API.
 */
function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Nombre de nuits entre deux dates civiles, insensible au décalage horaire. */
function countNights(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** Âge révolu, calculé en dates civiles pour éviter le décalage d'un jour. */
function computeAge(isoBirthDate: string): number | null {
  const [y, m, d] = isoBirthDate.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;
  return age;
}

/**
 * Majoration appliquée au prix de base avant affichage public.
 * ⚠️ NE JAMAIS RETIRER. À centraliser dans `@/lib/pricing`.
 */
const MARKUP = 1.07;

type Formattable = number | string | { toString(): string } | null | undefined;

/** Formate un montant FCFA. Accepte les Decimal sérialisés par Nest. */
function fmt(value: Formattable): string {
  if (value === null || value === undefined) return '—';
  const parsed = parseFloat(String(value));
  return Number.isNaN(parsed) ? '—' : Math.round(parsed).toLocaleString('fr-FR');
}

interface Props {
  listingId: string;
  prixBase: number | string;
  nuitesMinimum: number;
  capaciteMax: number;
  ageMin?: number | null;
  personnesBase?: number;
  acomptePourcentage?: number;
  derniereMinuteActive?: boolean;
  tarifsPersonnes?: TarifPersonne[];
  tarifsNuits?: TarifNuit[];
  disabledDates?: Date[];
}

export function PricePreviewWidget({
  listingId,
  prixBase,
  nuitesMinimum,
  capaciteMax,
  ageMin,
  personnesBase,
  acomptePourcentage = 30,
  derniereMinuteActive = false,
  tarifsPersonnes,
  tarifsNuits,
  disabledDates = [],
}: Props) {
  const router = useRouter();
  const { nestToken, hasHydrated } = useRoleStore();
  const { syncFromSupabaseSession } = useNestToken();
  const { showError } = useToastError();

  const calendarRef = useRef<HTMLDivElement>(null);
  const cguRef = useRef<HTMLInputElement>(null);
  /** Séquence de requête : garantit que seule la dernière réponse s'applique. */
  const requestSeq = useRef(0);

  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [range, setRange] = useState<DateRange | undefined>();
  const [typePaiement, setTypePaiement] = useState<'DEPOSIT' | 'FULL'>('DEPOSIT');
  const [preview, setPreview] = useState<PricePreviewResponse | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cguAccepted, setCguAccepted] = useState(false);
  const [ageError, setAgeError] = useState('');

  const from = range?.from;
  const to = range?.to;
  const nights = from && to ? countNights(from, to) : 0;
  const hasRange = nights > 0;

  /* ── Aperçu tarifaire ────────────────────────────────────────────────────
     Le compteur de séquence évite qu'une réponse lente pour 2 voyageurs
     écrase la réponse rapide pour 4. Sur un widget de prix, une inversion
     affiche un montant qui ne correspond pas à la sélection à l'écran.     */

  useEffect(() => {
    if (!from || !to || nights <= 0) {
      setPreview(null);
      setPreviewFailed(false);
      return;
    }

    const seq = ++requestSeq.current;
    const dateDebut = toLocalISODate(from);
    const dateFin = toLocalISODate(to);

    startTransition(async () => {
      try {
        const result = await listingsApi.getPricePreview(listingId, {
          dateDebut,
          dateFin,
          nbPersonnes,
        });
        if (seq !== requestSeq.current) return;
        setPreview(result);
        setPreviewFailed(false);
      } catch (error) {
        if (seq !== requestSeq.current) return;
        console.error('[PricePreviewWidget] Aperçu tarifaire indisponible', error);
        setPreview(null);
        setPreviewFailed(true);
      }
    });
  }, [listingId, nbPersonnes, nights, from, to]);

  const prixBaseNum = typeof prixBase === 'string' ? parseFloat(prixBase) : prixBase;
  const prixAffiche = Math.round(prixBaseNum * MARKUP);
  const prixDerniereMinute = Math.round(prixAffiche * 0.85);

  /* Sans réponse serveur, le total est une ESTIMATION locale : elle ignore
     les tarifs dégressifs et les suppléments. Elle est signalée comme telle
     et le choix du mode de règlement reste verrouillé — on ne fait pas
     choisir un montant à débiter sur un chiffre qu'on sait faux.           */
  const isEstimate = !preview;
  const estimatedTotal = preview
    ? preview.totalLocataire
    : prixAffiche * Math.max(nights, nuitesMinimum);
  const montantADebiter =
    typePaiement === 'DEPOSIT' && acomptePourcentage < 100
      ? Math.round(Number(estimatedTotal) * (acomptePourcentage / 100))
      : Math.round(Number(estimatedTotal));

  const hasValidMinNights = nights >= nuitesMinimum;
  const canBook = hasRange && hasValidMinNights && cguAccepted && hasHydrated;

  const blockerMessage = !hasHydrated
    ? 'Chargement…'
    : !hasRange
      ? 'Choisissez vos dates d’arrivée et de départ'
      : !hasValidMinNights
        ? `Séjour min. ${nuitesMinimum} nuits (${nights} nuit${nights > 1 ? 's' : ''} choisie${nights > 1 ? 's' : ''})`
        : !cguAccepted
          ? 'Acceptez les conditions pour continuer'
          : '';

  /* ── Navigation ──────────────────────────────────────────────────────── */

  const goToReserver = useCallback(() => {
    if (!from || !to) return;
    const params = new URLSearchParams({
      listingId,
      dateDebut: toLocalISODate(from),
      dateFin: toLocalISODate(to),
      personnes: String(nbPersonnes),
      typePaiement,
    });
    router.push(`/reserver?${params.toString()}`);
  }, [from, to, listingId, nbPersonnes, typePaiement, router]);

  const { gateState, trigger: triggerGate, complete: completeGate, cancel: cancelGate } =
    useGatedAction(goToReserver);

  /** Amène l'utilisateur sur ce qui bloque, au lieu de refuser en silence. */
  const focusBlocker = useCallback(() => {
    if (!hasRange) {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!cguAccepted) {
      cguRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cguRef.current?.focus();
    }
  }, [hasRange, cguAccepted]);

  const handleBook = useCallback(async () => {
    setAgeError('');
    if (!hasHydrated) return;

    if (!canBook) {
      focusBlocker();
      return;
    }

    try {
      let activeNestToken = nestToken;
      if (!activeNestToken) activeNestToken = await syncFromSupabaseSession();

      const onboardingPending = useRoleStore.getState().needsOnboarding;

      if (!activeNestToken && onboardingPending) {
        triggerGate();
        return;
      }

      if (!activeNestToken) {
        if (!from || !to) return;
        const reserverUrl =
          `/reserver?listingId=${listingId}` +
          `&dateDebut=${toLocalISODate(from)}` +
          `&dateFin=${toLocalISODate(to)}` +
          `&personnes=${nbPersonnes}` +
          `&typePaiement=${typePaiement}`;
        router.push(`/login?next=${encodeURIComponent(reserverUrl)}`);
        return;
      }

      if (ageMin && ageMin > 0) {
        // dateNaissance peut être null si le profil a été complété après connexion
        let dateNaissance = useRoleStore.getState().dateNaissance;
        if (!dateNaissance) {
          await syncFromSupabaseSession();
          dateNaissance = useRoleStore.getState().dateNaissance;
        }
        if (!dateNaissance) {
          setAgeError(
            `Ce logement est réservé aux personnes de ${ageMin} ans et plus. Complétez votre profil pour continuer.`,
          );
          return;
        }
        const age = computeAge(dateNaissance);
        if (age === null) {
          setAgeError('Date de naissance illisible. Vérifiez votre profil.');
          return;
        }
        if (age < ageMin) {
          setAgeError(
            `Ce logement est réservé aux personnes de ${ageMin} ans et plus. Vous avez ${age} ans.`,
          );
          return;
        }
      }

      triggerGate();
    } catch (error) {
      console.error('[PricePreviewWidget] Erreur lors de la vérification', error);
      showError(error);
    }
  }, [
    hasHydrated, canBook, focusBlocker, nestToken, syncFromSupabaseSession,
    from, to, listingId, nbPersonnes, typePaiement, router, ageMin, triggerGate, showError,
  ]);

  const showTarifHint =
    personnesBase != null || (tarifsPersonnes != null && tarifsPersonnes.length > 0);

  return (
    <>
      <div className="w-full max-w-full overflow-hidden rounded-card border border-border bg-background-card shadow-md">

        {/* ── En-tête prix ───────────────────────────────────────────────── */}

        <div className="border-b border-border bg-gradient-to-b from-background-alt/70 to-background-card px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-pill border border-success-500/25 bg-success-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-success-700">
                <span className="h-1.5 w-1.5 rounded-pill bg-success-600" />
                Disponible
              </span>

              <TenantPriceDisplay
                prixBase={prixBase}
                derniereMinuteActive={derniereMinuteActive}
                size="lg"
              />

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {nuitesMinimum > 1 && (
                  <p className="text-xs text-foreground-muted">
                    Min. {nuitesMinimum} nuits
                  </p>
                )}
                {tarifsNuits && tarifsNuits.length > 1 && (
                  <span className="rounded-pill border border-forest-100 bg-forest-50 px-2 py-0.5 text-xs font-semibold text-forest-700">
                    Tarif dégressif
                  </span>
                )}
                {derniereMinuteActive && (
                  <span className="inline-flex items-center gap-1 rounded-pill border border-action-edge bg-lime-500/10 px-2.5 py-0.5 text-xs font-bold text-forest-900">
                    <Zap className="h-3 w-3 fill-lime-600 text-lime-600" />
                    −15 % dernière minute
                  </span>
                )}
              </div>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50">
              <CalendarDays className="h-5 w-5 text-forest-600" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6">

          {/* ── Calendrier ───────────────────────────────────────────────── */}

          <div ref={calendarRef}>
            <AvailabilityCalendar
              onRangeChange={setRange}
              disabledDates={disabledDates}
              minNights={nuitesMinimum}
              compact
            />
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 rounded-inner border border-border bg-background-alt px-3 py-2 text-xs text-foreground-muted">
              <span>🔑 Arrivée : <strong className="font-semibold text-foreground">dès 14:00</strong></span>
              <span>🚪 Départ : <strong className="font-semibold text-foreground">avant 12:00</strong></span>
            </div>
            <p className="mt-1 text-[10px] text-foreground-faint text-center">
              Horaires indicatifs — personnalisables par l&apos;hôte lors de la confirmation
            </p>
          </div>

          {/* ── Voyageurs ────────────────────────────────────────────────── */}

          <div className="border-t border-border pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-foreground-muted" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Voyageurs
                </span>
              </div>
              {capaciteMax > 1 && (
                <span className="rounded-pill border border-forest-100 bg-forest-50 px-2 py-0.5 text-xs text-forest-700">
                  Tarif dynamique
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-field border border-border bg-background-alt p-2">
              <button
                type="button"
                onClick={() => setNbPersonnes((p) => Math.max(1, p - 1))}
                disabled={nbPersonnes <= 1}
                aria-label="Retirer un voyageur"
                className="flex h-10 w-10 items-center justify-center rounded-inner border border-border bg-background-card text-foreground-muted shadow-xs transition-colors duration-200 hover:border-forest-300 hover:text-forest-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>

              <div className="text-center" aria-live="polite">
                <div className="text-xl font-semibold leading-none tabular-nums text-foreground">
                  {nbPersonnes}
                </div>
                <div className="mt-1 text-xs text-foreground-muted">
                  {nbPersonnes === 1 ? 'voyageur' : 'voyageurs'} · max {capaciteMax}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNbPersonnes((p) => Math.min(capaciteMax, p + 1))}
                disabled={nbPersonnes >= capaciteMax}
                aria-label="Ajouter un voyageur"
                className="flex h-10 w-10 items-center justify-center rounded-inner border border-border bg-background-card text-foreground-muted shadow-xs transition-colors duration-200 hover:border-forest-300 hover:text-forest-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showTarifHint && (
              <div className="mt-2.5 flex items-start gap-2 rounded-inner border border-border bg-background-alt px-3 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground-muted" />
                <p className="text-xs leading-relaxed text-foreground-muted">
                  {personnesBase != null ? (
                    nbPersonnes <= personnesBase ? (
                      <>
                        <strong className="font-semibold text-foreground">
                          {personnesBase} voyageur{personnesBase > 1 ? 's' : ''} inclus
                        </strong>{' '}
                        dans le tarif de base — aucun supplément pour votre sélection.
                      </>
                    ) : (
                      <>
                        Supplément applicable au-delà de {personnesBase} voyageur
                        {personnesBase > 1 ? 's' : ''} — le total est calculé ci-dessous.
                      </>
                    )
                  ) : (
                    <>
                      Un supplément peut s’appliquer selon le nombre de voyageurs. Le total
                      est calculé ci-dessous.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* ── Détail du prix ───────────────────────────────────────────── */}

          {hasRange && (
            <div className="section-inverse space-y-3 p-5">

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-on-inverse-muted">
                  <Moon className="h-4 w-4" />
                  {fmt(prixAffiche)} × {nights} nuit{nights > 1 ? 's' : ''}
                </span>
                <span className="font-semibold tabular-nums text-on-inverse">
                  {fmt(prixAffiche * nights)} FCFA
                </span>
              </div>

              {preview && Number(preview.supplementPersonnes) > 0 && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-on-inverse-muted">
                    <Users className="h-4 w-4" />
                    Supplément {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold tabular-nums text-on-inverse">
                    +{fmt(preview.supplementPersonnes)} FCFA
                  </span>
                </div>
              )}

              {preview && Number(preview.reductionNuits) > 0 && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-on-inverse-muted">
                    <Zap className="h-4 w-4 text-on-inverse-marker" />
                    Réduction séjour long
                  </span>
                  <span className="font-semibold tabular-nums text-on-inverse">
                    −{fmt(preview.reductionNuits)} FCFA
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-border-inverse pt-3">
                <span className="font-semibold text-on-inverse">
                  {isEstimate ? 'Total estimé' : 'Total du séjour'}
                </span>
                <span className="flex items-center gap-2">
                  {isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-on-inverse-muted" />
                  )}
                  <span className="text-xl font-semibold tabular-nums tracking-tight text-on-inverse">
                    {fmt(estimatedTotal)} FCFA
                  </span>
                </span>
              </div>

              {/* Badge Cashback Teranga Club */}
              <div className="flex items-center gap-2 rounded-inner border border-lime-400/30 bg-lime-400/10 px-3 py-2 text-xs text-lime-300">
                <Coins className="h-4 w-4 text-lime-300 shrink-0" />
                <span>
                  Gagnez <strong className="font-bold text-lime-200">+{Math.round(Number(estimatedTotal) * 0.015).toLocaleString('fr-FR')} Klef Coins</strong> sur cette réservation
                </span>
              </div>

              {previewFailed && (
                <p className="text-xs leading-relaxed text-on-inverse-muted">
                  Le calcul détaillé est momentanément indisponible. Le montant ci-dessus
                  est une estimation : le total exact sera confirmé avant tout paiement.
                </p>
              )}

              {/* Mode de règlement — verrouillé tant que le total n'est pas
                  confirmé par le serveur. Choisir un acompte sur une
                  estimation revient à annoncer un montant qu'on sait faux. */}
              {acomptePourcentage < 100 && (
                <div className="space-y-2 pt-1">
                  <span
                    id="mode-reglement-label"
                    className="block text-xs font-semibold uppercase tracking-wider text-on-inverse-muted"
                  >
                    Mode de règlement
                  </span>

                  <div
                    role="radiogroup"
                    aria-labelledby="mode-reglement-label"
                    className="grid grid-cols-2 gap-2"
                  >
                    {([
                      {
                        value: 'DEPOSIT' as const,
                        label: `Acompte ${acomptePourcentage} %`,
                        amount: Math.round(Number(estimatedTotal) * (acomptePourcentage / 100)),
                        hint: 'Solde à l’arrivée',
                      },
                      {
                        value: 'FULL' as const,
                        label: 'Totalité',
                        amount: Math.round(Number(estimatedTotal)),
                        hint: 'Rien sur place',
                      },
                    ]).map(({ value, label, amount, hint }) => {
                      const selected = typePaiement === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={isEstimate}
                          onClick={() => setTypePaiement(value)}
                          /* Sélection en surface claire, pas en lime : le seul
                             aplat lime de l'écran est le CTA de réservation. */
                          className={`rounded-inner border p-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${selected
                              ? 'border-neutral-50 bg-neutral-50 text-forest-900'
                              : 'border-border-inverse bg-white/5 text-on-inverse-muted hover:border-border-inverse-strong'
                            }`}
                        >
                          <span className="block text-xs font-semibold uppercase tracking-wider opacity-80">
                            {label}
                          </span>
                          <span className="mt-0.5 block text-sm font-semibold leading-tight tabular-nums">
                            {fmt(amount)} FCFA
                          </span>
                          <span className="mt-1 block text-xs opacity-80">{hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isEstimate && (
                <p className="text-right text-xs tabular-nums text-on-inverse-muted">
                  Montant à débiter : {fmt(montantADebiter)} FCFA
                </p>
              )}
            </div>
          )}

          {/* ── Conditions ───────────────────────────────────────────────── */}

          <div className="border-t border-border pt-4">
            {/* Vrai <input type="checkbox"> : la version précédente était un
                <div onClick>, donc inatteignable au clavier — le CTA restait
                définitivement désactivé pour qui ne peut pas utiliser de
                souris, sur un consentement contractuel. */}
            <label className="group flex cursor-pointer items-start gap-3">
              <span className="relative mt-0.5 shrink-0">
                <input
                  ref={cguRef}
                  type="checkbox"
                  checked={cguAccepted}
                  onChange={(e) => setCguAccepted(e.target.checked)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border-2 border-border bg-background-card transition-colors checked:border-forest-600 checked:bg-forest-600 group-hover:border-forest-400"
                />
                <Check
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-neutral-0 opacity-0 peer-checked:opacity-100"
                />
              </span>
              <span className="text-xs leading-relaxed text-foreground-muted">
                J’accepte les{' '}
                <Link
                  href="/cgu"
                  target="_blank"
                  className="font-semibold text-link underline-offset-2 hover:underline"
                >
                  conditions de location
                </Link>{' '}
                et le contrat de réservation qui sera envoyé à la confirmation.
              </span>
            </label>
          </div>

          {/* ── Âge minimum & Nuits minimum ──────────────────────────────── */}

          {hasRange && !hasValidMinNights && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-inner border border-error-500/20 bg-error-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" />
              <p className="text-xs font-bold leading-relaxed text-error-700">
                Séjour minimum requis : {nuitesMinimum} nuits. Vous avez sélectionné {nights} nuit{nights > 1 ? 's' : ''}. Veuillez ajouter des dates pour continuer.
              </p>
            </div>
          )}

          {ageError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-inner border border-error-500/20 bg-error-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" />
              <p className="text-xs leading-relaxed text-error-700">{ageError}</p>
            </div>
          )}

          {/* ── CTA desktop ──────────────────────────────────────────────────
              Masqué sous lg : sur mobile la barre fixe porte l'action, et
              deux aplats lime simultanés casseraient la règle d'un seul
              CTA lime par écran.                                            */}

          <div className="hidden lg:block">
            <button
              type="button"
              onClick={handleBook}
              disabled={!canBook}
              aria-describedby={blockerMessage ? 'reserver-blocage' : undefined}
              className={`flex w-full items-center justify-center gap-2.5 rounded-pill px-6 py-4 text-base font-semibold transition-[background-color,box-shadow,transform] duration-200 ${canBook
                  ? 'bg-action text-on-action shadow-action hover:bg-action-hover hover:shadow-action-hover active:scale-[0.99]'
                  : 'cursor-not-allowed bg-background-alt text-foreground-muted'
                }`}
            >
              {canBook ? 'Réserver maintenant' : blockerMessage}
              {canBook && <ChevronRight className="h-4 w-4" />}
            </button>

            {blockerMessage && hasHydrated && (
              <p
                id="reserver-blocage"
                className="mt-2 flex items-center gap-2 text-xs text-foreground-muted"
              >
                <span className="h-1.5 w-1.5 rounded-pill bg-border-hover" />
                {blockerMessage}
              </p>
            )}
          </div>

          {/* ── Garanties ────────────────────────────────────────────────── */}

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
            {[
              { icon: ShieldCheck, text: 'Séquestre', sub: 'garanti' },
              { icon: Lock, text: 'Paiement', sub: 'sécurisé' },
              { icon: CheckCircle2, text: 'Annulation', sub: 'flexible' },
            ].map(({ icon: Icon, text, sub }) => (
              <div key={text} className="flex flex-col items-center gap-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-inner border border-forest-100 bg-forest-50">
                  <Icon className="h-4 w-4 text-forest-600" />
                </span>
                <span className="text-xs font-semibold text-foreground">{text}</span>
                <span className="text-xs text-foreground-muted">{sub}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-foreground-muted">
            Aucun débit avant confirmation du propriétaire
          </p>
        </div>
      </div>

      {/* ── Barre fixe mobile ──────────────────────────────────────────────
          Sortie de la carte : un parent avec overflow-hidden — ou pire, un
          transform quelque part au-dessus — change le bloc conteneur d'un
          position: fixed et la barre se retrouve ancrée au mauvais endroit.

          Le bouton n'invente plus de dates. La version précédente, quand
          aucune date n'était sélectionnée, fabriquait un séjour à partir
          d'aujourd'hui et poussait directement vers /reserver : l'utilisateur
          arrivait sur un récapitulatif pour des dates qu'il n'avait jamais
          choisies, sans avoir accepté les CGU, sans contrôle d'âge et sans
          passer par le gate d'authentification.                             */}

      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-forest-800/80 bg-forest-950 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:hidden"
      >
        <div className="min-w-0">
          <TenantPriceDisplay
            prixBase={prixBase}
            derniereMinuteActive={derniereMinuteActive}
            size="sm"
            showBadge={false}
            textColor="text-white"
          />
          <p className="truncate text-xs text-forest-200/90 font-medium">
            {hasRange
              ? `${nights} nuit${nights > 1 ? 's' : ''} · ${nbPersonnes} voyageur${nbPersonnes > 1 ? 's' : ''}`
              : `Minimum ${nuitesMinimum} nuit${nuitesMinimum > 1 ? 's' : ''}`}
          </p>
        </div>

        <button
          type="button"
          onClick={canBook ? handleBook : focusBlocker}
          disabled={!hasHydrated}
          className="flex shrink-0 items-center gap-1.5 rounded-pill bg-action hover:bg-action-hover px-6 py-3.5 text-sm font-bold text-forest-950 shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {canBook ? 'Réserver' : hasRange ? 'Accepter et réserver' : 'Choisir les dates'}
        </button>
      </div>

      {gateState.open && (
        <ActionGateModal
          steps={gateState.steps}
          block={gateState.block}
          onComplete={completeGate}
          onCancel={cancelGate}
        />
      )}
    </>
  );
}