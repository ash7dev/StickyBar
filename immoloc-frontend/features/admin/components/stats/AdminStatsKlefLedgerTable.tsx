'use client';

import { useState } from 'react';
import { DollarSign, Search, Building2, User, Loader2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface KlefLedgerEntry {
  id: string;
  date: string;
  title?: string;
  ville?: string;
  locataire?: string;
  totalBrut: number;
  partHote: number;
  partKlef: number;
  typeGain: string;
}

interface AdminStatsKlefLedgerTableProps {
  entries: KlefLedgerEntry[];
  isLoading: boolean;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "0 FCFA";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminStatsKlefLedgerTable({ entries, isLoading }: AdminStatsKlefLedgerTableProps) {
  const [search, setSearch] = useState('');

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const t = (e.title ?? '').toLowerCase();
    const v = (e.ville ?? '').toLowerCase();
    const l = (e.locataire ?? '').toLowerCase();
    return t.includes(q) || v.includes(q) || l.includes(q) || e.id.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-6 shadow-2xs space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-forest-700" /> Journal Détaillé des Commissions (7%) & Gains Klef
          </h3>
          <p className="text-xs text-foreground-muted">Historique transaction par transaction de la part nette perçue par la plateforme</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer (logement, ville, client)..."
            className="h-9 w-full rounded-pill border border-border bg-background-card pl-9 pr-4 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-600 focus:outline-hidden"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-foreground-muted space-y-1">
          <DollarSign className="h-10 w-10 text-foreground-muted mx-auto opacity-30" />
          <p className="font-bold text-foreground">Aucune écriture comptable trouvée</p>
          <p>Aucun gain n'a été enregistré pour la période ou les filtres sélectionnés.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-background-alt/50 font-display text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
              <tr>
                <th className="py-3 px-4">Date & Réf.</th>
                <th className="py-3 px-4">Bien & Emplacement</th>
                <th className="py-3 px-4">Locataire Voyageur</th>
                <th className="py-3 px-4">Montant Total Brut</th>
                <th className="py-3 px-4">Part Hôte (93%)</th>
                <th className="py-3 px-4 text-right">Commission Net Klef (7%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-background-alt/30">
                  {/* Date */}
                  <td className="py-4 px-4 font-mono">
                    <p className="font-bold text-foreground">{formatDate(item.date)}</p>
                    <p className="text-[0.6875rem] text-foreground-muted">{item.id.slice(0, 8)}...</p>
                  </td>

                  {/* Bien */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5 max-w-xs">
                      <p className="font-bold text-foreground flex items-center gap-1 truncate">
                        <Building2 className="h-3.5 w-3.5 text-forest-600 shrink-0" />
                        {item.title ?? "Logement"}
                      </p>
                      {item.ville && <p className="text-[0.6875rem] text-foreground-muted">{item.ville}</p>}
                    </div>
                  </td>

                  {/* Locataire */}
                  <td className="py-4 px-4">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-forest-700" />
                      {item.locataire || "Voyageur"}
                    </p>
                  </td>

                  {/* Total Brut */}
                  <td className="py-4 px-4 font-display font-bold text-xs text-foreground">
                    {formatPrice(item.totalBrut)}
                  </td>

                  {/* Part Hôte */}
                  <td className="py-4 px-4 font-display text-xs text-foreground-muted">
                    {formatPrice(item.partHote)}
                  </td>

                  {/* Commission Net Klef */}
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center gap-1 font-display font-bold text-sm text-forest-800 bg-forest-50 px-2.5 py-1 rounded-pill border border-forest-200">
                      <ArrowUpRight className="h-3.5 w-3.5 text-forest-600" />
                      +{formatPrice(item.partKlef)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
