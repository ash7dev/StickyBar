'use client';

import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, RefreshCw, ArrowRight,
  Shield, Check, X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { UserProfile, StatutKyc } from '../types';
import { KYC_CONFIG } from '../types';

interface Props {
  user: UserProfile;
  onKycClick?: () => void;
}

/* ─── Tonalité par statut ─────────────────────────────────────────────────
   L'ancienne version peignait tout en vert et lime quel que soit l'état :
   un KYC rejeté affichait un badge vert pulsant et un bouclier lime. */

type Tone = 'neutral' | 'gold' | 'warning' | 'error';

const KYC_TONE: Record<StatutKyc, Tone> = {
  NON_VERIFIE: 'neutral',
  EN_ATTENTE: 'warning',
  VERIFIE: 'gold',
  REJETE: 'error',
  A_RENOUVELER: 'warning',
  SUSPENDU: 'error',
};

const TONE_CLS: Record<Tone, { chip: string; dot: string; marker: string }> = {
  neutral: {
    chip: 'border-border bg-background-alt text-foreground-muted',
    dot: 'bg-forest-400',
    marker: 'text-on-inverse-muted',
  },
  gold: {
    chip: 'border-gold-200 bg-gold-50 text-gold-700',
    dot: 'bg-gold-400',
    marker: 'text-gold-300',
  },
  warning: {
    chip: 'border-warning-500/25 bg-warning-50 text-warning-700',
    dot: 'bg-warning-500',
    marker: 'text-warning-500',
  },
  error: {
    chip: 'border-error-500/25 bg-error-50 text-error-700',
    dot: 'bg-error-500',
    marker: 'text-error-500',
  },
};

const KYC_ICONS: Record<StatutKyc, React.ComponentType<{ className?: string }>> = {
  NON_VERIFIE: ShieldAlert,
  EN_ATTENTE: Clock,
  VERIFIE: ShieldCheck,
  REJETE: ShieldX,
  A_RENOUVELER: RefreshCw,
  SUSPENDU: ShieldX,
};

/* ─── Progression ─────────────────────────────────────────────────────────
   Table explicite : chaque statut décrit l'état de ses trois étapes.
   Impossible qu'un rejet s'affiche comme une étape franchie. */

type StepState = 'pending' | 'current' | 'done' | 'failed';

const STEP_LABELS = ['Soumission', 'Vérification', 'Validation'] as const;

const KYC_PROGRESS: Record<StatutKyc, [StepState, StepState, StepState]> = {
  NON_VERIFIE: ['current', 'pending', 'pending'],
  EN_ATTENTE: ['done', 'current', 'pending'],
  VERIFIE: ['done', 'done', 'done'],
  REJETE: ['done', 'failed', 'pending'],
  A_RENOUVELER: ['done', 'done', 'current'],
  SUSPENDU: ['done', 'done', 'failed'],
};

const STEP_CLS: Record<StepState, { circle: string; label: string; line: string }> = {
  done: {
    circle: 'border-forest-600 bg-forest-600 text-neutral-0',
    label: 'text-foreground',
    line: 'bg-forest-600',
  },
  current: {
    circle: 'border-forest-600 bg-background-card text-forest-700',
    label: 'text-foreground',
    line: 'bg-border',
  },
  failed: {
    circle: 'border-error-600 bg-error-600 text-neutral-0',
    label: 'text-error-700',
    line: 'bg-border',
  },
  pending: {
    circle: 'border-border bg-background-card text-foreground-muted',
    label: 'text-foreground-muted',
    line: 'bg-border',
  },
};

export function ProfileKycCard({ user, onKycClick }: Props) {
  const cfg = KYC_CONFIG[user.statutKyc];
  const Icon = KYC_ICONS[user.statutKyc];
  const tone = KYC_TONE[user.statutKyc] ?? 'neutral';
  const t = TONE_CLS[tone];
  const steps = KYC_PROGRESS[user.statutKyc] ?? KYC_PROGRESS.NON_VERIFIE;

  const doneCount = steps.filter((s) => s === 'done').length;

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <Shield className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-foreground">
              Vérification d’identité
            </h2>
            <p className="text-xs text-foreground-muted">Sécurité du compte</p>
          </div>
        </div>

        <span className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-semibold',
          t.chip,
        )}>
          <span
            aria-hidden="true"
            className={cn('h-1.5 w-1.5 rounded-pill', t.dot, user.statutKyc === 'EN_ATTENTE' && 'animate-pulse')}
          />
          {cfg.label}
        </span>
      </header>

      {/* ── Bloc statut ──────────────────────────────────────────────────── */}

      <div className="section-inverse relative overflow-hidden p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-pill bg-forest-700/40 blur-3xl"
        />
        <div className="relative flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-border-inverse bg-white/5">
            <Icon className={cn('h-5 w-5', t.marker)} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold text-on-inverse-display">
              {cfg.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-on-inverse-muted">
              {cfg.description}
            </p>
          </div>
        </div>
      </div>

      {/* ── Progression ──────────────────────────────────────────────────── */}

      <div
        className="space-y-3 rounded-inner border border-border bg-background-alt p-4"
        role="group"
        aria-label={`Progression de la vérification : ${doneCount} étape${doneCount > 1 ? 's' : ''} sur 3`}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Progression
        </p>

        <ol className="flex items-start">
          {STEP_LABELS.map((label, i) => {
            const state = steps[i];
            const s = STEP_CLS[state];
            const isLast = i === STEP_LABELS.length - 1;

            return (
              <li key={label} className="flex flex-1 items-start">
                <div className="flex w-full min-w-0 flex-col items-center gap-1.5">
                  <span className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-pill border-2 transition-colors',
                    s.circle,
                  )}>
                    {state === 'done' && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    {state === 'failed' && <X className="h-3.5 w-3.5" aria-hidden="true" />}
                    {state === 'current' && (
                      <span aria-hidden="true" className="h-2 w-2 rounded-pill bg-forest-600" />
                    )}
                    {state === 'pending' && (
                      <span aria-hidden="true" className="h-2 w-2 rounded-pill bg-border-hover" />
                    )}
                  </span>
                  <span className={cn('text-center text-xs font-semibold', s.label)}>
                    {label}
                  </span>
                </div>

                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn('mx-1 mt-3.5 h-0.5 flex-1 rounded-pill', s.line)}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Action ───────────────────────────────────────────────────────── */}

      {cfg.cta ? (
        /* ★ Seul aplat lime de la carte. */
        <button
          type="button"
          onClick={onKycClick}
          className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-action px-6 py-3 text-xs font-semibold text-on-action shadow-action transition-[background-color,box-shadow,transform] hover:bg-action-hover hover:shadow-action-hover active:scale-[0.98]"
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {cfg.cta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : user.statutKyc === 'VERIFIE' ? (
        <p className="flex items-center justify-center gap-2 rounded-pill border border-gold-200 bg-gold-50 py-3 text-xs font-semibold text-gold-700">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Identité confirmée par Klef
        </p>
      ) : user.statutKyc === 'EN_ATTENTE' ? (
        <p className="flex items-center justify-center gap-2 rounded-pill border border-warning-500/25 bg-warning-50 py-3 text-xs font-semibold text-warning-700">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Vérification en cours par nos équipes
        </p>
      ) : null}
    </section>
  );
}