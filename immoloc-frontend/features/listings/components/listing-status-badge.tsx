import { cn } from '@/lib/utils/cn';

export type ListingStatut =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'PAUSED'
  | 'REJECTED'
  | 'SUSPENDED';

const STATUT_CONFIG: Record<
  string,
  { label: string; className: string; dotClass: string }
> = {
  DRAFT: {
    label: 'Brouillon',
    className:
      'bg-background-alt text-foreground-muted border-border font-extrabold shadow-2xs',
    dotClass: 'bg-foreground-faint',
  },
  PENDING_REVIEW: {
    label: 'En révision',
    className:
      'bg-amber-400 text-amber-950 border-amber-500/40 font-extrabold shadow-2xs',
    dotClass: 'bg-amber-950 animate-pulse',
  },
  PUBLISHED: {
    label: 'Publiée',
    className:
      'bg-action text-on-action border-action-edge font-black shadow-sm tracking-wide',
    dotClass: 'bg-forest-950 animate-pulse',
  },
  PAUSED: {
    label: 'En pause',
    className:
      'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-2xs',
    dotClass: 'bg-amber-600',
  },
  REJECTED: {
    label: 'Rejetée',
    className:
      'bg-rose-500 text-white border-rose-600 font-extrabold shadow-2xs',
    dotClass: 'bg-white',
  },
  SUSPENDED: {
    label: 'Suspendue',
    className:
      'bg-orange-500 text-white border-orange-600 font-extrabold shadow-2xs',
    dotClass: 'bg-white',
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
