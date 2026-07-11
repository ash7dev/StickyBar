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
  color: string;
  bg: string;
}> = {
  profile: {
    title:    'Complétez votre profil',
    subtitle: 'Votre prénom, nom et date de naissance sont requis pour continuer.',
    icon:     UserCheck,
    color:    'text-emerald-600',
    bg:       'bg-emerald-50 border-emerald-100',
  },
  phone: {
    title:    'Vérifiez votre numéro',
    subtitle: 'Un code SMS sera envoyé pour confirmer votre identité.',
    icon:     Smartphone,
    color:    'text-emerald-600',
    bg:       'bg-emerald-50 border-emerald-100',
  },
  kyc: {
    title:    'Vérification d\'identité',
    subtitle: 'Uploadez le recto et le verso de votre CNI pour sécuriser votre compte.',
    icon:     FileText,
    color:    'text-violet-600',
    bg:       'bg-violet-50 border-violet-100',
  },
  selfie: {
    title:    'Selfie de vérification',
    subtitle: 'Prenez une photo de votre visage pour confirmer votre identité.',
    icon:     Camera,
    color:    'text-blue-600',
    bg:       'bg-blue-50 border-blue-100',
  },
};

/* ─── Block screens ───────────────────────────────────────────────────────── */

function BlockScreen({ block }: { block: GateBlock }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
        <ShieldAlert className="w-7 h-7 text-rose-500" />
      </div>
      <div>
        <p className="text-base font-bold text-neutral-900">Compte suspendu</p>
        <p className="text-sm text-neutral-400 mt-1.5 max-w-xs leading-relaxed">
          Votre compte a été suspendu. Contactez le support ImmoLoc pour plus d&apos;informations.
        </p>
      </div>
      <a
        href="mailto:support@immoloc.sn"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors"
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
            'h-1 rounded-full flex-1 transition-all duration-400',
            i <= current ? 'bg-emerald-500' : 'bg-neutral-200',
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/10">

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>

        <div className="px-7 pb-7 pt-7 space-y-6">

          {block ? (
            <BlockScreen block={block} />
          ) : meta && Icon ? (
            <>
              {/* Progress */}
              {steps.length > 1 && (
                <div className="space-y-1.5">
                  <ProgressBar total={steps.length} current={currentIdx} />
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest text-right">
                    {currentIdx + 1} / {steps.length}
                  </p>
                </div>
              )}

              {/* Icon + texte */}
              <div className="flex flex-col items-center gap-4 text-center pt-1">
                <div className={cn('w-16 h-16 rounded-2xl border flex items-center justify-center', meta.bg)}>
                  <Icon className={cn('w-7 h-7', meta.color)} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-neutral-900">{meta.title}</h2>
                  <p className="text-sm text-neutral-400 mt-1.5 max-w-sm leading-relaxed">{meta.subtitle}</p>
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
              <div className="flex justify-center">
                <button
                  onClick={onCancel}
                  className="text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
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
