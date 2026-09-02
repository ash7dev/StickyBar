'use client';

import { Calendar, Download, FileSpreadsheet, Filter, Search } from 'lucide-react';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  onExportCSV: () => void;
  onOpenStatementModal: () => void;
}

export function GestionnaireFinancesFilterBar({
  searchQuery,
  onSearchChange,
  selectedMonth,
  onMonthChange,
  onExportCSV,
  onOpenStatementModal,
}: Props) {
  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search & Month Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-faint" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher transaction, bailleur, bien..."
            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-pill border border-border bg-white text-neutral-900 placeholder:text-foreground-faint focus:outline-none focus:border-forest-600 shadow-2xs"
          />
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Calendar className="w-4 h-4 text-forest-600 shrink-0 hidden sm:block" />
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full sm:w-auto text-xs sm:text-sm rounded-pill border border-border bg-white text-neutral-900 px-4 py-2.5 font-semibold focus:outline-none focus:border-forest-600 shadow-2xs cursor-pointer [color-scheme:light]"
          >
            <option value="ALL" className="bg-white text-neutral-900">Toutes les périodes</option>
            <option value="2026-09" className="bg-white text-neutral-900">Septembre 2026</option>
            <option value="2026-08" className="bg-white text-neutral-900">Août 2026</option>
            <option value="2026-07" className="bg-white text-neutral-900">Juillet 2026</option>
          </select>
        </div>
      </div>

      {/* Export & Statement Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
        <button
          type="button"
          onClick={onExportCSV}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-pill border border-border bg-white hover:bg-neutral-100 text-xs font-bold text-foreground transition-colors cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-forest-600" />
          <span>Exporter CSV</span>
        </button>

        <button
          type="button"
          onClick={onOpenStatementModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-pill border border-forest-200 bg-forest-50 hover:bg-forest-100 text-xs font-bold text-forest-900 transition-colors cursor-pointer shadow-2xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-forest-700" />
          <span>Fiche de Décompte Bailleur</span>
        </button>
      </div>
    </div>
  );
}
