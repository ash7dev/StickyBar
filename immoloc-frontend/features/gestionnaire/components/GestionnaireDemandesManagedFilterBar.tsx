'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type LeadStatusFilter = 'ALL' | 'NOUVEAU' | 'CONTACTE' | 'CONVERTI' | 'ARCHIVE';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeStatus: LeadStatusFilter;
  onStatusChange: (status: LeadStatusFilter) => void;
}

export function GestionnaireDemandesManagedFilterBar({
  searchQuery,
  onSearchChange,
  activeStatus,
  onStatusChange,
}: Props) {
  return (
    <div
      className="rounded-card border shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
    >
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--foreground-muted)' }}
        />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, email ou ville…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-pill border pl-10 pr-4 py-2.5 text-xs font-medium outline-none transition-colors bg-white [color-scheme:light]"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: 'ALL', label: 'Tous' },
          { id: 'NOUVEAU', label: '⚡ Nouveaux' },
          { id: 'CONTACTE', label: 'En cours' },
          { id: 'CONVERTI', label: '✓ Convertis' },
          { id: 'ARCHIVE', label: 'Archivés' },
        ].map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id as LeadStatusFilter)}
              className={cn(
                'px-3.5 py-2 text-xs font-bold rounded-pill transition-all cursor-pointer',
                isActive
                  ? 'bg-white text-forest-900 shadow-2xs border border-forest-200/80'
                  : 'bg-neutral-100/70 text-foreground-muted hover:text-foreground border border-transparent',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
