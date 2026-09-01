'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface StepDefinition {
  id: string;
  label: string;
}

export const WIZARD_STEPS: StepDefinition[] = [
  { id: 'bien', label: 'Le bien' },
  { id: 'annonce', label: 'Annonce' },
  { id: 'equipements', label: 'Équipements' },
  { id: 'conditions', label: 'Règles' },
  { id: 'photos', label: 'Photos' },
  { id: 'confirmation', label: 'Récap' },
];

export const GESTIONNAIRE_WIZARD_STEPS: StepDefinition[] = [
  { id: 'proprietaire', label: 'Propriétaire' },
  { id: 'bien', label: 'Le bien' },
  { id: 'annonce', label: 'Annonce' },
  { id: 'equipements', label: 'Équipements' },
  { id: 'conditions', label: 'Règles' },
  { id: 'photos', label: 'Photos' },
  { id: 'confirmation', label: 'Récap' },
];

interface WizardStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  steps?: StepDefinition[];
  onStepClick?: (step: number) => void;
}

export function WizardStepper({
  currentStep,
  completedSteps,
  steps = WIZARD_STEPS,
  onStepClick,
}: WizardStepperProps) {
  return (
    <nav aria-label="Progression de la création d’annonce">
      <ol className="flex w-full items-start gap-0.5 sm:gap-1">
        {steps.map((step, index) => {
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
                  aria-label={`Étape ${index + 1} sur ${steps.length} — ${step.label}${isDone ? ', terminée' : isActive ? ', en cours' : ', à venir'
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
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                <span
                  className={cn(
                    'hidden text-[11px] font-medium leading-none sm:block',
                    isActive
                      ? 'font-semibold text-foreground'
                      : isDone
                        ? 'text-forest-700'
                        : 'text-foreground-muted',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'mt-4.5 h-0.5 w-full flex-1 transition-colors duration-200',
                    isDone ? 'bg-forest-600' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}