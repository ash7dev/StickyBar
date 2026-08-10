'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { Calculator, Coins, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  cashbackPct: number;
}

const MIN = 10_000;
const MAX = 2_000_000;
const PRESETS = [50_000, 100_000, 200_000, 500_000];

const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

/* `{cashbackPct}%` affichait « 1.5% » : point décimal anglais et pas d'espace
   avant le signe, contrairement à la typographie française. */
const pct = (n: number) => `${n.toFixed(1).replace('.', ',').replace(',0', '')} %`;

export function TerangaSimulatorCard({ cashbackPct }: Props) {
  const [amount, setAmount] = useState<number>(150_000);
  /* Champ texte : `type="number"` capte la molette et modifie la valeur au
     défilement de la page, et n'affiche aucun séparateur de milliers. */
  const [raw, setRaw] = useState<string>(nombre(150_000));

  const inputId = useId();
  const taux = Number(cashbackPct) || 0;
  const earned = useMemo(() => Math.round((amount * taux) / 100), [amount, taux]);

  const commit = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      setAmount(0);
      setRaw('');
      return;
    }
    /* `min` et `max` n'étaient que des attributs HTML : ils ne contraignent
       que la validation d'un formulaire, jamais la valeur en React. */
    const n = Math.min(MAX, Number(digits));
    setAmount(n);
    setRaw(nombre(n));
  }, []);

  const handleBlur = useCallback(() => {
    if (amount > 0 && amount < MIN) {
      setAmount(MIN);
      setRaw(nombre(MIN));
    }
  }, [amount]);

  const selectPreset = useCallback((preset: number) => {
    setAmount(preset);
    setRaw(nombre(preset));
  }, []);

  const tropBas = amount > 0 && amount < MIN;

  return (
    <section className="card space-y-6 p-6 sm:p-8">

      <header className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Simulateur de cashback
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted">
              Estimez les Klef Coins gagnés sur votre prochain séjour.
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-pill border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700 sm:self-auto">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Votre taux : <span className="tabular-nums">{pct(taux)}</span>
        </span>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">

        {/* ── Saisie ───────────────────────────────────────────────────── */}

        <div className="space-y-4 md:col-span-7">
          <div className="space-y-2">
            {/* Le `<label>` n'avait pas de `htmlFor` : cliquer dessus ne
               focalisait pas le champ, et il n'était pas annoncé. */}
            <label
              htmlFor={inputId}
              className="block text-xs font-semibold uppercase tracking-wider text-foreground-muted"
            >
              Montant estimé de votre séjour
            </label>

            <div className="relative">
              <input
                id={inputId}
                type="text"
                inputMode="numeric"
                value={raw}
                onChange={(e) => commit(e.target.value)}
                onBlur={handleBlur}
                aria-describedby={`${inputId}-aide`}
                placeholder="150 000"
                className={cn(
                  'w-full rounded-pill border bg-background-alt py-3 pr-20 pl-5 font-display text-xl font-semibold tabular-nums text-foreground focus:outline-none',
                  tropBas ? 'border-warning-500' : 'border-border focus:border-forest-500',
                )}
              />
              <span className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2 text-xs font-semibold text-foreground-muted">
                FCFA
              </span>
            </div>

            <p id={`${inputId}-aide`} className="text-xs text-foreground-muted">
              {tropBas
                ? `Montant minimum : ${nombre(MIN)} FCFA`
                : `Entre ${nombre(MIN)} et ${nombre(MAX)} FCFA`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-foreground-muted">Exemples :</span>
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => selectPreset(preset)}
                aria-pressed={amount === preset}
                className={cn(
                  'rounded-pill border px-3 py-1 text-xs font-semibold tabular-nums transition-colors',
                  amount === preset
                    ? 'border-forest-600 bg-forest-600 text-neutral-0'
                    : 'border-border bg-background-alt text-foreground hover:border-forest-300 hover:bg-forest-50',
                )}
              >
                {nombre(preset)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Résultat ─────────────────────────────────────────────────── */}

        <div className="md:col-span-5">
          <div className="space-y-3 rounded-card border border-gold-200 bg-gold-50 p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-700">
              <Coins className="h-4 w-4" aria-hidden="true" />
              Vous gagnez
            </p>

            {/* `aria-live` : le résultat changeait sans qu'un lecteur d'écran
               en soit informé. */}
            <p aria-live="polite" className="font-display text-3xl font-semibold tabular-nums text-gold-700">
              +{nombre(earned)}
              <span className="ml-1.5 text-sm font-semibold text-foreground-muted">coins</span>
            </p>

            <p className="border-t border-gold-200 pt-2.5 text-xs leading-relaxed text-foreground-muted">
              Soit{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {nombre(earned)} FCFA
              </span>{' '}
              de réduction sur une prochaine réservation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}