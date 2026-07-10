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
    <nav className="flex items-start w-full gap-1">
      {WIZARD_STEPS.map((step, index) => {
        const isDone     = completedSteps.has(index);
        const isActive   = currentStep === index;
        const isPast     = index < currentStep;
        const canClick   = isPast || isDone;

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => canClick && onStepClick?.(index)}
                disabled={!canClick}
                className={cn(
                  'relative w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all duration-500 select-none overflow-hidden',
                  isActive 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 scale-110 z-10' 
                    : (isDone || isPast)
                      ? 'bg-primary-500/80 text-white'
                      : 'bg-white/30 backdrop-blur-md border border-white/60 text-neutral-400',
                  canClick && !isActive && 'hover:bg-primary-50 hover:text-primary-600 hover:scale-105',
                  canClick && 'cursor-pointer',
                )}
              >
                {(isDone || isPast) && !isActive ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={4} />
                ) : (
                  <span>{index + 1}</span>
                )}
                
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-primary-400 -z-10" />
                )}
              </button>

              <span className={cn(
                'text-[8px] font-black uppercase tracking-[0.1em] text-center hidden sm:block transition-colors duration-300',
                isActive            ? 'text-primary-600' :
                isDone || isPast    ? 'text-primary-400' :
                                      'text-neutral-400',
              )}>
                {step.label}
              </span>
            </div>

            {index < WIZARD_STEPS.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 mb-4 sm:mb-5 bg-neutral-200/50 relative overflow-hidden rounded-full">
                <div
                  className="absolute inset-0 bg-primary-400 transition-transform duration-700 ease-in-out origin-left"
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
