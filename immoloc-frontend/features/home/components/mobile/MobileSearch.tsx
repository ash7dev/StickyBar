'use client';

import { Search, SlidersHorizontal } from 'lucide-react';

export function MobileSearch() {
  return (
    <div className="bg-background px-4 pt-4 pb-6">
      <div className="relative">
        <div className="flex items-center gap-3 bg-background-card border border-border rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] transition-transform cursor-pointer">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground leading-tight">Où souhaitez-vous aller ?</p>
            <p className="text-[11px] text-foreground-muted">Dakar • N'importe quand • 2 voyageurs</p>
          </div>
          <div className="w-10 h-10 flex items-center justify-center text-foreground-muted border-l border-border pl-2">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
