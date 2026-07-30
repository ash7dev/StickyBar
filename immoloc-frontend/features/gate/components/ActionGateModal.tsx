'use client';

import { useState, useEffect } from 'react';
import { X, ShieldAlert, UserCheck, Smartphone, FileText, Camera } from 'lucide-react';
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
}> = {
  profile: {
    title:    'Complétez votre profil',
    subtitle: 'Votre prénom, nom et date de naissance sont requis pour continuer.',
    icon:     UserCheck,
  },
  phone: {
    title:    'Vérifiez votre numéro',
    subtitle: 'Un code SMS sera envoyé pour confirmer votre identité.',
    icon:     Smartphone,
  },
  kyc: {
    title:    'Vérification d\'identité',
    subtitle: 'Uploadez le recto et le verso de votre CNI pour sécuriser votre compte.',
    icon:     FileText,
  },
  selfie: {
    title:    'Selfie de vérification',
    subtitle: 'Prenez une photo de votre visage pour confirmer votre identité.',
    icon:     Camera,
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

/* ─── Progress bar ────────────────────────────────────────────────────────── */

function ProgressBar({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-pill flex-1 transition-all duration-300',
            i <= current ? 'bg-forest-600' : 'bg-border/80',
          )}
        />
      ))}
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

  useEffect(() => { setCurrentIdx(0); }, [steps.length]);

  function handleStepDone() {
    if (currentIdx < steps.length - 1) {
      setCurrentIdx((i) => i + 1);
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

        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-background-alt hover:bg-background-card border border-border text-foreground-muted hover:text-foreground flex items-center justify-center transition-colors z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 space-y-6">

          {block ? (
            <BlockScreen block={block} />
          ) : meta && Icon ? (
            <>
              {/* Progress */}
              {steps.length > 1 && (
                <div className="space-y-1.5">
                  <ProgressBar total={steps.length} current={currentIdx} />
                  <p className="eyebrow text-[10px] text-right">
                    Étape {currentIdx + 1} / {steps.length}
                  </p>
                </div>
              )}

              {/* Icon + texte */}
              <div className="flex flex-col items-center gap-3.5 text-center pt-1">
                <div className="w-14 h-14 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Icon className="w-7 h-7 text-lime-400" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{meta.title}</h2>
                  <p className="text-xs text-foreground-muted mt-1 max-w-sm leading-relaxed">{meta.subtitle}</p>
                </div>
              </div>

              {/* Formulaire */}
              <div>
                {currentStep === 'profile' && <StepProfile onDone={handleStepDone} />}
                {currentStep === 'phone'   && <StepPhoneVerify onDone={handleStepDone} />}
                {currentStep === 'kyc'     && <StepKyc onDone={handleStepDone} />}
                {currentStep === 'selfie'  && <StepSelfie onDone={handleStepDone} />}
              </div>

              {/* Annuler */}
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </>
          ) : null}

        </div>
      </div>
    </div>
  );
}
