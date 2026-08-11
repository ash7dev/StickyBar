'use client';

import { useMemo, useState } from 'react';
import { BarChart3, Building2, Home, LineChart, MapPin, TrendingUp } from 'lucide-react';
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

/* `null` → « — », pas « 0 FCFA » : sur un tableau de bord de revenus, un zéro
   affiché à la place d'une donnée absente se lit comme un résultat nul.
   `Intl` en style currency XOF rendait « 12 345 F CFA » ; ailleurs dans l'app
   c'est « 12 345 FCFA ». */
const fmt = (n?: number | null) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

/** Notation courte pour les graduations : « 1,2 M », « 340 k ». */
const fmtCourt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(Math.round(n));
};

const TYPE_LABELS: Record<string, string> = {
  VILLA: 'Villa',
  APPARTEMENT: 'Appartement',
  STUDIO: 'Studio',
  CHAMBRE: 'Chambre',
};

/* ─── Géométrie ───────────────────────────────────────────────────────────── */

const W = 800;
const H = 200;
const PAD_X = 44;
const PAD_Y = 20;
const BASE = H - PAD_Y; // la ligne de zéro, autrefois écrite « 180 » en dur

function courbeLissee(pts: Array<{ x: number; y: number }>) {
  if (pts.length === 0) return { ligne: '', aire: '' };
  if (pts.length === 1) {
    const p = pts[0];
    return {
      ligne: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
      aire: `M ${p.x - 20} ${BASE} L ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${BASE} Z`,
    };
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const mx = a.x + (b.x - a.x) / 2;
    d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
  }
  return { ligne: d, aire: `${d} L ${pts[pts.length - 1].x} ${BASE} L ${pts[0].x} ${BASE} Z` };
}

/* ─── Infobulle ───────────────────────────────────────────────────────────── */

