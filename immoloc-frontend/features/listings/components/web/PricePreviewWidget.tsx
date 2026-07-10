'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Moon, ShieldCheck, Loader2, ChevronRight,
  CalendarDays, Lock, Info, CheckCircle2, Minus, Plus, AlertCircle,
} from 'lucide-react';
import { listingsApi } from '@/lib/nestjs';
import type { DateRange } from 'react-day-picker';
import type { TarifNuit, TarifPersonne } from '@/lib/nestjs';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useGatedAction } from '@/features/gate/hooks/use-gated-action';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { AvailabilityCalendar } from './AvailabilityCalendar';

interface Props {
  listingId: string;
  prixBase: number | string;
  nuitesMinimum: number;
  capaciteMax: number;
  ageMin?: number | null;
  personnesBase?: number;
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
  tarifsPersonnes,
  tarifsNuits,
  disabledDates = [],
}: Props) {
  const router = useRouter();
  const { nestToken, dateNaissance, hasHydrated, needsOnboarding } = useRoleStore();
  const { syncFromSupabaseSession } = useNestToken();

  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [range, setRange] = useState<DateRange | undefined>();
  const [preview, setPreview] = useState<import('@/lib/nestjs').PricePreviewResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cguAccepted, setCguAccepted] = useState(false);
  const [ageError, setAgeError] = useState('');

  const nights =
    range?.from && range?.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  useEffect(() => {
    if (!nights) { setPreview(null); return; }
    if (!range?.from || !range?.to) return;
    const from = range.from;
    const to = range.to;
    startTransition(async () => {
      try {
        const result = await listingsApi.getPricePreview(listingId, {
          dateDebut: from.toISOString().split('T')[0],
          dateFin: to.toISOString().split('T')[0],
          nbPersonnes,
        });
        setPreview(result);
      } catch {
        setPreview(null);
      }
    });
  }, [listingId, nbPersonnes, nights, range]);

  const hasRange = !!(range?.from && range?.to);
  const canBook = hasRange && cguAccepted;
  const prixBaseNum = typeof prixBase === 'string' ? parseFloat(prixBase) : prixBase;
  const prixAffiche = Math.round(prixBaseNum * 1.07);
  const estimatedTotal = preview
    ? preview.totalLocataire
    : prixAffiche * Math.max(nights, nuitesMinimum);

  const fmt = (n: any) => {
    if (n === null || n === undefined) return '—';
    const s = typeof n === 'object' && typeof n.toString === 'function' ? n.toString() : String(n);
    const v = parseFloat(s);
    return !isNaN(v) ? Math.round(v).toLocaleString('fr-FR') : '—';
  };

  function goToReserver() {
    if (!range?.from || !range?.to) return;
    const params = new URLSearchParams({
      listingId,
      dateDebut: range.from.toISOString().split('T')[0],
      dateFin:   range.to.toISOString().split('T')[0],
      personnes: String(nbPersonnes),
    });
    router.push(`/reserver?${params.toString()}`);
  }

  const { gateState, trigger: triggerGate, complete: completeGate, cancel: cancelGate } = useGatedAction(goToReserver);

  async function handleBook() {
    setAgeError('');

    if (!hasHydrated) return;

    let activeNestToken = nestToken;

    if (!activeNestToken) {
      activeNestToken = await syncFromSupabaseSession();
    }

    const onboardingPending = useRoleStore.getState().needsOnboarding;

    if (!activeNestToken && onboardingPending) {
      triggerGate();
      return;
    }

    if (!activeNestToken) {
      if (!range?.from || !range?.to) return;
      const reserverUrl = `/reserver?listingId=${listingId}&dateDebut=${range.from.toISOString().split('T')[0]}&dateFin=${range.to.toISOString().split('T')[0]}&personnes=${nbPersonnes}`;
      router.push(`/login?next=${encodeURIComponent(reserverUrl)}`);
      return;
    }

    if (ageMin && ageMin > 0) {
      // dateNaissance peut être null si l'utilisateur a complété son profil après connexion
      // → forcer un sync pour récupérer la valeur fraîche depuis le backend
      let currentDateNaissance = useRoleStore.getState().dateNaissance;
      if (!currentDateNaissance) {
        await syncFromSupabaseSession();
        currentDateNaissance = useRoleStore.getState().dateNaissance;
      }

      if (!currentDateNaissance) {
        setAgeError(`Ce logement est réservé aux personnes de ${ageMin} ans et plus. Veuillez compléter votre profil.`);
        return;
      }
      const dob = new Date(currentDateNaissance);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (age < ageMin) {
        setAgeError(`Ce logement est réservé aux personnes de ${ageMin} ans et plus. Vous avez ${age} ans.`);
        return;
      }
    }

    triggerGate();
  }

  return (
    <div className="bg-background-card rounded-[2rem] border border-border shadow-[0_8px_40px_-8px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">

      {/* ── Header prix ─────────────────────────────────────────────── */}
      <div className="px-7 pt-7 pb-5 bg-gradient-to-b from-background-alt/80 to-background-card border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 border border-primary-100 text-primary-600 text-[9px] font-black uppercase tracking-widest rounded-lg mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              Disponible
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-foreground tracking-tight">{fmt(prixAffiche)}</span>
              <span className="text-sm font-bold text-foreground-muted">FCFA&nbsp;/&nbsp;nuit</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {nuitesMinimum > 1 && (
                <p className="text-xs font-medium text-foreground-muted">
                  Min. {nuitesMinimum} nuit{nuitesMinimum > 1 ? 's' : ''}
                </p>
              )}
              {tarifsNuits && tarifsNuits.length > 1 && (
                <span className="text-[9px] font-black text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                  Tarif dégressif
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary-500" />
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">

        {/* ── Calendrier ──────────────────────────────────────────────── */}
        <div>
          <AvailabilityCalendar
            onRangeChange={setRange}
            disabledDates={disabledDates}
            minNights={nuitesMinimum}
            compact
          />
        </div>

        {/* ── Voyageurs ───────────────────────────────────────────────── */}
        <div className="border-t border-border pt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-foreground-muted" />
              <span className="text-xs font-black text-foreground uppercase tracking-wider">Voyageurs</span>
            </div>
            {capaciteMax > 1 && (
              <span className="text-[10px] font-medium text-primary-500 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full">
                Tarif dynamique
              </span>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between bg-background-alt border border-border rounded-2xl p-2">
            <button
              onClick={() => setNbPersonnes((p) => Math.max(1, p - 1))}
              disabled={nbPersonnes <= 1}
              className="w-10 h-10 rounded-xl bg-background-card border border-border shadow-sm flex items-center justify-center text-foreground-muted hover:text-primary-600 hover:border-primary-200 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="text-xl font-black text-foreground leading-none">{nbPersonnes}</div>
              <div className="text-[10px] font-medium text-foreground-muted mt-0.5">
                {nbPersonnes === 1 ? 'voyageur' : 'voyageurs'} · max {capaciteMax}
              </div>
            </div>

            <button
              onClick={() => setNbPersonnes((p) => Math.min(capaciteMax, p + 1))}
              disabled={nbPersonnes >= capaciteMax}
              className="w-10 h-10 rounded-xl bg-background-card border border-border shadow-sm flex items-center justify-center text-foreground-muted hover:text-primary-600 hover:border-primary-200 hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Hint voyageurs — précis si personnesBase connu, générique sinon */}
          {(personnesBase != null || (tarifsPersonnes && tarifsPersonnes.length > 0)) && (
            <div className="flex items-start gap-2 mt-2.5 px-3 py-2.5 bg-gold-50/70 border border-gold-100 rounded-xl">
              <Info className="w-3.5 h-3.5 text-gold-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-gold-700 leading-relaxed">
                {personnesBase != null ? (
                  nbPersonnes <= personnesBase
                    ? <><strong>{personnesBase} voyageur{personnesBase > 1 ? 's' : ''} inclus</strong> dans le tarif de base — aucun supplément pour votre sélection.</>
                    : <>Supplément applicable au-delà de {personnesBase} voyageur{personnesBase > 1 ? 's' : ''} — le total est calculé ci-dessous.</>
                ) : (
                  <>Un supplément peut s&apos;appliquer selon le nombre de voyageurs. Le total sera calculé ci-dessous.</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* ── Détail prix ─────────────────────────────────────────────── */}
        {nights > 0 && (
          <div className="bg-neutral-900 rounded-[1.5rem] p-5 space-y-3 shadow-xl shadow-neutral-900/10 animate-in fade-in slide-in-from-bottom-3 duration-300">

            {/* Ligne nuits */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-foreground-muted">
                <Moon className="w-4 h-4 text-foreground-muted" />
                <span className="font-medium">
                  {fmt(prixAffiche)} × {nights} nuit{nights > 1 ? 's' : ''}
                </span>
              </div>
              <span className="font-bold text-white">{fmt(prixAffiche * nights)} FCFA</span>
            </div>

            {/* Supplément personnes */}
            {preview && preview.supplementPersonnes > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Users className="w-4 h-4 text-foreground-muted" />
                  <span className="font-medium">
                    Supplément {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="font-bold text-gold-400">+{fmt(preview.supplementPersonnes)} FCFA</span>
              </div>
            )}

            {preview && preview.reductionNuits > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Moon className="w-4 h-4 text-foreground-muted" />
                  <span className="font-medium">Réduction séjour long</span>
                </div>
                <span className="font-bold text-primary-400">−{fmt(preview.reductionNuits)} FCFA</span>
              </div>
            )}

            {/* Total */}
            <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
              <span className="font-black text-white">Total estimé</span>
              <div className="flex items-center gap-2">
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" />}
                <span className="font-black text-white text-xl tracking-tight">
                  {fmt(estimatedTotal)} FCFA
                </span>
              </div>
            </div>

            <p className="text-[10px] font-medium text-foreground-muted text-right">Aucune surprise · Prix fixe garanti</p>
          </div>
        )}

        {/* ── Checkbox CGU ─────────────────────────────────────────────── */}
        <div className="border-t border-border pt-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            {/* Custom checkbox */}
            <div className="flex-shrink-0 mt-0.5">
              <div
                onClick={() => setCguAccepted((v) => !v)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                  cguAccepted
                    ? 'bg-primary-500 border-primary-500 shadow-[0_0_0_3px_rgba(20,101,76,0.15)]'
                    : 'border-border bg-background-card group-hover:border-primary-400'
                }`}
              >
                {cguAccepted && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
              </div>
            </div>
            <p className="text-xs font-medium text-foreground-muted leading-relaxed">
              J&apos;accepte les{' '}
              <Link href="/cgu" target="_blank" className="text-primary-600 font-bold hover:underline underline-offset-2">
                conditions de location
              </Link>{' '}
              et le{' '}
              <span className="text-primary-600 font-bold">contrat de réservation</span>{' '}
              qui seront envoyés à la confirmation.
            </p>
          </label>
        </div>

        {/* ── Erreur âge minimum ───────────────────────────────────────── */}
        {ageError && (
          <div className="flex items-start gap-3 bg-error-50 border border-error-100 rounded-2xl p-4 -mb-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-error-700 leading-relaxed">{ageError}</p>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <button
          onClick={handleBook}
          disabled={!canBook || !hasHydrated}
          className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 font-black rounded-2xl text-[15px] transition-all duration-300 ${
            canBook && hasHydrated
              ? 'bg-primary-600 text-white shadow-[0_8px_25px_rgba(20,101,76,0.30)] hover:bg-primary-700 hover:shadow-[0_12px_32px_rgba(20,101,76,0.40)] hover:-translate-y-0.5 active:translate-y-0'
              : 'bg-background-alt text-foreground-muted cursor-not-allowed'
          }`}
        >
          {!hasHydrated
            ? 'Chargement...'
            : !hasRange
            ? 'Sélectionnez vos dates'
            : !cguAccepted
              ? 'Acceptez les conditions'
              : 'Réserver maintenant'}
          <ChevronRight className={`w-4 h-4 transition-transform ${canBook ? 'group-hover:translate-x-0.5' : ''}`} />
        </button>

        {/* Raison désactivation */}
        {!canBook && (hasRange || nbPersonnes > 0) && (
          <div className="flex flex-col gap-1.5 -mt-2">
            {!hasRange && (
              <div className="flex items-center gap-2 text-[11px] font-medium text-foreground-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
                Choisissez vos dates d&apos;arrivée et de départ
              </div>
            )}
            {hasRange && !cguAccepted && (
              <div className="flex items-center gap-2 text-[11px] font-medium text-gold-600">
                <div className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                Acceptez les conditions pour continuer
              </div>
            )}
          </div>
        )}

        {/* ── Trust signals ────────────────────────────────────────────── */}
        <div className="border-t border-border pt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { icon: ShieldCheck, text: 'Séquestre', sub: 'garanti' },
            { icon: Lock, text: 'Paiement', sub: 'sécurisé' },
            { icon: CheckCircle2, text: 'Annulation', sub: 'flexible' },
          ].map(({ icon: Icon, text, sub }, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary-500" />
              </div>
              <span className="text-[10px] font-black text-foreground">{text}</span>
              <span className="text-[10px] font-medium text-foreground-muted">{sub}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] font-medium text-foreground-muted">
          Aucun débit avant confirmation du propriétaire
        </p>
      </div>

      {gateState.open && (
        <ActionGateModal
          steps={gateState.steps}
          block={gateState.block}
          onComplete={completeGate}
          onCancel={cancelGate}
        />
      )}
    </div>
  );
}
