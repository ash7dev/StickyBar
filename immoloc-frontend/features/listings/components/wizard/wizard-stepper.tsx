'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const WIZARD_STEPS = [
  { id: 'bien',         label: 'Le bien'    },
  { id: 'annonce',      label: 'Annonce'    },
  { id: 'equipements',  label: 'Équipements'},
  { id: 'conditions',   label: 'Règles'     },
  { id: 'photos',       label: 'Photos'     },
  { id: 'confirmation', label: 'Récap'      },
] as const;

interface WizardStepperProps {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
}

export function WizardStepper({ currentStep, completedSteps, onStepClick }: WizardStepperProps) {
  return (
    <nav className="flex items-center sm:items-start w-full gap-0.5 sm:gap-1">
      {WIZARD_STEPS.map((step, index) => {
        const isDone   = completedSteps.has(index);
        const isActive = currentStep === index;
        const isPast   = index < currentStep;
        const canClick = isPast || isDone;

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => canClick && onStepClick?.(index)}
                disabled={!canClick}
                className={cn(
                  'relative w-8 h-8 sm:w-9 sm:h-9 rounded-inner flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all duration-300 select-none overflow-hidden',
                  isActive
                    ? 'bg-forest-950 text-lime-300 border border-lime-400/30 scale-105 sm:scale-110 shadow-xs z-10 font-display'
                    : (isDone || isPast)
                    ? 'bg-forest-600 text-lime-300'
                    : 'bg-background-alt text-foreground-faint border border-border',
                  canClick && !isActive && 'hover:bg-background-card hover:text-foreground cursor-pointer hover:scale-105',
                )}
              >
                {(isDone || isPast) && !isActive ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-lime-300" strokeWidth={3} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              <span className={cn(
                'eyebrow text-[9px] text-center hidden sm:block transition-colors duration-200',
                isActive         ? 'text-forest-600 font-bold' :
                isDone || isPast ? 'text-foreground font-semibold' :
                                   'text-foreground-faint',
              )}>
                {step.label}
              </span>
            </div>

            {index < WIZARD_STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-0.5 sm:mx-1.5 mb-0 sm:mb-5 bg-border/60 relative overflow-hidden rounded-full">
                <div
                  className="absolute inset-0 bg-forest-600 transition-transform duration-500 ease-in-out origin-left"
                  style={{ transform: isPast ? 'scaleX(1)' : 'scaleX(0)' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
