'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminReviewsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AdminReviewsPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: AdminReviewsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
      <p className="text-foreground-muted">
        Affichage de la page <span className="font-bold text-foreground">{page}</span> sur{' '}
        <span className="font-bold text-foreground">{totalPages}</span> ({total} avis au total)
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Précédent
        </button>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-40"
        >
          Suivant <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
