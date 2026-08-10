'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AdminUsersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AdminUsersPagination({ page, totalPages, total, onPageChange }: AdminUsersPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-background-card px-4 py-3">
      <p className="text-xs text-foreground-muted">
        <span className="font-semibold text-foreground">{total}</span> utilisateur{total > 1 ? "s" : ""} au total — Page{" "}
        <span className="font-semibold text-foreground">{page}</span> / {totalPages}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-inner border border-border bg-background-card text-foreground-muted hover:bg-background-alt disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-inner border text-xs font-semibold transition-colors",
                pageNum === page
                  ? "border-forest-300 bg-forest-50 text-forest-800"
                  : "border-border bg-background-card text-foreground hover:bg-background-alt",
              )}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-inner border border-border bg-background-card text-foreground-muted hover:bg-background-alt disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
