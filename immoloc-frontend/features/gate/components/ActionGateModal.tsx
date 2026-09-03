'use client';

import { useState, useEffect } from 'react';
import { X, ShieldAlert, UserCheck, Smartphone, FileText, Camera, Lock } from 'lucide-react';
import type { GateStep, GateBlock } from '@/hooks/use-action-gate';
import { StepProfile }     from './steps/StepProfile';
import { StepPhoneVerify } from './steps/StepPhoneVerify';
import { StepKyc }         from './steps/StepKyc';
import { StepSelfie }      from './steps/StepSelfie';
import { cn } from '@/lib/utils/cn';

/* ─── Step metadata ───────────────────────────────────────────────────────── */

const STEP_META: Record<GateStep, {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  shortLabel: string;
}> = {
  profile: {
    title:      'Complétez votre profil',
    subtitle:   'Votre prénom, nom et date de naissance sont requis pour continuer.',
    icon:       UserCheck,
    shortLabel: 'Profil',
  },
  phone: {
    title:      'Vérifiez votre numéro',
    subtitle:   'Un code SMS sera envoyé pour confirmer votre identité.',
    icon:       Smartphone,
    shortLabel: 'Téléphone',
  },
  kyc: {
    title:      'Pièce d\'identité',
    subtitle:   'Uploadez votre carte d\'identité pour sécuriser votre compte.',
    icon:       FileText,
    shortLabel: 'Identité',
  },
  selfie: {
    title:      'Selfie de vérification',
    subtitle:   'Prenez une photo de votre visage pour confirmer votre identité.',
    icon:       Camera,
    shortLabel: 'Selfie',
  },
};

/* ─── Block screens ───────────────────────────────────────────────────────── */

function BlockScreen({ block }: { block: GateBlock }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="w-14 h-14 rounded-inner bg-error-50 border border-error-500/30 flex items-center justify-center">
        <ShieldAlert className="w-7 h-7 text-error-600" />
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">Compte suspendu</h3>
        <p className="text-xs text-foreground-muted mt-1.5 max-w-xs leading-relaxed">
          Votre compte a été temporairement suspendu. Contactez le support Klef pour plus d&apos;informations.
        </p>
      </div>
      <a
        href="mailto:support@klef.sn"
        className="btn-action text-xs px-6 justify-center"
      >
        Contacter le support
      </a>
    </div>
  );
}

/* ─── Premium Stepper ─────────────────────────────────────────────────────── */

function PremiumStepper({ steps, currentIdx }: { steps: GateStep[]; currentIdx: number }) {
  if (steps.length <= 1) return null;

  return (
    <div className="space-y-3">
      {/* Step circles + labels */}
      <nav aria-label="Progression de vérification" className="flex items-start">
        {steps.map((step, i) => {
          const meta = STEP_META[step];
          const Icon = meta.icon;
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;

          return (
            <div key={step} className="flex flex-1 items-start">
              <div className="flex w-full min-w-0 flex-col items-center gap-1.5">
                {/* Circle */}
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300',
                    isDone
                      ? 'border-forest-600 bg-forest-600 text-neutral-0 shadow-sm'
                      : isCurrent
                        ? 'border-forest-600 bg-forest-50 text-forest-700 shadow-sm ring-4 ring-forest-500/10'
                        : 'border-border bg-background-alt text-foreground-faint',
                  )}
                >
                  {isDone ? (
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>

                {/* Label */}
                <span
                  className={cn(
                    'text-center text-[10px] sm:text-xs font-semibold leading-tight transition-colors',
                    isDone
                      ? 'text-forest-700'
                      : isCurrent
                        ? 'text-foreground'
                        : 'text-foreground-faint',
                  )}
                >
                  {meta.shortLabel}
                </span>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-1 mt-4 h-0.5 flex-1 rounded-pill transition-all duration-500',
                    i < currentIdx ? 'bg-forest-600' : 'bg-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Step counter badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-background-alt px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
          <Lock className="h-2.5 w-2.5" aria-hidden="true" />
          Étape {currentIdx + 1} sur {steps.length}
        </span>
      </div>
    </div>
  );
}

/* ─── Modal ───────────────────────────────────────────────────────────────── */

interface Props {
  steps: GateStep[];
  block: GateBlock;
  onComplete: () => void;
  onCancel: () => void;
}

export function ActionGateModal({ steps, block, onComplete, onCancel }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => { setCurrentIdx(0); }, [steps.length]);

  function handleStepDone() {
    if (currentIdx < steps.length - 1) {
      setCurrentIdx((i) => i + 1);
      setAnimKey((k) => k + 1);
    } else {
      onComplete();
    }
  }

  const currentStep = steps[currentIdx];
  const meta = currentStep ? STEP_META[currentStep] : null;
  const Icon = meta?.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-xs"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-background-card rounded-card border border-border/80 shadow-2xl overflow-visible">

        {/* Decorative gradient halo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-forest-600/8 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-action/6 blur-3xl"
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-background-alt hover:bg-background-card border border-border text-foreground-muted hover:text-foreground flex items-center justify-center transition-colors z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative p-6 sm:p-7 space-y-5">

          {block ? (
            <BlockScreen block={block} />
          ) : meta && Icon ? (
            <>
              {/* Premium Stepper */}
              <PremiumStepper steps={steps} currentIdx={currentIdx} />

              {/* Icon + texte — animated on step change */}
              <div
                key={`header-${animKey}`}
                className="flex flex-col items-center gap-3 text-center pt-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="w-14 h-14 rounded-inner bg-forest-950 border border-forest-800 text-on-inverse-marker flex items-center justify-center shrink-0 shadow-xs">
                  <Icon className="w-7 h-7 text-on-inverse-marker" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{meta.title}</h2>
                  <p className="text-xs text-foreground-muted mt-1 max-w-sm leading-relaxed">{meta.subtitle}</p>
                </div>
              </div>

              {/* Formulaire — animated on step change */}
              <div
                key={`form-${animKey}`}
                className="animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both"
                style={{ animationDelay: '80ms' }}
              >
                {currentStep === 'profile' && <StepProfile onDone={handleStepDone} />}
                {currentStep === 'phone'   && <StepPhoneVerify onDone={handleStepDone} />}
                {currentStep === 'kyc'     && <StepKyc onDone={handleStepDone} />}
                {currentStep === 'selfie'  && <StepSelfie onDone={handleStepDone} />}
              </div>

              {/* Annuler + security note */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Plus tard
                </button>
                <p className="flex items-center gap-1 text-[10px] text-foreground-faint">
                  <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                  Vos données sont chiffrées et protégées
                </p>
              </div>
            </>
          ) : null}

        </div>
      </div>
    </div>
  );
}
