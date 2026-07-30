'use client';

import { Wallet, ArrowUpRight, Clock, Landmark, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface Props {
  available: number;
  pending: number;
  processing: number;
}

export function WalletSnapshot({ available, pending, processing }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR').format(Number(n));

  const total = available + pending + processing;
  const availPct = total > 0 ? Math.round((available / total) * 100) : 100;

  return (
    <div className="bg-gradient-to-b from-forest-950 via-[#072A20] to-forest-950 text-white rounded-card p-6 border border-forest-800/90 shadow-xl relative overflow-hidden flex flex-col h-full min-h-[380px]">

      {/* Halos lumineux de fond */}
      <div className="pointer-events-none absolute -top-20 -right-20 w-56 h-56 rounded-full bg-lime-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-forest-600/20 blur-3xl" />

      <div className="relative z-10 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-forest-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-inner bg-forest-900 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0 shadow-2xs">
              <Wallet className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-forest-300 uppercase tracking-wider">Mon portefeuille</p>
              <h3 className="font-display text-base font-bold text-white">Solde &amp; Retraits</h3>
            </div>
          </div>
          <Link
            href="/dashboard/wallet"
            className="p-2 rounded-inner bg-forest-900/60 border border-forest-800 hover:bg-forest-900 transition-all text-lime-400"
          >
            <ArrowUpRight className="w-4 h-4 text-lime-400" />
          </Link>
        </div>

        {/* Solde principal */}
        <div className="mb-6">
          <p className="text-[10px] font-extrabold text-forest-300 uppercase tracking-widest mb-1">Solde disponible</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{fmt(available)}</span>
            <span className="text-xs font-extrabold text-lime-400 uppercase">FCFA</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-4 h-4 text-lime-400" />
            <span className="text-xs font-bold text-lime-300">Retirable immédiatement</span>
          </div>
        </div>

        {/* Répartition */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-forest-300 uppercase tracking-wider">Répartition</span>
            <span className="text-[10px] font-extrabold text-lime-300">{availPct}% disponible</span>
          </div>
          <div className="h-2 rounded-pill bg-forest-900 overflow-hidden border border-forest-800">
            <div
              className="h-full rounded-pill bg-lime-400 transition-all duration-1000 ease-out"
              style={{ width: `${availPct}%` }}
            />
          </div>
        </div>

        {/* Grille de sous-statuts */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-inner bg-forest-900/60 border border-forest-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-inner bg-warning-500/20 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-warning-400" />
              </div>
              <span className="text-[10px] font-extrabold text-forest-300 uppercase">En attente</span>
            </div>
            <p className="font-display text-lg font-extrabold text-white">{fmt(pending)}</p>
            <p className="text-[9px] text-forest-300 font-bold uppercase mt-0.5">Séquestre</p>
          </div>

          <div className="p-3.5 rounded-inner bg-forest-900/60 border border-forest-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-inner bg-lime-400/20 flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5 text-lime-400" />
              </div>
              <span className="text-[10px] font-extrabold text-forest-300 uppercase">Traitement</span>
            </div>
            <p className="font-display text-lg font-extrabold text-white">{fmt(processing)}</p>
            <p className="text-[9px] text-forest-300 font-bold uppercase mt-0.5">Retraits en cours</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex-1" />
        <Link
          href="/dashboard/wallet"
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 font-extrabold text-xs shadow-md transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-forest-950" />
          <span>Retirer mes fonds</span>
        </Link>
      </div>
    </div>
  );
}
