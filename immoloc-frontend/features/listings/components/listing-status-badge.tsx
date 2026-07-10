import { cn } from '@/lib/utils/cn';

export type ListingStatut =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'REJECTED'
  | 'SUSPENDED';

const STATUT_CONFIG: Record<
  ListingStatut,
  { label: string; className: string; dotClass: string }
> = {
  DRAFT: {
    label: 'Brouillon',
    className:
      'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
    dotClass: 'bg-neutral-400',
  },
  PENDING_REVIEW: {
    label: 'En révision',
    className:
      'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  PUBLISHED: {
    label: 'Publiée',
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40',
    dotClass: 'bg-emerald-500',
  },
  PAUSED: {
    label: 'En pause',
    className:
      'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/40',
    dotClass: 'bg-blue-500',
  },
  REJECTED: {
    label: 'Rejetée',
    className:
      'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border-red-200/60 dark:border-red-800/40',
    dotClass: 'bg-red-500',
  },
  SUSPENDED: {
    label: 'Suspendue',
    className:
      'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200/60 dark:border-orange-800/40',
    dotClass: 'bg-orange-500',
  },
};

interface ListingStatusBadgeProps {
  statut: ListingStatut;
  size?: 'sm' | 'md';
}

export function ListingStatusBadge({ statut, size = 'sm' }: ListingStatusBadgeProps) {
  const config = STATUT_CONFIG[statut];
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        config.className,
      )}
    >
      <div className={cn('rounded-full shrink-0', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', config.dotClass)} />
      {config.label}
    </div>
  );
}
