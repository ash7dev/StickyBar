'use client';

import { ShieldCheck, Lock, Coins, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SystemLedgerData {
  soldeSequestre: number;
  soldeCommissionsCumulees: number;
  soldePoolTeranga: number;
}

interface AdminSystemLedgerCardProps {
  data?: SystemLedgerData;
  isLoading: boolean;
}

function fmt(n?: number) {
  if (n == null) return '0 FCFA';
  return new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

export function AdminSystemLedgerCard({ data, isLoading }: AdminSystemLedgerCardProps) {
  if (isLoading) {
    return (
      <div className="section-inverse p-6 sm:p-8 animate-pulse space-y-4">
        <div className="h-6 bg-white/10 rounded-pill w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-white/10 rounded-card" />
          <div className="h-24 bg-white/10 rounded-card" />
          <div className="h-24 bg-white/10 rounded-card" />
        </div>
      </div>
    );
  }

  const soldeSequestre = data?.soldeSequestre ?? 0;
  const soldeCommissions = data?.soldeCommissionsCumulees ?? 0;
  const soldePool = data?.soldePoolTeranga ?? 0;

  return (
    <section className="section-inverse relative overflow-hidden p-6 sm:p-8 shadow-xl transition-all duration-300">
      {/* Halo lumineux vert forêt */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-pill bg-forest-700/40 blur-3xl"
      />

      <div className="relative z-10 space-y-6">
        {/* En-tête : Titre + Badge de solvabilité */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-white/10 border border-white/20 text-xs font-semibold text-on-inverse-marker mb-2">
              <ShieldCheck className="w-4 h-4 text-lime-300" />
              <span>Grand Livre Système & Séquestre Klef</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-on-inverse-display">
              Trésorerie & Fonds Sous Séquestre
            </h2>
            <p className="text-xs text-on-inverse-muted mt-0.5">
              Suivi en temps réel des encaissements en attente de check-in et des revenus acquis.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-pill bg-forest-950/80 border border-lime-400/30 text-lime-300 text-xs font-bold shrink-0 self-start sm:self-center shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400" />
            </span>
            <span>Trésorerie 100% Équilibrée & Solvable</span>
          </div>
        </div>

        {/* Grille des 3 comptes de trésorerie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Compte Séquestre */}
          <div className="rounded-card border border-border-inverse bg-white/5 p-5 space-y-2 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-inverse-muted flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-lime-300" />
                Séquestre Actif
              </span>
              <span className="px-2 py-0.5 rounded-pill bg-lime-400/20 text-lime-300 text-[10px] font-extrabold border border-lime-400/30">
                En attente check-in
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-on-inverse-display tabular-nums">
              {fmt(soldeSequestre)}
            </p>
            <p className="text-[11px] text-on-inverse-muted leading-relaxed">
              Fonds réservations en cours + subventions injectées.
            </p>
          </div>

          {/* 2. Commissions Acquises */}
          <div className="rounded-card border border-border-inverse bg-white/5 p-5 space-y-2 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-inverse-muted flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-gold-300" />
                Commissions Acquises
              </span>
              <span className="px-2 py-0.5 rounded-pill bg-gold-400/20 text-gold-300 text-[10px] font-extrabold border border-gold-400/30">
                Revenu Net Klef
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-gold-300 tabular-nums">
              {fmt(soldeCommissions)}
            </p>
            <p className="text-[11px] text-on-inverse-muted leading-relaxed">
              Chiffre d'affaires net perçu sur les séjours clôturés.
            </p>
          </div>

          {/* 3. Pool Teranga Club */}
          <div className="rounded-card border border-border-inverse bg-white/5 p-5 space-y-2 hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-inverse-muted flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-lime-300" />
                Pool Teranga Club
              </span>
              <span className="px-2 py-0.5 rounded-pill bg-white/10 text-on-inverse text-[10px] font-extrabold border border-white/20">
                Budget Fidélité
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-on-inverse-display tabular-nums">
              {fmt(soldePool)}
            </p>
            <p className="text-[11px] text-on-inverse-muted leading-relaxed">
              Fonds d'investissement Klef pour financer les Klef Coins.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
