'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';

import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ReservationCreatedResponse } from '@/lib/nestjs/types';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useActionGate } from '@/hooks/use-action-gate';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { cn } from '@/lib/utils/cn';

import { useReservation } from '@/features/reservations/hooks/use-reservation';
import { Alerte, Montant, SectionCard } from '@/features/reservations/components/primitives';
import { StaySection, DateSheet } from '@/features/reservations/components/StaySection';
import { PaymentSection, RappelSejour } from '@/features/reservations/components/PaymentSection';
import {
  BlocMontant,
  DetailTarifaire,
  SummaryRail,
} from '@/features/reservations/components/Summary';

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
  const gate = useActionGate();

  const listingId = sp.listingId ?? '';
  const r = useReservation({ listingId, ...sp });

  // Mobile : si les dates sont déjà complètes (choisies sur la fiche annonce),
  // on démarre DIRECTEMENT en Étape 2 (Paiement) sans repasser par le doublon du séjour !
  const datesInitialesCompletes = !!(sp.dateDebut && sp.dateFin);
  const [etape, setEtape] = useState<1 | 2>(datesInitialesCompletes ? 2 : 1);
  const [calendrierOuvert, setCalendrierOuvert] = useState(false);
  const [montreErreurs, setMontreErreurs] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreurApi, setErreurApi] = useState('');

  useEffect(() => {
    if (!hasHydrated || nestToken) return;
    let annule = false;

    void (async () => {
      const recupere = await syncFromSupabaseSession();
      const onboardingEnCours = useRoleStore.getState().needsOnboarding;
      if (!recupere && !onboardingEnCours && !annule) {
        const next = encodeURIComponent(
          `/reserver?listingId=${listingId}&dateDebut=${r.dateDebut}&dateFin=${r.dateFin}&personnes=${r.nbPersonnes}`,
        );
        router.replace(`/login?next=${next}`);
      }
    })();

    return () => {
      annule = true;
    };
  }, [
    hasHydrated,
    nestToken,
    listingId,
    r.dateDebut,
    r.dateFin,
    r.nbPersonnes,
    router,
    syncFromSupabaseSession,
  ]);

  // Changer d'étape sans remonter laisse l'utilisateur au milieu de l'écran
  // suivant, sur un contenu qu'il n'a pas encore lu.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [etape]);

  if (!hasHydrated) return null;

  if (needsOnboarding || gate.block || !gate.isReady) {
    return (
      <ActionGateModal
        steps={gate.steps}
        block={gate.block}
        onComplete={() => { }}
        onCancel={() => router.back()}
      />
    );
  }

  if (!nestToken) return null;

  if (!listingId) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-24 text-center">
        <h1 className="font-display text-xl font-semibold text-foreground">
          Cette réservation est incomplète
        </h1>
        <p className="text-sm text-foreground-muted">
          Le logement n&apos;est pas identifié. Repartez d&apos;une annonce pour choisir vos dates.
        </p>
        <Link href="/explorer" className="btn-primary">
          Voir les logements
        </Link>
      </main>
    );
  }

  async function payer() {
    setMontreErreurs(true);
    if (!r.peutPayer || envoi) return;

    setEnvoi(true);
    setErreurApi('');
    try {
      const token = (await refreshIfNeeded()) ?? '';
      const res = await nestFetch<ReservationCreatedResponse>(NEST_API.RESERVATIONS.CREATE, {
        method: 'POST',
        token,
        body: JSON.stringify(r.payload),
      });
      router.push(`/reservations/${res.reservationId}`);
    } catch (e: unknown) {
      setErreurApi(
        (e as Error)?.message ||
        "Le paiement n'a pas pu être lancé. Vérifiez votre connexion et réessayez.",
      );
      setEnvoi(false);
    }
  }

  function continuer() {
    setMontreErreurs(true);
    if (r.peutContinuer) {
      setMontreErreurs(false);
      setEtape(2);
    }
  }

  const enAttentePrix = r.pricing.estEstimation || r.previewLoading;

  return (
    <main className="bg-canvas min-h-screen pb-40 pt-3 sm:pt-4 lg:pb-20 lg:pt-8">
      {/* ═══ EN-TÊTE MOBILE ═══════════════════════════════════════════════ */}
      <header className="sticky top-[calc(env(safe-area-inset-top,0px)+3.75rem)] z-30 border-b border-border bg-background-card lg:hidden">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground transition-colors hover:bg-background-alt"
            aria-label="Revenir au logement"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <h1 className="truncate font-display text-base font-semibold text-foreground">
            Confirmer votre réservation
          </h1>
        </div>

        {/* Progression : deux segments. Un « 1/2 » dit la même chose en
            demandant une lecture — le filet se comprend sans être lu. */}
        <div aria-hidden className="flex gap-1 px-4 pb-2">
          <span className="h-0.5 flex-1 rounded-pill bg-forest-600" />
          <span
            className={cn(
              'h-0.5 flex-1 rounded-pill transition-colors',
              etape === 2 ? 'bg-forest-600' : 'bg-border',
            )}
          />
        </div>
      </header>

      {/* ═══ EN-TÊTE DESKTOP ══════════════════════════════════════════════ */}
      <div className="mx-auto hidden max-w-6xl px-6 pb-8 lg:block">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:text-forest-700"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Revenir au logement
        </button>
        <h1 className="font-display text-[2.5rem] font-semibold leading-[1.05] text-foreground">
          Confirmer votre réservation
        </h1>
        <p className="mt-2 max-w-md text-sm text-foreground-muted">
          Vérifiez les dates, choisissez votre moyen de paiement. Rien n&apos;est débité avant
          validation depuis votre téléphone.
        </p>
      </div>

      {/* ═══ CORPS ════════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl px-4 pt-3 lg:grid lg:grid-cols-12 lg:gap-10 lg:px-6 lg:pt-0">
        <div className="space-y-4 lg:col-span-7">
          {/* Étape 1 — le séjour (Mobile uniquement — sur Desktop le récapitulatif latéral contient déjà le séjour) */}
          <div className={cn(etape === 1 ? 'block' : 'hidden', 'lg:hidden')}>
            <StaySection r={r} ouvrirCalendrier={() => setCalendrierOuvert(true)} />

            {r.nights > 0 && (
              <SectionCard title="Détail du prix" className="mt-4 lg:hidden">
                <DetailTarifaire r={r} />
              </SectionCard>
            )}
          </div>

          {/* Étape 2 — le paiement */}
          <div className={cn(etape === 2 ? 'block' : 'hidden', 'space-y-4 lg:block lg:pt-0')}>
            <RappelSejour r={r} onModifier={() => setEtape(1)} className="lg:hidden" />
            <PaymentSection r={r} montreErreurs={montreErreurs} />
            <BlocMontant r={r} className="lg:hidden" />
            {erreurApi && <Alerte>{erreurApi}</Alerte>}
          </div>
        </div>

        {/* Rail collant — desktop uniquement */}
        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-24">
            <SummaryRail r={r}>
              {erreurApi && <Alerte>{erreurApi}</Alerte>}
              <button
                type="button"
                onClick={payer}
                disabled={envoi || enAttentePrix}
                className="btn-action w-full"
              >
                {envoi ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    Demande envoyée…
                  </>
                ) : (
                  <>
                    Payer <Montant value={r.pricing.aDebiter} pending={enAttentePrix} />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-foreground-muted">
                Vous validerez le paiement depuis {r.fournisseur === 'WAVE' ? 'Wave' : 'Orange Money'}.
              </p>
            </SummaryRail>
          </div>
        </aside>
      </div>

      {/* ═══ BARRE COLLANTE MOBILE ════════════════════════════════════════
          Conteneur flottant arrondi type carte (design identique au bouton hôte) */}
      <div className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-40 px-3 lg:hidden">
        <div className="section-inverse space-y-3 p-4 border border-forest-800/80 shadow-2xl backdrop-blur-xl">
          <div className="flex items-baseline justify-between gap-4 border-b border-border-inverse/30 pb-2.5">
            <span className="text-xs text-on-inverse-muted">
              {etape === 1
                ? 'Total du séjour'
                : r.pricing.enAcompte
                  ? `Acompte · ${r.pricing.acomptePct}%`
                  : 'À régler'}
            </span>
            <Montant
              value={etape === 1 ? r.pricing.total : r.pricing.aDebiter}
              pending={enAttentePrix}
              className="font-display text-2xl font-bold tracking-tight text-on-inverse-display"
            />
          </div>

          {etape === 1 ? (
            <>
              {montreErreurs && r.erreurs.dates && (
                <div className="mb-2">
                  <Alerte>{r.erreurs.dates}</Alerte>
                </div>
              )}
              <button type="button" onClick={continuer} className="btn-primary w-full">
                Continuer
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={payer}
              disabled={envoi || enAttentePrix}
              className="btn-action w-full"
            >
              {envoi ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  Demande envoyée…
                </>
              ) : (
                <>
                  Payer <Montant value={r.pricing.aDebiter} pending={enAttentePrix} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <DateSheet
        open={calendrierOuvert}
        onClose={() => setCalendrierOuvert(false)}
        minNights={r.minNights}
        nights={r.nights}
        onRangeChange={r.setPlage}
      />
    </main>
  );
}