'use client';

import { useState } from 'react';
import { MapPin, Home, TrendingUp, BarChart3, LineChart, Building2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TimeSeriesPoint {
  date: string;
  gmv: number;
  commissions: number;
  penalties: number;
  netKlef: number;
  count: number;
}

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

interface AdminStatsChartsProps {
  timeSeries: TimeSeriesPoint[];
  breakdownByCity: CityBreakdown[];
  breakdownByType: TypeBreakdown[];
  isLoading: boolean;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "0 FCFA";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

// Fonction utilitaire pour générer une courbe lissée SVG (Cubic Bezier)
function buildSmoothSvgPath(points: Array<{ x: number; y: number }>): { dLine: string; dArea: string } {
  if (points.length === 0) return { dLine: '', dArea: '' };
  if (points.length === 1) {
    const p = points[0];
    return {
      dLine: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
      dArea: `M ${p.x - 20} 180 L ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} 180 Z`,
    };
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  const firstX = points[0].x;
  const lastX = points[points.length - 1].x;
  const dArea = `${d} L ${lastX} 180 L ${firstX} 180 Z`;

  return { dLine: d, dArea };
}

export function AdminStatsCharts({
  timeSeries,
  breakdownByCity,
  breakdownByType,
  isLoading,
}: AdminStatsChartsProps) {
  const [chartType, setChartType] = useState<'CURVE' | 'BARS'>('CURVE');
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);

  const rawMax = Math.max(...timeSeries.map((t) => t.netKlef), 0);
  const maxNetKlef = rawMax > 0 ? rawMax : 10000;

  const rawMaxCity = Math.max(...breakdownByCity.map((c) => c.commissions), 0);
  const maxCityComm = rawMaxCity > 0 ? rawMaxCity : 1;

  // Construction des points pour la courbe SVG (200px de hauteur utile)
  const svgWidth = 800;
  const svgHeight = 200;
  const paddingX = 40;
  const paddingY = 20;

  const points = timeSeries.map((pt, i) => {
    const x =
      timeSeries.length === 1
        ? svgWidth / 2
        : paddingX + (i / (timeSeries.length - 1)) * (svgWidth - 2 * paddingX);
    const ratio = pt.netKlef / maxNetKlef;
    const y = svgHeight - paddingY - ratio * (svgHeight - 2 * paddingY);
    return { x, y, pt };
  });

  const { dLine, dArea } = buildSmoothSvgPath(points);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* 1. Graphique d'Évolution (Courbe Lissée SVG / Histogramme) */}
      <div className="lg:col-span-2 rounded-card border border-border bg-background-card p-6 shadow-2xs space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-forest-700" /> Évolution du Chiffre d'Affaires Net Klef
            </h3>
            <p className="text-xs text-foreground-muted">Courbe lissée des commissions (7%) et retentions sur la période</p>
          </div>

          <div className="flex items-center gap-1 rounded-pill border border-border bg-background-alt p-1">
            <button
              type="button"
              onClick={() => setChartType('CURVE')}
              className={cn(
                'inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold transition-all',
                chartType === 'CURVE'
                  ? 'bg-forest-700 text-neutral-0 shadow-2xs'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <LineChart className="h-3.5 w-3.5" /> Courbe
            </button>
            <button
              type="button"
              onClick={() => setChartType('BARS')}
              className={cn(
                'inline-flex items-center gap-1 rounded-pill px-3 py-1 text-xs font-semibold transition-all',
                chartType === 'BARS'
                  ? 'bg-forest-700 text-neutral-0 shadow-2xs'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Barres
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-xs text-foreground-muted">Chargement du graphique...</div>
        ) : timeSeries.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-xs text-foreground-muted space-y-1">
            <TrendingUp className="h-8 w-8 text-foreground-muted opacity-40" />
            <p className="font-bold text-foreground">Aucune donnée de revenus sur la période</p>
            <p>Le graphique apparaîtra dès la première réservation confirmée.</p>
          </div>
        ) : chartType === 'CURVE' ? (
          /* Courbe SVG Lissée avec Gradient */
          <div className="relative h-64 w-full pt-4">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="klefCurveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-forest-700, #1b4332)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--color-forest-700, #1b4332)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Lignes de Grille Horizontal */}
              <line x1="0" y1="20" x2={svgWidth} y2="20" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2={svgWidth} y2="100" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />
              <line x1="0" y1="180" x2={svgWidth} y2="180" stroke="currentColor" strokeOpacity="0.15" />

              {/* Zone Sous la Courbe (Area Gradient) */}
              <path d={dArea} fill="url(#klefCurveGradient)" />

              {/* Ligne Principale (Stroke Curve) */}
              <path d={dLine} fill="none" stroke="var(--color-forest-700, #1b4332)" strokeWidth="3" strokeLinecap="round" />

              {/* Points Nœuds Interactifs */}
              {points.map(({ x, y, pt }) => (
                <g key={pt.date} className="cursor-pointer group" onMouseEnter={() => setHoveredPoint(pt)} onMouseLeave={() => setHoveredPoint(null)}>
                  <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="var(--color-forest-700, #1b4332)" strokeWidth="3" className="transition-transform group-hover:scale-150" />
                  <circle cx={x} cy={y} r="12" fill="var(--color-forest-700, #1b4332)" fillOpacity="0.15" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </g>
              ))}
            </svg>

            {/* Label Tooltip Hover */}
            {hoveredPoint && (
              <div className="absolute top-2 right-4 z-20 rounded-card border border-forest-300 bg-forest-950 p-3 text-neutral-0 text-xs shadow-xl space-y-1 animate-fade-in">
                <p className="font-bold border-b border-forest-800 pb-1">{hoveredPoint.date}</p>
                <p>Part Net Klef (7%) : <strong className="text-forest-300">{formatPrice(hoveredPoint.netKlef)}</strong></p>
                <p className="text-foreground-muted">Volume Brut (GMV) : {formatPrice(hoveredPoint.gmv)}</p>
                <p className="text-foreground-muted">Séjours confirmés : {hoveredPoint.count}</p>
              </div>
            )}

            {/* Légende Axe X */}
            <div className="flex items-center justify-between text-[0.625rem] font-mono text-foreground-muted pt-2 border-t border-border">
              <span>{timeSeries[0]?.date}</span>
              <span>{timeSeries[Math.floor(timeSeries.length / 2)]?.date}</span>
              <span>{timeSeries[timeSeries.length - 1]?.date}</span>
            </div>
          </div>
        ) : (
          /* Histogramme (Barres) avec Hauteur Fixe Garantis */
          <div className="relative h-64 w-full flex flex-col justify-between pt-2">
            <div className="h-48 w-full flex items-end gap-1.5 overflow-x-auto no-scrollbar">
              {timeSeries.map((pt) => {
                const heightPct = rawMax > 0 ? Math.max(Math.round((pt.netKlef / maxNetKlef) * 100), 6) : 6;
                return (
                  <div
                    key={pt.date}
                    className="flex-1 min-w-[2rem] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Bar Track Container */}
                    <div className="w-full h-full bg-background-alt/50 border border-border/40 rounded-t-inner overflow-hidden flex items-end">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={cn(
                          "w-full transition-all duration-300 rounded-t-inner",
                          pt.netKlef > 0 ? "bg-forest-700 group-hover:bg-forest-600 shadow-2xs" : "bg-forest-300/40"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tooltip Hover pour Mode Barres */}
            {hoveredPoint && (
              <div className="absolute top-0 right-4 z-20 rounded-card border border-forest-300 bg-forest-950 p-3 text-neutral-0 text-xs shadow-xl space-y-1 animate-fade-in">
                <p className="font-bold border-b border-forest-800 pb-1">{hoveredPoint.date}</p>
                <p>Part Net Klef (7%) : <strong className="text-forest-300">{formatPrice(hoveredPoint.netKlef)}</strong></p>
                <p className="text-foreground-muted">Volume Brut (GMV) : {formatPrice(hoveredPoint.gmv)}</p>
                <p className="text-foreground-muted">Séjours confirmés : {hoveredPoint.count}</p>
              </div>
            )}

            {/* Axe des dates sous les barres */}
            <div className="flex items-center justify-between text-[0.625rem] font-mono text-foreground-muted pt-2 border-t border-border">
              <span>{timeSeries[0]?.date}</span>
              <span>{timeSeries[Math.floor(timeSeries.length / 2)]?.date}</span>
              <span>{timeSeries[timeSeries.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Répartition par Ville & Zone Géographique (Enrichi) */}
      <div className="rounded-card border border-border bg-background-card p-6 shadow-2xs space-y-5">
        <div>
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-forest-700" /> Performance par Ville
          </h3>
          <p className="text-xs text-foreground-muted">Classement des hubs géographiques générateurs de commissions</p>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-foreground-muted">Chargement des données géographiques...</div>
        ) : breakdownByCity.length === 0 ? (
          <div className="py-8 text-center text-xs text-foreground-muted">Aucune ville enregistrée</div>
        ) : (
          <div className="space-y-3.5">
            {breakdownByCity.slice(0, 6).map((c, index) => {
              const widthPct = rawMaxCity > 0 ? Math.max(Math.round((c.commissions / maxCityComm) * 100), 5) : 5;

              return (
                <div key={c.ville} className="space-y-1 text-xs rounded-inner border border-border/60 bg-background-alt/30 p-2.5 transition-colors hover:bg-background-alt">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] font-bold",
                        index === 0 ? "bg-gold-400 text-gold-950 font-black" :
                        index === 1 ? "bg-border text-foreground font-bold" :
                        "bg-background-card text-foreground-muted border border-border"
                      )}>
                        #{index + 1}
                      </span>
                      <span className="font-bold text-foreground">{c.ville}</span>
                      {c.logementsCount != null && (
                        <span className="text-[0.625rem] font-semibold text-foreground-muted bg-background-card px-1.5 py-0.5 rounded-inner border border-border flex items-center gap-0.5">
                          <Building2 className="h-3 w-3 text-forest-600" /> {c.logementsCount} biens
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-forest-800">{formatPrice(c.commissions)}</p>
                    </div>
                  </div>

                  {/* Progress Bar & Details */}
                  <div className="space-y-1 pt-1">
                    <div className="h-2 w-full rounded-pill bg-background-alt overflow-hidden">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className={cn(
                          "h-full rounded-pill transition-all duration-500",
                          index === 0 ? "bg-forest-700" : "bg-forest-600/80"
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[0.625rem] text-foreground-muted">
                      <span>Volume GMV : {formatPrice(c.gmv)}</span>
                      {c.count > 0 && <span>{c.count} séjours</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <h4 className="font-display text-xs font-bold text-foreground flex items-center gap-1.5 mb-3">
            <Home className="h-4 w-4 text-forest-700" /> Répartition par Type de Bien
          </h4>
          <div className="flex flex-wrap gap-2">
            {breakdownByType.map((t) => (
              <div key={t.type} className="rounded-pill border border-border bg-background-alt px-3 py-1.5 text-xs space-x-1 flex items-center gap-1">
                <span className="font-bold text-foreground">{t.type} :</span>
                <span className="font-mono font-bold text-forest-800">{formatPrice(t.commissions)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
