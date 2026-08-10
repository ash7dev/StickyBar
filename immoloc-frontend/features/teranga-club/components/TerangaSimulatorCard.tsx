'use client';

import { useState } from 'react';
import { Calculator, ArrowRight, Coins, Sparkles } from 'lucide-react';

interface Props {
  cashbackPct: number;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

export function TerangaSimulatorCard({ cashbackPct }: Props) {
  const [amount, setAmount] = useState<number>(150000);

  const earnedCoins = Math.round((amount * cashbackPct) / 100);

  return (
    <section className="card p-6 sm:p-8 space-y-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="marker-box border border-forest-100 bg-forest-50 text-forest-700">
            <Calculator className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Simulateur d’Économies Klef Coins
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Calculez les Klef Coins que vous accumulez pour votre prochain séjour.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-forest-50 text-forest-700 border border-forest-100 text-xs font-semibold self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Taux actuel : {cashbackPct}%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Contrôles du montant */}
        <div className="md:col-span-7 space-y-4">
          <label className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider">
            Montant estimé de votre réservation (FCFA)
          </label>
          <div className="relative">
            <input
              type="number"
              min={10000}
              max={2000000}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full rounded-pill border border-border bg-background-alt px-5 py-3 font-display text-xl font-bold text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted">
              FCFA
            </span>
          </div>

          {/* Raccourcis montants */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-foreground-muted font-medium">Exemples :</span>
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`px-3 py-1 rounded-pill text-xs font-semibold transition-all ${
                  amount === preset
                    ? 'bg-forest-700 text-white shadow-xs'
                    : 'bg-background-alt border border-border text-foreground hover:bg-forest-50 hover:text-forest-700'
                }`}
              >
                {preset.toLocaleString('fr-FR')} FCFA
              </button>
            ))}
          </div>
        </div>

        {/* Résultat du calcul */}
        <div className="md:col-span-5">
          <div className="rounded-card border border-forest-100 bg-forest-50/70 p-5 space-y-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-forest-700">
              <Coins className="w-4 h-4" />
              <span>Coins gagnés sur ce séjour</span>
            </div>
            <p className="font-display text-3xl font-bold text-forest-800 tabular-nums">
              +{earnedCoins.toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-semibold text-forest-700">Klef Coins</span>
            </p>
            <p className="text-xs text-foreground-muted leading-relaxed border-t border-forest-200/60 pt-2.5">
              = <strong className="font-bold text-forest-800">{earnedCoins.toLocaleString('fr-FR')} FCFA</strong> de réduction utilisable immédiatement sur votre réservation suivante.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
