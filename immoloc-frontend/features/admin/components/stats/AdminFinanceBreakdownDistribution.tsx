'use client';

import { MapPin, Building2, TrendingUp, Layers } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CityBreakdown {
  ville: string;
  gmv: number;
  commissions: number;
  count: number;
  logementsCount?: number;
  sharePct?: number;
}

interface TypeBreakdown {
  type: string;
  gmv: number;
  commissions: number;
  count: number;
}

interface AdminFinanceBreakdownDistributionProps {
  breakdownByCity: CityBreakdown[];
  breakdownByType: TypeBreakdown[];
  isLoading: boolean;
}

function fmt(n?: number) {
  if (n == null) return '0 FCFA';
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

const TYPE_LABELS: Record<string, string> = {
  VILLA: 'Villas d’Exception',
  APPARTEMENT: 'Appartements & Meublés',
  STUDIO: 'Studios & Lofts',
  CHAMBRE: 'Chambres Hôtes',
};

export function AdminFinanceBreakdownDistribution({
  breakdownByCity,
  breakdownByType,
  isLoading,
}: AdminFinanceBreakdownDistributionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="card p-6 h-64 bg-background-alt rounded-card" />
        <div className="card p-6 h-64 bg-background-alt rounded-card" />
      </div>
    );
  }

  const totalCommissionsCity = breakdownByCity.reduce((acc, c) => acc + c.commissions, 0) || 1;
  const totalCommissionsType = breakdownByType.reduce((acc, c) => acc + c.commissions, 0) || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── 1. Répartition Financière par Ville ────────────────────────────── */}
      <div className="bg-background-card rounded-card border border-border p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-inner bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-forest-950">
                Performance par Ville
              </h3>
              <p className="text-xs text-foreground-muted">
                Répartition géographique du volume brut et des commissions
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2.5 py-1 rounded-pill border border-forest-100">
            {breakdownByCity.length} Villes
          </span>
        </div>

        {breakdownByCity.length === 0 ? (
          <p className="text-xs text-foreground-muted py-6 text-center">Aucune donnée géographique disponible sur cette période.</p>
        ) : (
          <div className="space-y-4">
            {breakdownByCity.map((item, i) => {
              const pct = item.sharePct ?? Math.round((item.commissions / totalCommissionsCity) * 100);
              return (
                <div key={item.ville || i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-forest-950 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-forest-600" />
                      <span>{item.ville}</span>
                      {item.logementsCount != null && (
                        <span className="text-[10px] text-foreground-muted font-normal">
                          ({item.logementsCount} bien{item.logementsCount > 1 ? 's' : ''})
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground-muted font-medium">{fmt(item.gmv)} GMV</span>
                      <span className="font-bold text-forest-700 tabular-nums">{fmt(item.commissions)}</span>
                    </div>
                  </div>

                  {/* Jauge de part de marché */}
                  <div className="w-full h-2.5 rounded-pill bg-background-alt border border-border/60 overflow-hidden flex">
                    <div
                      className="h-full bg-forest-600 rounded-pill transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Répartition par Type de Logement ────────────────────────────── */}
      <div className="bg-background-card rounded-card border border-border p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-inner bg-lime-400/20 border border-lime-400/30 flex items-center justify-center text-forest-900">
              <Building2 className="w-4 h-4 text-forest-800" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-forest-950">
                Performance par Type d’Hébergement
              </h3>
              <p className="text-xs text-foreground-muted">
                Contribution au chiffre d'affaires par catégorie
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2.5 py-1 rounded-pill border border-forest-100">
            {breakdownByType.length} Catégories
          </span>
        </div>

        {breakdownByType.length === 0 ? (
          <p className="text-xs text-foreground-muted py-6 text-center">Aucune donnée par type disponible sur cette période.</p>
        ) : (
          <div className="space-y-4">
            {breakdownByType.map((item, i) => {
              const label = TYPE_LABELS[item.type] ?? item.type;
              const pct = Math.round((item.commissions / totalCommissionsType) * 100);
              return (
                <div key={item.type || i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-forest-950 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-forest-600" />
                      <span>{label}</span>
                      <span className="text-[10px] text-foreground-muted font-normal">
                        ({item.count} séjour{item.count > 1 ? 's' : ''})
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground-muted font-medium">{fmt(item.gmv)} GMV</span>
                      <span className="font-bold text-forest-700 tabular-nums">{fmt(item.commissions)}</span>
                    </div>
                  </div>

                  {/* Jauge de part par type */}
                  <div className="w-full h-2.5 rounded-pill bg-background-alt border border-border/60 overflow-hidden flex">
                    <div
                      className="h-full bg-gold-400 rounded-pill transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