function Infobulle({ point }: { point: TimeSeriesPoint }) {
  return (
    /* `text-foreground-muted` (neutral-600) était posé sur un fond forest-950 :
       environ 2:1, illisible. Sur surface sombre, c'est forest-200. */
    <div
      role="status"
      className="pointer-events-none absolute right-4 top-2 z-20 space-y-1 rounded-card border border-border-inverse bg-forest-950 p-3 text-xs text-forest-200 shadow-lg"
    >
      <p className="border-b border-border-inverse pb-1 font-semibold text-neutral-50">
        {point.date}
      </p>
      {/* « Part Net Klef (7%) » : le taux n'est pas connu de ce composant, il
         varie, et le ×1,07 du prix public est une majoration — pas la
         commission. */}
      <p>
        Net Klef :{' '}
        <strong className="font-semibold tabular-nums text-neutral-50">{fmt(point.netKlef)}</strong>
      </p>
      <p className="tabular-nums">GMV : {fmt(point.gmv)}</p>
      {point.penalties > 0 && <p className="tabular-nums">Pénalités : {fmt(point.penalties)}</p>}
      <p className="tabular-nums">
        {point.count} séjour{point.count > 1 ? 's' : ''}
      </p>
    </div>
  );
}

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminStatsCharts({
  timeSeries,
  breakdownByCity,
  breakdownByType,
  isLoading,
}: AdminStatsChartsProps) {
  const [mode, setMode] = useState<'CURVE' | 'BARS'>('CURVE');
  const [survol, setSurvol] = useState<TimeSeriesPoint | null>(null);

  const max = useMemo(
    () => Math.max(0, ...timeSeries.map((t) => Number(t.netKlef) || 0)),
    [timeSeries],
  );
  const echelle = max > 0 ? max : 1;

  const points = useMemo(
    () =>
      timeSeries.map((pt, i) => {
        const x =
          timeSeries.length === 1
            ? W / 2
            : PAD_X + (i / (timeSeries.length - 1)) * (W - 2 * PAD_X);
        const y = BASE - ((Number(pt.netKlef) || 0) / echelle) * (H - 2 * PAD_Y);
        return { x, y, pt };
      }),
    [timeSeries, echelle],
  );

  const { ligne, aire } = useMemo(() => courbeLissee(points), [points]);

  /* Le composant affichait « #1, #2, #3 » sans jamais trier : le classement
     dépendait de l'ordre de l'API. */
  const villes = useMemo(
    () =>
      [...breakdownByCity].sort((a, b) => (Number(b.commissions) || 0) - (Number(a.commissions) || 0)),
    [breakdownByCity],
  );
  const maxVille = Math.max(0, ...villes.map((c) => Number(c.commissions) || 0));

  const types = useMemo(
    () =>
      [...breakdownByType].sort((a, b) => (Number(b.commissions) || 0) - (Number(a.commissions) || 0)),
    [breakdownByType],
  );

  const dates = [
    timeSeries[0]?.date,
    timeSeries[Math.floor(timeSeries.length / 2)]?.date,
    timeSeries[timeSeries.length - 1]?.date,
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ══ Évolution ═══════════════════════════════════════════════════ */}
      <section className="space-y-4 rounded-card border border-border bg-background-card p-6 shadow-xs lg:col-span-2">
        <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <TrendingUp className="h-5 w-5 text-forest-600" aria-hidden />
              Revenu net Klef
            </h3>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Commissions et pénalités perçues sur la période.
            </p>
          </div>

          <div
            role="group"
            aria-label="Type de graphique"
            className="flex shrink-0 items-center gap-1 rounded-pill border border-border bg-background-alt p-1"
          >
            {([
              { id: 'CURVE' as const, label: 'Courbe', Icon: LineChart },
              { id: 'BARS' as const, label: 'Barres', Icon: BarChart3 },
            ]).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold transition-colors',
                  mode === id
                    ? 'bg-forest-600 text-neutral-0'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-inner bg-background-alt" aria-busy="true" />
        ) : timeSeries.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-1.5 text-center">
            <TrendingUp className="h-8 w-8 text-neutral-400" aria-hidden />
            <p className="text-sm font-semibold text-foreground">Aucun revenu sur la période</p>
            <p className="text-xs text-foreground-muted">
              Le graphique apparaît dès la première réservation confirmée.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* ── Graduations verticales ──────────────────────────────────
                Trois lignes de grille sans une seule valeur : le graphique ne
                permettait pas de lire un ordre de grandeur. */}
            <div className="flex gap-2">
              <div className="flex w-12 shrink-0 flex-col justify-between py-1 text-right text-xs tabular-nums text-foreground-muted">
                <span>{fmtCourt(max)}</span>
                <span>{fmtCourt(max / 2)}</span>
                <span>0</span>
              </div>

              <div className="min-w-0 flex-1">
                {mode === 'CURVE' ? (
                  <svg
                    viewBox={`0 0 ${W} ${H}`}
                    role="img"
                    aria-label={`Évolution du revenu net, maximum ${fmt(max)}`}
                    className="h-52 w-full overflow-visible"
                  >
                    <defs>
                      <linearGradient id="klef-aire" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--forest-600)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--forest-600)" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {[PAD_Y, H / 2, BASE].map((y, i) => (
                      <line
                        key={y}
                        x1="0"
                        y1={y}
                        x2={W}
                        y2={y}
                        stroke="var(--border)"
                        strokeDasharray={i === 2 ? undefined : '4 4'}
                      />
                    ))}

                    <path d={aire} fill="url(#klef-aire)" />
                    <path
                      d={ligne}
                      fill="none"
                      stroke="var(--forest-600)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {points.map(({ x, y, pt }) => (
                      <g
                        key={pt.date}
                        tabIndex={0}
                        role="button"
                        aria-label={`${pt.date} : ${fmt(pt.netKlef)}`}
                        onMouseEnter={() => setSurvol(pt)}
                        onMouseLeave={() => setSurvol(null)}
                        /* Les points n'étaient atteignables qu'à la souris :
                           au clavier ou au doigt, aucune valeur lisible. */
                        onFocus={() => setSurvol(pt)}
                        onBlur={() => setSurvol(null)}
                        className="cursor-pointer focus:outline-none"
                      >
                        <circle cx={x} cy={y} r="14" fill="transparent" />
                        <circle
                          cx={x}
                          cy={y}
                          r="4.5"
                          /* `fill="#ffffff"` en dur disparaissait en mode
                             sombre. */
                          fill="var(--background-card)"
                          stroke="var(--forest-600)"
                          strokeWidth="2.5"
                        />
                      </g>
                    ))}
                  </svg>
                ) : (
                  <div className="flex h-52 w-full items-end gap-1.5">
                    {timeSeries.map((pt) => {
                      const valeur = Number(pt.netKlef) || 0;
                      /* `Math.max(..., 6)` donnait 6 % de hauteur à une
                         journée nulle et à une journée qui pèse 0,5 %. Sur un
                         histogramme, gonfler le bas de l'échelle est un
                         mensonge. Hauteur exacte, minimum en pixels. */
                      const hauteur = (valeur / echelle) * 100;
                      return (
                        <div
                          key={pt.date}
                          role="button"
                          tabIndex={0}
                          aria-label={`${pt.date} : ${fmt(valeur)}`}
                          onMouseEnter={() => setSurvol(pt)}
                          onMouseLeave={() => setSurvol(null)}
                          onFocus={() => setSurvol(pt)}
                          onBlur={() => setSurvol(null)}
                          className="group flex h-full min-w-[1.25rem] flex-1 cursor-pointer flex-col justify-end focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <span
                            style={{ height: `${hauteur}%` }}
                            className={cn(
                              'block w-full rounded-t-inner transition-colors',
                              valeur > 0
                                ? 'min-h-[2px] bg-forest-600 group-hover:bg-forest-500'
                                : 'min-h-[2px] bg-border',
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs tabular-nums text-foreground-muted">
                  {dates.map((d, i) => (
                    <span key={`${d}-${i}`}>{d ?? ''}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Une seule infobulle, partagée par les deux modes : elle était
                dupliquée à l'identique, avec le risque de diverger. */}
            {survol && <Infobulle point={survol} />}
          </div>
        )}
      </section>

      {/* ══ Villes et types ═════════════════════════════════════════════ */}
      <section className="space-y-5 rounded-card border border-border bg-background-card p-6 shadow-xs">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <MapPin className="h-5 w-5 text-forest-600" aria-hidden />
            Par ville
          </h3>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Classement sur les commissions perçues.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-inner bg-background-alt" />
            ))}
          </div>
        ) : villes.length === 0 ? (
          <p className="py-8 text-center text-xs text-foreground-muted">Aucune ville enregistrée.</p>
        ) : (
          <>
            <ol className="space-y-2.5">
              {villes.slice(0, 6).map((c, i) => {
                const commissions = Number(c.commissions) || 0;
                const largeur = maxVille > 0 ? (commissions / maxVille) * 100 : 0;
                return (
                  <li
                    key={c.ville || i}
                    className="space-y-1.5 rounded-inner border border-border bg-background-alt p-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span
                          className={cn(
                            'shrink-0 text-xs font-semibold tabular-nums',
                            i === 0 ? 'text-forest-700' : 'text-foreground-muted',
                          )}
                        >
                          {i + 1}.
                        </span>
                        <span className="truncate text-xs font-semibold text-foreground">
                          {c.ville || 'Ville inconnue'}
                        </span>
                        {c.logementsCount != null && (
                          <span className="flex shrink-0 items-center gap-1 text-xs text-foreground-muted">
                            <Building2 className="h-3 w-3" aria-hidden />
                            {c.logementsCount}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                        {fmt(commissions)}
                      </span>
                    </div>

                    <div
                      role="img"
                      aria-label={`${Math.round(largeur)} % du meilleur total`}
                      className="h-1.5 w-full overflow-hidden rounded-pill bg-background-card"
                    >
                      <span
                        style={{ width: `${largeur}%` }}
                        className="block h-full min-w-[2px] rounded-pill bg-forest-600"
                      />
                    </div>

                    <div className="flex justify-between gap-2 text-xs tabular-nums text-foreground-muted">
                      <span>GMV {fmtCourt(Number(c.gmv) || 0)}</span>
                      <span>
                        {c.count} séjour{c.count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* `slice(0, 6)` tronquait sans le dire. */}
            {villes.length > 6 && (
              <p className="text-center text-xs text-foreground-muted">
                et {villes.length - 6} autre{villes.length - 6 > 1 ? 's' : ''} ville
                {villes.length - 6 > 1 ? 's' : ''}
              </p>
            )}
          </>
        )}

        <div className="border-t border-border pt-4">
          <h4 className="mb-3 flex items-center gap-1.5 font-display text-xs font-semibold text-foreground">
            <Home className="h-4 w-4 text-forest-600" aria-hidden />
            Par type de bien
          </h4>
          {types.length === 0 ? (
            <p className="text-xs text-foreground-muted">Aucun type enregistré.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {types.map((t) => (
                <li
                  key={t.type}
                  className="flex items-center gap-1.5 rounded-pill border border-border bg-background-alt px-3 py-1.5 text-xs"
                >
                  <span className="text-foreground-muted">
                    {TYPE_LABELS[t.type] ?? t.type ?? 'Non catégorisé'}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {fmt(t.commissions)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}