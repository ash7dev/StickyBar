/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X, ChevronRight, Users, Moon, ShieldCheck, Lock,
  CheckCircle2, Minus, Plus, AlertCircle, Loader2, Info, Calendar,
} from 'lucide-react';
import { listingsApi } from '@/lib/nestjs';
import type { DateRange } from 'react-day-picker';
import type { TarifNuit, TarifPersonne } from '@/lib/nestjs';
import { useRoleStore } from '@/stores/role.store';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { useGatedAction } from '@/features/gate/hooks/use-gated-action';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { cn } from '@/lib/utils/cn';
import { useToastError } from '@/lib/hooks/use-toast-error';

interface Props {
  listingId: string;
  prixBase: number | string;
  nuitesMinimum: number;
  capaciteMax: number;
  ageMin?: number | null;
  personnesBase?: number;
  tarifsPersonnes?: TarifPersonne[];
  tarifsNuits?: TarifNuit[];
}

const fmt = (n: any) => {
  if (n === null || n === undefined) return '—';
  const s = typeof n === 'object' && typeof n.toString === 'function' ? n.toString() : String(n);
  const v = parseFloat(s);
  return !isNaN(v) ? Math.round(v).toLocaleString('fr-FR') : '—';
};

export function MobileReservationSheet({
  listingId,
  prixBase,
  nuitesMinimum,
  capaciteMax,
  ageMin,
  personnesBase,
  tarifsPersonnes,
  tarifsNuits,
}: Props) {
  const router = useRouter();
  const { nestToken, activeRole, hasHydrated } = useRoleStore();
  const { syncFromSupabaseSession } = useNestToken();
  const { showError, showInfo } = useToastError();

  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [range, setRange] = useState<DateRange | undefined>();
  const [cguAccepted, setCguAccepted] = useState(false);
  const [ageError, setAgeError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<import('@/lib/nestjs').PricePreviewResponse | null>(null);

  const nights =
    range?.from && range?.to
      ? Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

  // Prevent body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Fetch price preview
  useEffect(() => {
    if (!nights || !range?.from || !range?.to) {
      startTransition(() => setPreview(null));
      return;
    }
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

  function goToReserver() {
    if (!range?.from || !range?.to) return;
    const params = new URLSearchParams({
      listingId,
      dateDebut: range.from.toISOString().split('T')[0],
      dateFin: range.to.toISOString().split('T')[0],
      personnes: String(nbPersonnes),
    });
    router.push(`/reserver?${params.toString()}`);
  }

  const { gateState, trigger: triggerGate, complete: completeGate, cancel: cancelGate } = useGatedAction(goToReserver);

  async function handleBook() {
    setAgeError('');
    if (!hasHydrated) return;

    try {
      let activeNestToken = nestToken;
      if (!activeNestToken) activeNestToken = await syncFromSupabaseSession();
      const onboardingPending = useRoleStore.getState().needsOnboarding;

      if (!activeNestToken && onboardingPending) { triggerGate(); return; }
      if (!activeNestToken) {
        if (!range?.from || !range?.to) return;
        const reserverUrl = `/reserver?listingId=${listingId}&dateDebut=${range.from.toISOString().split('T')[0]}&dateFin=${range.to.toISOString().split('T')[0]}&personnes=${nbPersonnes}`;
        router.push(`/login?next=${encodeURIComponent(reserverUrl)}`);
        return;
      }

      if (ageMin && ageMin > 0) {
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
    } catch (error) {
      console.error('[MobileReservationSheet] Erreur lors de la vérification:', error);
      showError(error);
    }
  }

  return (
    <>
      {/* ── Barre sticky bas ───────────────────────────────────── */}
      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 z-50"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        {/* Gradient fade */}
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background-card/80 to-transparent pointer-events-none" />

        <div className="mx-3 mb-2 px-4 py-3 rounded-2xl bg-background-card border border-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
          {/* Prix */}
          <div>
            <p className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest mb-0.5">DÈS</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-foreground">{fmt(prixAffiche)}</span>
              <span className="text-xs font-bold text-foreground-muted">FCFA<span className="text-foreground-muted"> /</span> nuit</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl shadow-lg shadow-emerald-500/30 active:scale-[0.97] transition-all"
          >
            Réserver
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Backdrop ───────────────────────────────────────────── */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-[60] bg-overlay backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setOpen(false)}
      />

      {/* ── Bottom Sheet ───────────────────────────────────────── */}
      <div
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-background-card rounded-t-[2rem] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <h2 className="text-base font-black text-foreground">Réserver ce logement</h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl bg-background-alt flex items-center justify-center text-foreground-muted hover:bg-border transition-colors active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <div className="px-4 pt-4 pb-8 space-y-5">

            {/* ── Champs de date ── */}
            <div className="bg-background-alt border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-foreground-muted" />
                <span className="text-sm font-black text-foreground">Dates de séjour</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Date d'arrivée */}
                <button
                  onClick={() => setShowCalendar(true)}
                  className="flex flex-col gap-1.5 p-3 rounded-xl bg-background-card border-2 border-border hover:border-emerald-300 transition-colors active:scale-95"
                >
                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wide">Arrivée</span>
                  <span className="text-sm font-black text-foreground">
                    {range?.from ? `${range.from.getDate()} ${range.from.toLocaleDateString('fr-FR', { month: 'short' })}.` : 'Date arrivée'}
                  </span>
                </button>

                {/* Date de départ */}
                <button
                  onClick={() => setShowCalendar(true)}
                  className="flex flex-col gap-1.5 p-3 rounded-xl bg-background-card border-2 border-border hover:border-emerald-300 transition-colors active:scale-95"
                >
                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wide">Départ</span>
                  <span className="text-sm font-black text-foreground">
                    {range?.to ? `${range.to.getDate()} ${range.to.toLocaleDateString('fr-FR', { month: 'short' })}.` : 'Date départ'}
                  </span>
                </button>
              </div>

              {nights > 0 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <Moon className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600">
                    {nights} nuit{nights > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* ── Calendrier (affiché conditionnellement) ── */}
            {showCalendar && (
              <div className="bg-background-card border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-foreground">Sélectionnez vos dates</span>
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="w-7 h-7 rounded-lg bg-background-alt flex items-center justify-center text-foreground-muted hover:bg-border transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <AvailabilityCalendar
                  onRangeChange={(newRange) => {
                    setRange(newRange);
                    // Fermer le calendrier seulement si les deux dates sont sélectionnées ET différentes
                    if (newRange?.from && newRange?.to && newRange.from.getTime() !== newRange.to.getTime()) {
                      setTimeout(() => setShowCalendar(false), 400);
                    }
                  }}
                  minNights={nuitesMinimum}
                  compact
                />
              </div>
            )}

            {/* ── Voyageurs ── */}
            <div className="bg-background-alt border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-foreground-muted" />
                  <span className="text-sm font-black text-foreground">Voyageurs</span>
                </div>
                <span className="text-xs font-medium text-foreground-muted">max {capaciteMax}</span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setNbPersonnes((p) => Math.max(1, p - 1))}
                  disabled={nbPersonnes <= 1}
                  className="w-10 h-10 rounded-xl bg-background-card border border-border shadow-sm flex items-center justify-center text-foreground active:scale-90 disabled:opacity-30 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <p className="text-2xl font-black text-foreground leading-none">{nbPersonnes}</p>
                  <p className="text-[10px] text-foreground-muted mt-0.5">{nbPersonnes === 1 ? 'voyageur' : 'voyageurs'}</p>
                </div>
                <button
                  onClick={() => setNbPersonnes((p) => Math.min(capaciteMax, p + 1))}
                  disabled={nbPersonnes >= capaciteMax}
                  className="w-10 h-10 rounded-xl bg-background-card border border-border shadow-sm flex items-center justify-center text-foreground active:scale-90 disabled:opacity-30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {personnesBase != null && (
                <div className="flex items-start gap-2 pt-1 border-t border-border">
                  <Info className="w-3.5 h-3.5 text-gold-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gold-700 leading-relaxed">
                    {nbPersonnes <= personnesBase
                      ? <><strong>{personnesBase} voyageur{personnesBase > 1 ? 's' : ''} inclus</strong> dans le tarif de base.</>
                      : <>Supplément applicable au-delà de {personnesBase} voyageur{personnesBase > 1 ? 's' : ''}.</>
                    }
                  </p>
                </div>
              )}
            </div>

            {/* ── Récap prix ── */}
            {nights > 0 && (
              <div className="bg-emerald-800 rounded-2xl p-5 space-y-3 shadow-xl shadow-emerald-900/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-emerald-100/80 font-medium">
                    <Moon className="w-4 h-4 text-emerald-100/80" />
                    {fmt(prixAffiche)} × {nights} nuit{nights > 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-white">{fmt(prixAffiche * nights)} FCFA</span>
                </div>

                {preview && preview.supplementPersonnes > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-emerald-100/80 font-medium">
                      <Users className="w-4 h-4 text-emerald-100/80" />
                      Supplément {nbPersonnes} voyageur{nbPersonnes > 1 ? 's' : ''}
                    </span>
                    <span className="font-bold text-gold-400">+{fmt(preview.supplementPersonnes)} FCFA</span>
                  </div>
                )}

                {preview && preview.reductionNuits > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-emerald-100/80 font-medium">
                      <Moon className="w-4 h-4 text-emerald-100/80" />
                      Réduction séjour long
                    </span>
                    <span className="font-bold text-emerald-200">−{fmt(preview.reductionNuits)} FCFA</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-emerald-700 pt-3">
                  <span className="font-black text-white text-sm">Total</span>
                  <div className="flex items-center gap-2">
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />}
                    <span className="font-black text-white text-xl tracking-tight">{fmt(estimatedTotal)} FCFA</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── CGU ── */}
            <label className="flex items-start gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setCguAccepted((v) => !v)}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200',
                  cguAccepted
                    ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_0_3px_rgba(20,101,76,0.15)]'
                    : 'border-border bg-background-card',
                )}
              >
                {cguAccepted && <CheckCircle2 className="w-3 h-3 text-white fill-white" />}
              </button>
              <p className="text-xs font-medium text-foreground-muted leading-relaxed">
                J&apos;accepte les{' '}
                <Link href="/cgu" target="_blank" className="text-emerald-600 font-bold hover:underline">
                  conditions
                </Link>{' '}
                et le{' '}
                <span className="text-emerald-600 font-bold">contrat</span>.
              </p>
            </label>

            {/* ── Erreur âge ── */}
            {ageError && (
              <div className="flex items-start gap-2.5 bg-error-50 border border-error-100 rounded-xl p-3.5">
                <AlertCircle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-error-600 leading-relaxed">{ageError}</p>
              </div>
            )}

            {/* ── CTA ── */}
            <button
              onClick={handleBook}
              disabled={!canBook || !hasHydrated}
              className={cn(
                'w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-black transition-all duration-200 active:scale-[0.98]',
                canBook && hasHydrated
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/30'
                  : 'bg-background-alt text-foreground-muted cursor-not-allowed',
              )}
            >
              {!hasHydrated ? 'Chargement…'
                : !hasRange ? 'Sélectionnez vos dates'
                : !cguAccepted ? 'Acceptez les conditions'
                : (
                  <>
                    Confirmer et réserver
                    <ChevronRight className="w-4 h-4" />
                  </>
                )
              }
            </button>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              {[
                { icon: ShieldCheck, text: 'Séquestre', sub: 'garanti' },
                { icon: Lock, text: 'Paiement', sub: 'sécurisé' },
                { icon: CheckCircle2, text: 'Annulation', sub: 'flexible' },
              ].map(({ icon: Icon, text, sub }) => (
                <div key={text} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-xl bg-success-50 border border-success-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-success-500" />
                  </div>
                  <span className="text-[10px] font-black text-foreground">{text}</span>
                  <span className="text-[10px] font-medium text-foreground-muted">{sub}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-foreground-muted">
              Débité après confirmation du propriétaire
            </p>
          </div>
        </div>
      </div>

      {/* Gate modal */}
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
