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
    <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden group h-full min-h-[420px] flex flex-col hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1 transition-all duration-500">

      {/* ── Ambient glows ───────────────────────────────────────── */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary-500/8 rounded-full blur-[80px] group-hover:bg-primary-500/12 transition-all duration-700 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-primary-400/5 rounded-full blur-[60px] pointer-events-none" />

      {/* ── Grid pattern overlay ────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-background-card/[0.08] backdrop-blur-sm flex items-center justify-center border border-white/[0.08] group-hover:scale-110 transition-transform duration-500">
              <Wallet className="w-[18px] h-[18px] text-primary-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.12em]">Mon portefeuille</p>
              <p className="text-sm font-bold text-white">Solde & Retraits</p>
            </div>
          </div>
          <Link
            href="/dashboard/wallet"
            className="p-2 rounded-xl bg-background-card/[0.06] border border-white/[0.06] hover:bg-background-card/[0.12] transition-all"
          >
            <ArrowUpRight className="w-4 h-4 text-white/50" />
          </Link>
        </div>

        {/* ── Main Balance ───────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Solde disponible</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tight">{fmt(available)}</span>
            <span className="text-xs font-bold text-white/30 uppercase">fcfa</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400">Retirable immédiatement</span>
          </div>
        </div>

        {/* ── Progress bar ───────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Répartition</span>
            <span className="text-[10px] font-bold text-primary-400">{availPct}% disponible</span>
          </div>
          <div className="h-1.5 rounded-full bg-background-card/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-1000 ease-out"
              style={{ width: `${availPct}%` }}
            />
          </div>
        </div>

        {/* ── Stats Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-background-card/[0.04] border border-white/[0.06] hover:bg-background-card/[0.06] transition-colors">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase">En attente</span>
            </div>
            <p className="text-lg font-black text-white">{fmt(pending)}</p>
            <p className="text-[9px] text-white/25 mt-0.5 uppercase">Séquestre</p>
          </div>
          <div className="p-4 rounded-xl bg-background-card/[0.04] border border-white/[0.06] hover:bg-background-card/[0.06] transition-colors">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center">
                <Landmark className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase">Traitement</span>
            </div>
            <p className="text-lg font-black text-white">{fmt(processing)}</p>
            <p className="text-[9px] text-white/25 mt-0.5 uppercase">Retraits en cours</p>
          </div>
        </div>

        {/* ── Spacer + CTA ───────────────────────────────────────── */}
        <div className="flex-1" />
        <Link
          href="/dashboard/wallet"
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl
                     bg-gradient-to-r from-primary-500 to-primary-600
                     text-white text-sm font-bold
                     shadow-lg shadow-primary-500/20
                     hover:shadow-xl hover:shadow-primary-500/30
                     hover:from-primary-400 hover:to-primary-500
                     active:scale-[0.98]
                     transition-all duration-300"
        >
          <Sparkles className="w-4 h-4" />
          Retirer mes fonds
        </Link>
      </div>
    </div>
  );
}
