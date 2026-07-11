/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft, MapPin, Users, ArrowRight,
  Loader2, AlertCircle, CheckCircle2, Lock,
} from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { listingsApi } from '@/lib/nestjs';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationCreatedResponse } from '@/lib/nestjs/types';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useActionGate } from '@/hooks/use-action-gate';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { cn } from '@/lib/utils/cn';

type Fournisseur = 'WAVE' | 'ORANGE_MONEY';

interface Props {
  searchParams: Promise<{
    listingId?: string;
    dateDebut?: string;
    dateFin?: string;
    personnes?: string;
  }>;
}

export default function ReserverPage({ searchParams }: Props) {
  const sp         = use(searchParams);
  const router     = useRouter();
  const { nestToken, hasHydrated, needsOnboarding } = useRoleStore();
  const { refreshIfNeeded, syncFromSupabaseSession } = useNestToken();

  const listingId   = sp.listingId  ?? '';
  const dateDebut   = sp.dateDebut  ?? '';
  const dateFin     = sp.dateFin    ?? '';
  const nbPersonnes = parseInt(sp.personnes ?? '1', 10);

  const [fournisseur, setFournisseur] = useState<Fournisseur>('WAVE');
  const [cguAccepted, setCguAccepted] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const { data: listing, isLoading: listingLoading } = useQuery({
    queryKey: ['listing-reserver', listingId],
    queryFn:  () => listingsApi.findOne(listingId),
    enabled:  !!listingId,
  });

  const nights = listingId && dateDebut && dateFin
    ? Math.round((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const { data: pricePreview } = useQuery({
    queryKey: ['price-preview-reserver', listingId, nights, nbPersonnes],
    queryFn:  () => listingsApi.getPricePreview(listingId, {
      dateDebut,
      dateFin,
      nbPersonnes,
    }),
    enabled:  !!listingId && nights > 0,
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

  if (!listingId || !dateDebut || !dateFin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-sm text-neutral-400">Paramètres de réservation manquants.</p>
        <Link href="/logements" className="text-sm font-bold text-emerald-600 hover:underline">
          Retour aux logements
        </Link>
      </div>
    );
  }

  const estimatedTotal = pricePreview
    ? pricePreview.totalLocataire
    : listing ? (listing.prixBase ?? 0) * nights : 0;
  const basePrice = pricePreview?.prixBase
    ?? (pricePreview && pricePreview.totalLocataire && pricePreview.supplementPersonnes !== undefined
      ? pricePreview.totalLocataire - pricePreview.supplementPersonnes
      : undefined)
    ?? listing?.prixBase
    ?? 0;

  const fmt = (n: any) => {
    if (n === null || n === undefined) return '-';
    const s = typeof n === 'object' && typeof n.toString === 'function' ? n.toString() : String(n);
    const v = parseFloat(s);
    return !isNaN(v) ? Math.round(v).toLocaleString('fr-FR') : '-';
  };
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const mainPhoto = listing?.photos.find((p) => p.estPrincipale) ?? listing?.photos[0];

  async function handlePay() {
    if (!cguAccepted) return;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Retour ── */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour au logement
        </button>

        {/* ── Titre ── */}
        <div>
          <h1 className="text-2xl font-black text-foreground">Finaliser la réservation</h1>
          <p className="text-sm text-foreground-muted mt-1">Vérifiez les détails puis choisissez votre moyen de paiement</p>
        </div>

        {/* ── Card logement ── */}
        <div className="bg-background-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Photo */}
          <div className="relative h-44 overflow-hidden">
            {listingLoading ? (
              <div className="w-full h-full bg-background-alt animate-pulse" />
            ) : mainPhoto ? (
              <>
                <Image src={mainPhoto.url} alt={listing?.titre ?? ''} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                {/* Badge durée */}
                <div className="absolute top-3 right-3 bg-success-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow">
                  {nights}j
                </div>
                {/* Info overlay */}
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-sm font-black text-white leading-tight line-clamp-1">
                    {listing?.titre}
                  </p>
                  <p className="text-[11px] text-white/75 font-medium mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {listing?.ville}{listing?.quartier ? `, ${listing.quartier}` : ''}
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-background-alt flex items-center justify-center">
                <p className="text-sm font-bold text-foreground-muted">{listing?.titre}</p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <div className="w-2 h-2 rounded-full border-2 border-foreground-muted shrink-0" />
              {fmtDate(dateDebut)}
            </div>
            <ArrowRight className="w-4 h-4 text-border-hover shrink-0" />
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <div className="w-2 h-2 rounded-full bg-foreground-muted shrink-0" />
              {fmtDate(dateFin)}
            </div>
            <div className="ml-auto">
              <span className="text-xs font-black text-success-600 bg-success-50 border border-success-100 px-2.5 py-1 rounded-lg">
                {nights} jour{nights > 1 ? 's' : ''}
              </span>
            </div>
            {nbPersonnes > 1 && (
              <div className="flex items-center gap-1 text-xs font-medium text-foreground-muted">
                <Users className="w-3.5 h-3.5" />
                {nbPersonnes}
              </div>
            )}
          </div>
        </div>

        {/* ── Récapitulatif prix ── */}
        <div className="bg-background-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-[10px] font-black text-foreground-muted uppercase tracking-widest">Récapitulatif du prix</p>
          </div>
          <div className="px-5 pb-4 space-y-3 mt-3">
            {listingLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-background-alt rounded-lg animate-pulse w-3/4" />
                <div className="h-4 bg-background-alt rounded-lg animate-pulse w-1/2" />
              </div>
            ) : listing ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">
                    {fmt(basePrice)} FCFA × {nights} {nights > 1 ? 'nuits' : 'nuit'}
                  </span>
                  <span className="font-bold text-foreground">{fmt(basePrice * nights)} FCFA</span>
                </div>
                {pricePreview && pricePreview.supplementPersonnes > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground-muted">
                      Supplément {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-warning-600">+{fmt(pricePreview.supplementPersonnes)} FCFA</span>
                  </div>
                )}
                {(pricePreview as any)?.detail && (
                  <p className="text-[11px] text-foreground-muted leading-relaxed">{(pricePreview as any).detail}</p>
                )}
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-foreground">Total à payer</span>
                  <span className="text-lg font-black text-success-600">{fmt(estimatedTotal)} FCFA</span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* ── Moyen de paiement ── */}
        <div className="bg-background-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-[10px] font-black text-foreground-muted uppercase tracking-widest">Moyen de paiement</p>
          </div>
          <div className="px-5 pb-4 space-y-2.5 mt-3">

            {/* Wave */}
            <button
              type="button"
              onClick={() => setFournisseur('WAVE')}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                fournisseur === 'WAVE'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-border bg-background-card hover:bg-background-alt',
              )}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border bg-background-card flex items-center justify-center">
                <Image src="/wavelogo.jpeg" alt="Wave" width={48} height={48} className="object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground">Wave</p>
                <p className="text-xs text-foreground-muted mt-0.5">Paiement mobile instantané · Sans frais</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                fournisseur === 'WAVE' ? 'border-emerald-500 bg-emerald-500' : 'border-border-hover',
              )}>
                {fournisseur === 'WAVE' && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
              </div>
            </button>

            {/* Orange Money */}
            <button
              type="button"
              onClick={() => setFournisseur('ORANGE_MONEY')}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left',
                fournisseur === 'ORANGE_MONEY'
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-border bg-background-card hover:bg-background-alt',
              )}
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border bg-background-card flex items-center justify-center">
                <Image src="/orangeMoneylogo.png" alt="Orange Money" width={48} height={48} className="object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground">Orange Money</p>
                <p className="text-xs text-foreground-muted mt-0.5">Paiement via votre compte Orange</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                fournisseur === 'ORANGE_MONEY' ? 'border-emerald-500 bg-emerald-500' : 'border-border-hover',
              )}>
                {fournisseur === 'ORANGE_MONEY' && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
              </div>
            </button>

            {/* Simulation notice */}
            <p className="text-[11px] text-foreground-muted text-center flex items-center justify-center gap-1.5 pt-1">
              <Lock className="w-3 h-3" />
              Simulation — Aucun vrai paiement ne sera effectué
            </p>
          </div>
        </div>

        {/* ── CGU ── */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <button
            type="button"
            onClick={() => setCguAccepted((v) => !v)}
            className={cn(
              'w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200',
              cguAccepted
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-border-hover bg-background-card group-hover:border-emerald-400',
            )}
          >
            {cguAccepted && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
          </button>
          <p className="text-sm text-foreground leading-relaxed">
            Accepter les conditions
            <br />
            <span className="text-xs text-foreground-muted">
              J&apos;accepte les{' '}
              <Link href="/cgu" target="_blank" className="text-emerald-600 font-semibold hover:underline">
                conditions générales
              </Link>{' '}
              et le{' '}
              <span className="text-emerald-600 font-semibold">contrat de réservation</span>
              . Je comprends que l&apos;annulation est soumise à la politique en vigueur.
            </span>
          </p>
        </label>

        {/* ── Erreur ── */}
        {error && (
          <div className="flex items-start gap-3 bg-error-50 border border-error-100 rounded-xl p-4">
            <AlertCircle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-error-600 leading-relaxed">{error}</p>
          </div>
        )}

        {/* ── Bouton payer ── */}
        <button
          onClick={handlePay}
          disabled={!cguAccepted || loading || listingLoading || !listing}
          className={cn(
            'w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black transition-all duration-200 active:scale-[0.98]',
            cguAccepted && !loading
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/30'
              : 'bg-background-alt text-foreground-muted cursor-not-allowed',
          )}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Traitement en cours…</>
          ) : (
            <>
              {/* Logo du moyen de paiement sélectionné */}
              <div className="w-6 h-6 rounded-md overflow-hidden bg-background-card flex items-center justify-center shrink-0">
                <Image
                  src={fournisseur === 'WAVE' ? '/wavelogo.jpeg' : '/orangeMoneylogo.png'}
                  alt={fournisseur === 'WAVE' ? 'Wave' : 'Orange Money'}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              Payer {listing ? `${fmt(estimatedTotal)} FCFA` : '…'}
            </>
          )}
        </button>

        {!cguAccepted && (
          <p className="text-center text-xs text-foreground-muted">
            Acceptez les conditions pour continuer
          </p>
        )}

        <p className="text-center text-[11px] text-foreground-muted">
          Paiement 100% sécurisé · Réservation instantanée
        </p>

      </div>
    </div>
  );
}
