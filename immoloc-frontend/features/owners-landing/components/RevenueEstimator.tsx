'use client';

import { useMemo, useState } from 'react';
import { useRevenueStats, type PriceGroup } from '../hooks/use-revenue-stats';

const NIGHTS = [8, 12, 16, 20] as const;
const MAX_CITIES = 6;

const TYPE_LABEL: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  MAISON: 'Maison',
  CHAMBRE: 'Chambre',
};
const typeLabel = (t: string) => TYPE_LABEL[t.toUpperCase()] ?? t.charAt(0) + t.slice(1).toLowerCase();
const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)).replace(/ | /g, ' ');

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-11 rounded-pill border px-4 text-sm font-semibold transition-colors ${
        on ? 'border-lime-400 bg-lime-400 text-forest-950' : 'border-white/20 text-neutral-50 hover:border-white/40'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Calculateur de revenus : moyenne des prix par nuit des annonces Paixi
 * de la même ville et du même type, multipliée par un nombre de nuits que
 * le propriétaire choisit (présenté comme une hypothèse, jamais comme une promesse).
 */
export function RevenueEstimator() {
  const { groups, failed } = useRevenueStats();

  const cities = useMemo(() => {
    const byCity = new Map<string, PriceGroup[]>();
    for (const g of groups ?? []) byCity.set(g.ville, [...(byCity.get(g.ville) ?? []), g]);
    return [...byCity.entries()]
      .map(([ville, gs]) => ({ ville, groups: gs.sort((a, b) => b.count - a.count), count: gs.reduce((s, g) => s + g.count, 0) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_CITIES);
  }, [groups]);

  const [ville, setVille] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [nights, setNights] = useState<number>(12);

  const city = cities.find((c) => c.ville === ville) ?? cities[0];
  const group = city?.groups.find((g) => g.type === type) ?? city?.groups[0];

  if (failed || (groups && !group)) return null;

  return (
    <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-forest-800 p-6 shadow-2xl sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-400">Estimez vos revenus</p>

      {!group ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Chargement des prix">
          <div className="h-11 w-3/4 animate-pulse rounded-pill bg-white/10" />
          <div className="h-11 w-1/2 animate-pulse rounded-pill bg-white/10" />
          <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-white/10" />
        </div>
      ) : (
        <>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold text-forest-200">Où se trouve votre bien ?</legend>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <Pill key={c.ville} on={c.ville === city.ville} onClick={() => { setVille(c.ville); setType(null); }}>
                  {c.ville}
                </Pill>
              ))}
            </div>
            {city.groups.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {city.groups.map((g) => (
                  <Pill key={g.type} on={g.type === group.type} onClick={() => setType(g.type)}>
                    {typeLabel(g.type)}
                  </Pill>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-sm font-semibold text-forest-200">Nuits louées par mois</legend>
            <div className="grid grid-cols-4 gap-2">
              {NIGHTS.map((n) => (
                <Pill key={n} on={n === nights} onClick={() => setNights(n)}>
                  {n}<span className="hidden sm:inline">&nbsp;nuits</span>
                </Pill>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5 border-t border-white/10 pt-6" aria-live="polite">
            <p className="text-[15px] text-forest-200">
              {typeLabel(group.type)} à {city.ville}
            </p>
            <p className="font-display text-5xl font-semibold leading-none text-lime-400 sm:text-6xl">
              ≈ {fcfa(group.avg * nights)} F
            </p>
            <p className="text-[15px] text-neutral-100">
              par mois · {nights} nuits × {fcfa(group.avg)} F
            </p>
          </div>

          <p className="text-[13px] leading-relaxed text-forest-300">
            {group.count > 1
              ? `Moyenne des ${group.count} annonces Paixi de ce type à ${city.ville} (${fcfa(group.min)} – ${fcfa(group.max)} F par nuit).`
              : `Prix de l’annonce Paixi de ce type à ${city.ville}.`}{' '}
            Le nombre de nuits est une hypothèse : ajustez-le à votre bien.
          </p>
        </>
      )}
    </div>
  );
}
