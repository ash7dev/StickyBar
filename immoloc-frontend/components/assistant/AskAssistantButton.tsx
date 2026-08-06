'use client';

import { Sparkles } from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant.store';
import { cn } from '@/lib/utils/cn';

interface AskAssistantButtonProps {
  label?: string;
  subject?: string;
  category?: 'RESERVATION' | 'PAIEMENT' | 'KYC' | 'LOGEMENT' | 'LITIGE' | 'AUTRE';
  reservationId?: string;
  logementId?: string;
  message?: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'lime';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AskAssistantButton({
  label = 'Demander un assistant',
  subject,
  category = 'RESERVATION',
  reservationId,
  logementId,
  message,
  variant = 'outline',
  size = 'md',
  className,
}: AskAssistantButtonProps) {
  const openAssistant = useAssistantStore((s) => s.openAssistant);

  const handleClick = () => {
    openAssistant({
      tab: 'faq',
      subject,
      category,
      reservationId,
      logementId,
      message,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all rounded-pill shadow-sm hover:scale-[1.02] active:scale-[0.98]',
        variant === 'primary' && 'bg-forest-950 text-neutral-0 hover:bg-forest-900',
        variant === 'lime' && 'bg-lime-400 text-forest-950 hover:bg-lime-500 font-bold',
        variant === 'outline' && 'border border-border bg-background-card text-foreground hover:bg-background-alt hover:border-forest-300',
        variant === 'ghost' && 'text-forest-700 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-950/40',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2.5 text-xs',
        size === 'lg' && 'px-5 py-3 text-sm',
        className,
      )}
    >
      <Sparkles className="h-4 w-4 text-lime-500 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
