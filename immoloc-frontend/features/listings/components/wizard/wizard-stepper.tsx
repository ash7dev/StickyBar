'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const WIZARD_STEPS = [
  { id: 'bien', label: 'Le bien' },
  { id: 'annonce', label: 'Annonce' },
  { id: 'equipements', label: 'Équipements' },
  { id: 'conditions', label: 'Règles' },
  { id: 'photos', label: 'Photos' },
  { id: 'confirmation', label: 'Récap' },
] as const;

interface WizardStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({ currentStep, completedSteps, onStepClick }: WizardStepperProps) {
  return (
    <nav aria-label="Progression de la création d’annonce">
      <ol className="flex w-full items-start gap-0.5 sm:gap-1">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = currentStep === index;
          const isDone = completedSteps.has(index) || index < currentStep;
          const canClick = isDone && !isActive;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-start">
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => canClick && onStepClick?.(index)}
                  disabled={!canClick}
                  aria-current={isActive ? 'step' : undefined}
                  /* Le libellé n'existait qu'en `sm:block` : sur mobile, le
                     bouton n'annonçait qu'un chiffre nu. */
                  aria-label={`Étape ${index + 1} sur ${WIZARD_STEPS.length} — ${step.label}${isDone ? ', terminée' : isActive ? ', en cours' : ', à venir'
                    }`}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-inner border text-xs font-semibold transition-colors duration-200',
                    isActive
                      ? 'border-forest-600 bg-forest-600 text-neutral-0'
                      : isDone
                        ? 'border-forest-100 bg-forest-50 text-forest-700'
                        : 'border-border bg-background-alt text-foreground-muted',
                    canClick && 'cursor-pointer hover:border-forest-300 hover:bg-forest-100',
                    !canClick && !isActive && 'cursor-default',
                  )}
                >
                  {isDone && !isActive ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <span className="tabular-nums">{index + 1}</span>
                  )}
                </button>

                <span
                  className={cn(
                    'hidden text-center text-xs font-semibold leading-tight sm:block',
                    isActive
                      ? 'text-forest-700'
                      : isDone
                        ? 'text-foreground'
                        : 'text-foreground-muted',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < WIZARD_STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className="relative mx-1 mt-4 h-0.5 flex-1 overflow-hidden rounded-pill bg-border"
                >
                  <div
                    className="absolute inset-0 origin-left rounded-pill bg-forest-600 transition-transform duration-500 ease-out"
                    style={{ transform: `scaleX(${isDone ? 1 : 0})` }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}