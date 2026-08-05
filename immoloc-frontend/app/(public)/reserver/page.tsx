/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft, MapPin, Users, ArrowRight,
  Loader2, AlertCircle, CheckCircle2, Lock, CalendarDays,
  Minus, Plus, ShieldCheck, X, Smartphone,
} from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { listingsApi } from '@/lib/nestjs';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationCreatedResponse } from '@/lib/nestjs/types';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useActionGate } from '@/hooks/use-action-gate';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { AvailabilityCalendar } from '@/features/listings/components/web/AvailabilityCalendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils/cn';

type Fournisseur = 'WAVE' | 'ORANGE_MONEY';

interface Props {
  searchParams: Promise<{
    listingId?: string;
    dateDebut?: string;
    dateFin?: string;
    personnes?: string;
    typePaiement?: string;
  }>;
}

export default function ReserverPage({ searchParams }: Props) {
  const sp = use(searchParams);
  const router = useRouter();
  const { nestToken, hasHydrated, needsOnboarding } = useRoleStore();
  const { refreshIfNeeded, syncFromSupabaseSession } = useNestToken();

  const listingId = sp.listingId ?? '';
  const initialDateDebut = sp.dateDebut ?? '';
  const initialDateFin = sp.dateFin ?? '';
  const initialNbPersonnes = parseInt(sp.personnes ?? '1', 10);
  const initialTypePaiement = (sp.typePaiement as 'DEPOSIT' | 'FULL') || 'DEPOSIT';

  // Sur mobile : Étape 1/2 ou 2/2. Sur Desktop : passage direct à la finalisation (Step 2)
  const [step, setStep] = useState<1 | 2>(1);

  const [dateDebut, setDateDebut] = useState(initialDateDebut);
  const [dateFin, setDateFin] = useState(initialDateFin);
  const [nbPersonnes, setNbPersonnes] = useState(isNaN(initialNbPersonnes) ? 1 : initialNbPersonnes);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [typePaiement, setTypePaiement] = useState<'DEPOSIT' | 'FULL'>(initialTypePaiement);
  const [fournisseur, setFournisseur] = useState<Fournisseur>('WAVE');
  const [telephone, setTelephone] = useState('');
  const [cguAccepted, setCguAccepted] = useState(true); // Pré-coché depuis desktop si déjà validé dans PricePreviewWidget
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: listing, isLoading: listingLoading } = useQuery({
    queryKey: ['listing-reserver', listingId],
    queryFn: () => listingsApi.findOne(listingId),
    enabled: !!listingId,
  });

  const nights = listingId && dateDebut && dateFin
    ? Math.round((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const { data: pricePreview } = useQuery({
    queryKey: ['price-preview-reserver', listingId, dateDebut, dateFin, nbPersonnes],
    queryFn: () => listingsApi.getPricePreview(listingId, {
      dateDebut,
      dateFin,
      nbPersonnes,
    }),
    enabled: !!listingId && !!dateDebut && !!dateFin && nights > 0,
  });

  const gate = useActionGate();

  useEffect(() => {
    if (!hasHydrated) return;
    if (nestToken) return;

    let cancelled = false;

    void (async () => {
      const recovered = await syncFromSupabaseSession();
      const onboardingPending = useRoleStore.getState().needsOnboarding;
      if (!recovered && !onboardingPending && !cancelled) {
        const next = encodeURIComponent(`/reserver?listingId=${listingId}&dateDebut=${dateDebut}&dateFin=${dateFin}&personnes=${nbPersonnes}`);
        router.replace(`/login?next=${next}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, nestToken, listingId, dateDebut, dateFin, nbPersonnes, router, syncFromSupabaseSession]);

  if (!hasHydrated) return null;

  if (needsOnboarding || gate.block || !gate.isReady) {
    return (
      <ActionGateModal
        steps={gate.steps}
        block={gate.block}
        onComplete={() => {}}
        onCancel={() => router.back()}
      />
    );
  }

  if (!nestToken) return null;

  if (!listingId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-sm text-foreground-muted">Paramètres de réservation manquants.</p>
        <Link href="/explorer" className="text-sm font-bold text-forest-700 hover:underline">
          Retour aux logements
        </Link>
      </div>
    );
  }

  const capaciteMax = listing?.capaciteMax ?? 10;
  const personnesBase = listing?.personnesBase ?? listing?.capaciteMax ?? 1;

  const estimatedTotal = pricePreview
    ? pricePreview.totalLocataire
    : listing ? (listing.prixBase ?? 0) * Math.max(nights, 1) : 0;

  const basePrice = pricePreview?.prixBase
    ?? (pricePreview && pricePreview.totalLocataire && pricePreview.supplementPersonnes !== undefined
      ? pricePreview.totalLocataire - pricePreview.supplementPersonnes
      : undefined)
    ?? listing?.prixBase
    ?? 0;

  const supplementAmount = pricePreview?.supplementPersonnes ?? 0;

  const fmt = (n: any) => {
    if (n === null || n === undefined) return '—';
    const s = typeof n === 'object' && typeof n.toString === 'function' ? n.toString() : String(n);
    const v = parseFloat(s);
    return !isNaN(v) ? Math.round(v).toLocaleString('fr-FR') : '—';
  };

  const fmtDate = (iso: string) => {
    if (!iso) return 'Sélectionner';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const mainPhoto = listing?.photos.find((p) => p.estPrincipale) ?? listing?.photos[0];
  const categoryLabel = listing?.sousType || listing?.type || 'Logement';

  async function handlePay() {
    if (!cguAccepted || !dateDebut || !dateFin || nights <= 0) return;
    setLoading(true); setError('');
    try {
      const token = (await refreshIfNeeded()) ?? '';
      const res = await nestFetch<ReservationCreatedResponse>(NEST_API.RESERVATIONS.CREATE, {
        method: 'POST',
        token,
        body: JSON.stringify({
          logementId: listingId,
          dateDebut,
          dateFin,
          nbPersonnes,
        }),
      });
      router.push(`/reservations/${res.reservationId}`);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Une erreur est survenue');
      setLoading(false);
    }
  }

  function handleCalendarRangeSelect(r: DateRange | undefined) {
    if (r?.from) {
      setDateDebut(r.from.toISOString().split('T')[0]);
    }
    if (r?.to) {
      setDateFin(r.to.toISOString().split('T')[0]);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-foreground pb-32 pt-20 lg:pt-8">
      {/* ── EN-TÊTE FIXE MOBILE UNIQUEMENT (lg:hidden) ────────────────────────────── */}
      <div className="lg:hidden sticky top-20 z-30 bg-canvas/95 backdrop-blur-md px-4 py-3 border-b border-border/60 flex items-center justify-between gap-3 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            if (step === 2) {
              setStep(1);
            } else {
              router.back();
            }
          }}
          className="w-9 h-9 rounded-full bg-background-card border border-border flex items-center justify-center text-foreground hover:bg-background-alt transition-colors"
          aria-label="Retour"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0">
          <h1 className="font-display text-base font-bold text-forest-900 truncate">
            {step === 1 ? 'Réserver' : 'Paiement'} <span className="text-foreground-faint font-normal">• {categoryLabel}</span>
          </h1>
        </div>

        <div className="px-3 py-1 rounded-pill bg-forest-50 border border-forest-100 text-forest-800 text-xs font-bold shrink-0">
          {step}/2
        </div>
      </div>

      {/* ── EN-TÊTE DESKTOP UNIQUEMENT (hidden lg:block) ───────────────────────────── */}
      <div className="hidden lg:block max-w-5xl mx-auto px-6 pt-8 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground-muted hover:text-forest-700 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour au logement
        </button>
        <h1 className="font-display text-3xl font-bold text-forest-950">
          Finaliser votre réservation
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Vérifiez le récapitulatif de votre séjour et validez votre moyen de paiement sécurisé.
        </p>
      </div>

      <div className="max-w-xl lg:max-w-5xl mx-auto px-4 lg:px-6 pt-4 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════════════
            MODE MOBILE — ÉTAPE 1/2 : Sélection dates, voyageurs & CGU
           ═══════════════════════════════════════════════════════════════════════════ */}
        <div className={cn('space-y-6', step === 1 ? 'block lg:hidden' : 'hidden')}>
          {/* Photo + Nom du logement */}
          <div className="bg-background-card rounded-card border border-border p-4 shadow-sm flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-inner overflow-hidden border border-border shrink-0">
              {listingLoading ? (
                <div className="w-full h-full bg-background-alt animate-pulse" />
              ) : mainPhoto ? (
                <Image src={mainPhoto.url} alt={listing?.titre ?? ''} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-background-alt flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-foreground-faint" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 block">
                {categoryLabel}
              </span>
              <h2 className="font-display text-base font-bold text-forest-950 truncate leading-snug">
                {listing?.titre ?? 'Chargement...'}
              </h2>
              <p className="text-xs text-foreground-muted flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                <span>{listing?.ville}{listing?.quartier ? `, ${listing.quartier}` : ''}</span>
              </p>
            </div>
          </div>

          {/* Dates : Date Début & Date Fin */}
          <div className="bg-background-card rounded-card border border-border p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h3 className="font-display text-sm font-bold text-forest-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-forest-600" />
                Dates du séjour
              </h3>
              {nights > 0 && (
                <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-pill border border-forest-100">
                  {nights} nuit{nights > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                className="flex items-center justify-between p-3.5 rounded-inner bg-background-alt border border-border/80 hover:border-forest-300 transition-colors text-left"
              >
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground-faint">
                    DATE DÉBUT
                  </span>
                  <span className="text-sm font-bold text-forest-950">
                    {dateDebut ? fmtDate(dateDebut) : 'Sélectionner'}
                  </span>
                </div>
                <CalendarDays className="w-4 h-4 text-forest-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setShowCalendarModal(true)}
                className="flex items-center justify-between p-3.5 rounded-inner bg-background-alt border border-border/80 hover:border-forest-300 transition-colors text-left"
              >
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-foreground-faint">
                    DATE FIN
                  </span>
                  <span className="text-sm font-bold text-forest-950">
                    {dateFin ? fmtDate(dateFin) : 'Sélectionner'}
                  </span>
                </div>
                <CalendarDays className="w-4 h-4 text-forest-600 shrink-0" />
              </button>
            </div>
          </div>

          {/* Voyageurs */}
          <div className="bg-background-card rounded-card border border-border p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h3 className="font-display text-sm font-bold text-forest-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-forest-600" />
                Voyageurs
              </h3>
              <span className="text-xs font-semibold text-foreground-muted">
                max {capaciteMax}
              </span>
            </div>

            <div className="flex items-center justify-between bg-background-alt p-3.5 rounded-inner border border-border/80">
              <div>
                <p className="text-sm font-bold text-forest-950">
                  {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-foreground-muted">
                  {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''} · max {capaciteMax}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNbPersonnes((v) => Math.max(1, v - 1))}
                  disabled={nbPersonnes <= 1}
                  className="w-9 h-9 rounded-full border border-border bg-background-card flex items-center justify-center text-foreground hover:bg-background-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="text-base font-extrabold text-forest-900 w-4 text-center">
                  {nbPersonnes}
                </span>

                <button
                  type="button"
                  onClick={() => setNbPersonnes((v) => Math.min(capaciteMax, v + 1))}
                  disabled={nbPersonnes >= capaciteMax}
                  className="w-9 h-9 rounded-full border border-border bg-background-card flex items-center justify-center text-foreground hover:bg-background-alt disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-inner bg-forest-50/70 border border-forest-100 text-xs text-forest-950 leading-relaxed">
              <span className="font-semibold text-forest-900">Tarif dynamique : </span>
              {supplementAmount > 0 ? (
                <span>
                  {personnesBase} voyageur{personnesBase > 1 ? 's' : ''} inclus dans le tarif de base — <strong className="font-bold text-forest-900">+{fmt(supplementAmount)} FCFA de supplément</strong> pour votre sélection.
                </span>
              ) : (
                <span>
                  {personnesBase} voyageur{personnesBase > 1 ? 's' : ''} inclus dans le tarif de base — aucun supplément pour votre sélection.
                </span>
              )}
            </div>
          </div>

          {/* Récapitulatif tarifaire */}
          <div className="bg-background-card rounded-card border border-border p-5 shadow-sm space-y-3">
            <h3 className="font-display text-sm font-bold text-forest-900 border-b border-border/80 pb-2">
              Récapitulatif tarifaire
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-foreground-muted">
                <span>
                  {fmt(basePrice)} FCFA × {nights > 0 ? nights : 1} {nights > 1 ? 'nuits' : 'nuit'}
                </span>
                <span className="font-bold text-forest-950">{fmt(basePrice * Math.max(nights, 1))} FCFA</span>
              </div>

              {supplementAmount > 0 && (
                <div className="flex items-center justify-between text-foreground-muted">
                  <span>
                    Supplément voyageurs ({nbPersonnes} pers.)
                  </span>
                  <span className="font-bold text-gold-700">+{fmt(supplementAmount)} FCFA</span>
                </div>
              )}

              <div className="h-px bg-border/60 my-1" />

              <div className="flex items-center justify-between">
                <span className="font-bold text-forest-950">Total estimé</span>
                <span className="font-display text-lg font-extrabold text-forest-900">
                  {fmt(estimatedTotal)} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Checkbox CGU Conforme au style PricePreviewWidget */}
          <div className="bg-background-card rounded-card border border-border p-4 shadow-sm">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="flex-shrink-0 mt-0.5">
                <div
                  onClick={() => setCguAccepted((v) => !v)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                    cguAccepted
                      ? 'bg-forest-700 border-forest-700 shadow-[0_0_0_3px_rgba(20,101,76,0.15)]'
                      : 'border-border bg-background-card group-hover:border-forest-600'
                  }`}
                >
                  {cguAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white" />}
                </div>
              </div>
              <p className="text-xs font-medium text-foreground-muted leading-relaxed">
                J&apos;accepte les{' '}
                <Link href="/cgu" target="_blank" className="text-forest-700 font-bold hover:underline underline-offset-2">
                  conditions de location
                </Link>{' '}
                et le{' '}
                <span className="text-forest-700 font-bold">contrat de réservation</span>{' '}
                qui seront envoyés à la confirmation.
              </p>
            </label>
          </div>

          {/* Bouton Continuer vers étape 2/2 (Mobile) */}
          <button
            type="button"
            onClick={() => {
              if (cguAccepted && dateDebut && dateFin && nights > 0) {
                setStep(2);
              }
            }}
            disabled={!cguAccepted || !dateDebut || !dateFin || nights <= 0}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-4 px-6 font-bold rounded-pill text-base shadow-md transition-all active:scale-98',
              cguAccepted && dateDebut && dateFin && nights > 0
                ? 'bg-lime-400 hover:bg-lime-300 text-forest-950'
                : 'bg-background-alt text-foreground-muted cursor-not-allowed',
            )}
          >
            Continuer vers le paiement
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════
            MODE DESKTOP & MOBILE ÉTAPE 2/2 : Finalisation du Paiement (Wave / Orange Money)
           ═══════════════════════════════════════════════════════════════════════════ */}
        <div className={cn('grid grid-cols-1 lg:grid-cols-12 gap-8 items-start', step === 2 ? 'block' : 'hidden lg:grid')}>
          
          {/* Colonne Gauche (Desktop / Mobile 2/2) : Carte synthétique du Logement & Dates */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card Logement */}
            <div className="bg-background-card rounded-card border border-border p-5 shadow-sm space-y-4">
              <div className="relative h-44 rounded-inner overflow-hidden border border-border">
                {listingLoading ? (
                  <div className="w-full h-full bg-background-alt animate-pulse" />
                ) : mainPhoto ? (
                  <Image src={mainPhoto.url} alt={listing?.titre ?? ''} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-background-alt flex items-center justify-center">
                    <CalendarDays className="w-8 h-8 text-foreground-faint" />
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 block">
                  {categoryLabel}
                </span>
                <h2 className="font-display text-lg font-bold text-forest-950 leading-snug">
                  {listing?.titre ?? 'Chargement...'}
                </h2>
                <p className="text-xs text-foreground-muted flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                  <span>{listing?.ville}{listing?.quartier ? `, ${listing.quartier}` : ''}</span>
                </p>
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-foreground-muted">
                  <span>Dates :</span>
                  <span className="font-bold text-forest-950">{fmtDate(dateDebut)} → {fmtDate(dateFin)}</span>
                </div>
                <div className="flex items-center justify-between text-foreground-muted">
                  <span>Durée :</span>
                  <span className="font-bold text-forest-950">{nights} nuit{nights > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between text-foreground-muted">
                  <span>Voyageurs :</span>
                  <span className="font-bold text-forest-950">{nbPersonnes} personne{nbPersonnes > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Total Montant */}
            <div className="bg-forest-900 text-white rounded-card p-6 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs text-forest-200">
                <span>{typePaiement === 'DEPOSIT' && (listing?.acomptePourcentage ?? 30) < 100 ? `Acompte à débiter aujourd'hui (${listing?.acomptePourcentage ?? 30}%)` : 'Montant Total à débiter'}</span>
                <span className="px-2.5 py-0.5 rounded-pill bg-forest-800 text-lime-300 font-semibold">
                  {nights} nuit{nights > 1 ? 's' : ''} · {nbPersonnes} pers.
                </span>
              </div>
              <div className="font-display text-3xl font-extrabold text-lime-400">
                {fmt(typePaiement === 'DEPOSIT' && (listing?.acomptePourcentage ?? 30) < 100 ? Math.round(estimatedTotal * ((listing?.acomptePourcentage ?? 30) / 100)) : estimatedTotal)} FCFA
              </div>
              {typePaiement === 'DEPOSIT' && (listing?.acomptePourcentage ?? 30) < 100 && (
                <p className="text-xs font-semibold text-lime-300">
                  + Solde de {fmt(Math.round(estimatedTotal * ((100 - (listing?.acomptePourcentage ?? 30)) / 100)))} FCFA à régler à l&apos;arrivée (Total : {fmt(estimatedTotal)} FCFA)
                </p>
              )}
              <p className="text-xs text-forest-200 flex items-center gap-1.5 pt-1 border-t border-forest-800">
                <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />
                <span>Bloqué par séquestre Klef jusqu&apos;à la remise des clés</span>
              </p>
            </div>
          </div>

          {/* Colonne Droite (Desktop / Mobile 2/2) : Choix Opérateur & Validation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-background-card rounded-card border border-border p-6 shadow-sm space-y-5">
              <h3 className="font-display text-lg font-bold text-forest-900 border-b border-border pb-3">
                Option de Paiement
              </h3>

              {/* Sélection Acompte vs Totalité */}
              {((listing?.acomptePourcentage ?? 30) < 100) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTypePaiement('DEPOSIT')}
                    className={cn(
                      'flex flex-col justify-between p-4 rounded-inner border-2 transition-all text-left cursor-pointer',
                      typePaiement === 'DEPOSIT'
                        ? 'border-forest-600 bg-forest-950 text-white shadow-sm'
                        : 'border-border bg-background-alt text-foreground hover:border-neutral-300'
                    )}
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-lime-400 block mb-1">
                        RECOMMANDÉ
                      </span>
                      <p className="text-sm font-bold">Payer {listing?.acomptePourcentage ?? 30}% d&apos;acompte</p>
                      <p className={cn('text-xs mt-0.5', typePaiement === 'DEPOSIT' ? 'text-forest-200' : 'text-foreground-muted')}>
                        {fmt(Math.round(estimatedTotal * ((listing?.acomptePourcentage ?? 30) / 100)))} FCFA maintenant
                      </p>
                    </div>
                    <p className={cn('text-[11px] mt-3 font-semibold', typePaiement === 'DEPOSIT' ? 'text-lime-300' : 'text-forest-700')}>
                      Solde de {fmt(Math.round(estimatedTotal * ((100 - (listing?.acomptePourcentage ?? 30)) / 100)))} FCFA à l&apos;arrivée
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTypePaiement('FULL')}
                    className={cn(
                      'flex flex-col justify-between p-4 rounded-inner border-2 transition-all text-left cursor-pointer',
                      typePaiement === 'FULL'
                        ? 'border-forest-600 bg-forest-950 text-white shadow-sm'
                        : 'border-border bg-background-alt text-foreground hover:border-neutral-300'
                    )}
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-forest-200 block mb-1">
                        TOTALITÉ
                      </span>
                      <p className="text-sm font-bold">Payer 100% de la totalité</p>
                      <p className={cn('text-xs mt-0.5', typePaiement === 'FULL' ? 'text-forest-200' : 'text-foreground-muted')}>
                        {fmt(estimatedTotal)} FCFA maintenant
                      </p>
                    </div>
                    <p className={cn('text-[11px] mt-3 font-semibold', typePaiement === 'FULL' ? 'text-lime-300' : 'text-foreground-muted')}>
                      Rien à régler sur place
                    </p>
                  </button>
                </div>
              )}

              <h3 className="font-display text-sm font-bold text-forest-900 pt-2 border-t border-border">
                Moyen de paiement mobile
              </h3>

              <div className="space-y-3">
                {/* Wave */}
                <button
                  type="button"
                  onClick={() => setFournisseur('WAVE')}
                  className={cn(
                    'w-full flex items-center gap-3.5 p-4 rounded-inner border-2 transition-all text-left',
                    fournisseur === 'WAVE'
                      ? 'border-forest-600 bg-forest-50/50'
                      : 'border-border bg-background-card hover:bg-background-alt',
                  )}
                >
                  <div className="w-12 h-12 rounded-inner overflow-hidden shrink-0 border border-border bg-white flex items-center justify-center">
                    <Image src="/wavelogo.jpeg" alt="Wave" width={48} height={48} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-forest-950">Wave Mobile Money</p>
                    <p className="text-xs text-foreground-muted mt-0.5">Paiement instantané sans aucun frais</p>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    fournisseur === 'WAVE' ? 'border-forest-600 bg-forest-600' : 'border-border',
                  )}>
                    {fournisseur === 'WAVE' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>

                {/* Orange Money */}
                <button
                  type="button"
                  onClick={() => setFournisseur('ORANGE_MONEY')}
                  className={cn(
                    'w-full flex items-center gap-3.5 p-4 rounded-inner border-2 transition-all text-left',
                    fournisseur === 'ORANGE_MONEY'
                      ? 'border-forest-600 bg-forest-50/50'
                      : 'border-border bg-background-card hover:bg-background-alt',
                  )}
                >
                  <div className="w-12 h-12 rounded-inner overflow-hidden shrink-0 border border-border bg-white flex items-center justify-center">
                    <Image src="/orangeMoneylogo.png" alt="Orange Money" width={48} height={48} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-forest-950">Orange Money</p>
                    <p className="text-xs text-foreground-muted mt-0.5">Paiement direct via votre compte Orange</p>
                  </div>
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    fournisseur === 'ORANGE_MONEY' ? 'border-forest-600 bg-forest-600' : 'border-border',
                  )}>
                    {fournisseur === 'ORANGE_MONEY' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              </div>

              {/* Champ Numéro de Téléphone */}
              <div className="pt-2 space-y-1.5">
                <label className="block text-xs font-bold text-forest-900 uppercase tracking-wider">
                  Numéro Mobile Money (Sénégal)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground-muted">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="77 000 00 00"
                    className="w-full pl-10 pr-4 py-3 bg-background-alt border border-border rounded-inner text-sm font-bold text-forest-950 focus:outline-none focus:border-forest-600 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-foreground-muted">
                  La demande de confirmation de paiement sera envoyée directement sur ce numéro.
                </p>
              </div>

              {/* Checkbox CGU Conforme au style PricePreviewWidget */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      onClick={() => setCguAccepted((v) => !v)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        cguAccepted
                          ? 'bg-forest-700 border-forest-700 shadow-[0_0_0_3px_rgba(20,101,76,0.15)]'
                          : 'border-border bg-background-card group-hover:border-forest-600'
                      }`}
                    >
                      {cguAccepted && <CheckCircle2 className="w-3.5 h-3.5 text-white fill-white" />}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-foreground-muted leading-relaxed">
                    J&apos;accepte les{' '}
                    <Link href="/cgu" target="_blank" className="text-forest-700 font-bold hover:underline underline-offset-2">
                      conditions de location
                    </Link>{' '}
                    et le{' '}
                    <span className="text-forest-700 font-bold">contrat de réservation</span>{' '}
                    qui seront envoyés à la confirmation.
                  </p>
                </label>
              </div>

              {/* Erreur éventuelle */}
              {error && (
                <div className="flex items-start gap-3 bg-error-50 border border-error-100 rounded-inner p-4">
                  <AlertCircle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-error-600 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Bouton de confirmation du paiement */}
              <button
                type="button"
                onClick={handlePay}
                disabled={!cguAccepted || loading || listingLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-4 px-6 font-bold rounded-pill text-base shadow-md transition-all active:scale-98',
                  cguAccepted && !loading
                    ? 'bg-lime-400 hover:bg-lime-300 text-forest-950 shadow-forest-900/10'
                    : 'bg-background-alt text-foreground-muted cursor-not-allowed',
                )}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Traitement en cours…</>
                ) : (
                  <>
                    Payer {fmt(typePaiement === 'DEPOSIT' && (listing?.acomptePourcentage ?? 30) < 100 ? Math.round(estimatedTotal * ((listing?.acomptePourcentage ?? 30) / 100)) : estimatedTotal)} FCFA avec {fournisseur === 'WAVE' ? 'Wave' : 'Orange Money'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Calendrier Disponibilités */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-background-card w-full max-w-lg rounded-t-card sm:rounded-card border border-border p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-forest-900">
                Sélectionnez vos dates
              </h3>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="w-8 h-8 rounded-full bg-background-alt border border-border flex items-center justify-center text-foreground hover:bg-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <AvailabilityCalendar
              compact
              minNights={listing?.nuitesMinimum ?? 1}
              onRangeChange={handleCalendarRangeSelect}
            />

            <button
              type="button"
              onClick={() => setShowCalendarModal(false)}
              className="w-full py-3 bg-forest-700 hover:bg-forest-800 text-white font-bold rounded-pill text-sm transition-colors"
            >
              Valider les dates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
