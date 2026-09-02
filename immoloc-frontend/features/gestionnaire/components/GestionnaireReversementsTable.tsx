'use client';

import { useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  PhoneCall,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from 'lucide-react';
import { fcfa } from '@/lib/dashboard/owner-tokens';

/* ────────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────────── */

export interface OwnerItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  logementsCount: number;
  soldeDisponible: number;
  netBailleurCumule?: number;
}

interface Props {
  proprietaires: OwnerItem[];
  onOpenWithdrawal: (owner: OwnerItem) => void;
}

/* ────────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────────────── */

function walletPercent(solde: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min((solde / max) * 100, 100);
}

/* ────────────────────────────────────────────────────────────────────────────
   Component: Reversements aux Bailleurs Partenaires
   ──────────────────────────────────────────────────────────────────────────── */

export function GestionnaireReversementsTable({ proprietaires, onOpenWithdrawal }: Props) {
  const [localSearch, setLocalSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  /* ── Filtrage & Tri ─────────────────────────────────────────────────────── */
  const filtered = proprietaires
    .filter((p) => {
      if (!localSearch.trim()) return true;
      const q = localSearch.toLowerCase();
      return (
        `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
        p.telephone.includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => (sortAsc ? a.soldeDisponible - b.soldeDisponible : b.soldeDisponible - a.soldeDisponible));

  const maxSolde = Math.max(...proprietaires.map((p) => p.soldeDisponible), 1);
  const totalSolde = proprietaires.reduce((s, p) => s + p.soldeDisponible, 0);
  const totalBiens = proprietaires.reduce((s, p) => s + p.logementsCount, 0);

  return (
    <div className="rounded-card border border-border bg-background-card shadow-2xs overflow-hidden">
      {/* ── En-tête du composant ───────────────────────────────────────────── */}
      <div className="p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-card bg-forest-900 text-lime-400 flex items-center justify-center shrink-0 shadow-xs border border-forest-800">
              <Wallet className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-forest-950 tracking-tight">
                  Reversements aux Bailleurs Partenaires
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill text-[0.65rem] font-bold bg-forest-50 text-forest-800 border border-forest-200">
                  <ShieldCheck className="w-3 h-3 text-forest-700" />
                  Mandats Actifs
                </span>
              </div>
              <p className="text-xs font-medium text-foreground-muted mt-0.5">
                États des comptes et demandes de virement Wave / Orange Money / Banque.
              </p>
            </div>
          </div>

          {/* Badges de stats globales & Canaux de paiement */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold bg-forest-50 text-forest-900 border border-forest-200">
              <Users className="w-3.5 h-3.5 text-forest-700" />
              <span>{proprietaires.length} bailleur{proprietaires.length > 1 ? 's' : ''}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold bg-gold-50 text-gold-800 border border-gold-200">
              <Building2 className="w-3.5 h-3.5 text-gold-700" />
              <span>{totalBiens} bien{totalBiens > 1 ? 's' : ''}</span>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold bg-neutral-100 text-neutral-800 border border-border">
              <Smartphone className="w-3.5 h-3.5 text-neutral-600" />
              <span>Wave / OM / IBAN</span>
            </div>
          </div>
        </div>

        {/* Barre de recherche et tri */}
        {proprietaires.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-faint pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone ou e-mail…"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full rounded-pill border border-border bg-white text-neutral-900 pl-10 pr-4 py-2.5 text-xs font-medium focus:outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/10 shadow-2xs [color-scheme:light]"
              />
            </div>
            <button
              type="button"
              onClick={() => setSortAsc((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-white text-foreground-muted hover:text-forest-950 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <span>Trier par solde</span>
              {sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* ── Corps du tableau / Liste des Bailleurs ──────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-4">
          <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-foreground">
            {proprietaires.length === 0
              ? 'Aucun bailleur partenaire sous mandat conciergerie'
              : 'Aucun bailleur ne correspond à votre recherche'}
          </p>
          <p className="text-xs text-foreground-muted max-w-md">
            {proprietaires.length === 0
              ? 'Les comptes des propriétaires sous mandat s’afficheront automatiquement ici avec leurs solde de portefeuille.'
              : 'Vérifiez le nom ou l’orthographe du numéro de téléphone.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((p) => {
            const pct = walletPercent(p.soldeDisponible, maxSolde);
            const hasFunds = p.soldeDisponible > 0;

            return (
              <div
                key={p.id}
                className="p-5 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/70 transition-colors"
              >
                {/* 1. Profil Bailleur */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-forest-950 text-lime-400 font-display font-extrabold text-sm flex items-center justify-center shrink-0 border border-forest-800 shadow-xs">
                    {p.prenom[0]}
                    {p.nom[0]}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-base font-bold text-forest-950 truncate">
                        {p.prenom} {p.nom}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[0.65rem] font-bold bg-neutral-100 text-neutral-700 border border-border shrink-0">
                        <Building2 className="w-3 h-3 text-neutral-500" />
                        {p.logementsCount} bien{p.logementsCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <PhoneCall className="w-3 h-3 text-foreground-faint" />
                        {p.telephone}
                      </span>
                      {p.email && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-neutral-300" />
                          <span className="font-medium truncate max-w-[180px]">{p.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Solde Wallet & Informations Financières */}
                <div className="md:w-64 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[0.6875rem] font-bold text-forest-800 uppercase tracking-wider">
                      Solde Portefeuille
                    </span>
                    <p className="font-display text-base font-extrabold text-forest-950 tabular-nums">
                      {fcfa(p.soldeDisponible)}{' '}
                      <span className="text-xs font-bold text-foreground-muted">FCFA</span>
                    </p>
                  </div>

                  {/* Barre de proportion du solde */}
                  <div className="h-2 rounded-full w-full bg-neutral-100 overflow-hidden border border-neutral-200/60 p-0.5">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out bg-forest-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {p.netBailleurCumule !== undefined && p.netBailleurCumule > 0 && (
                    <p className="text-[0.7rem] font-semibold text-foreground-muted flex items-center justify-between">
                      <span>Contrats nets sous mandat :</span>
                      <strong className="text-forest-900 tabular-nums">{fcfa(p.netBailleurCumule)} FCFA</strong>
                    </p>
                  )}
                </div>

                {/* 3. Action Virement Wave / OM / Banque */}
                <div className="shrink-0 md:pl-2">
                  <button
                    type="button"
                    onClick={() => onOpenWithdrawal(p)}
                    disabled={!hasFunds}
                    className="btn-action inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-forest-950 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none border-none cursor-pointer w-full sm:w-auto"
                  >
                    <ArrowUpRight className="w-4 h-4 text-forest-950 shrink-0" aria-hidden="true" />
                    <span>Verser les fonds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pied récapitulatif ─────────────────────────────────────────────── */}
      {proprietaires.length > 0 && (
        <>
          <div className="h-px bg-border" />
          <div className="p-5 sm:px-6 bg-forest-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-pill bg-white/10 text-lime-400 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-lime-400 uppercase tracking-wider">
                  Total Cumulé Portefeuilles Bailleurs
                </p>
                <p className="text-xs text-neutral-300 font-medium">
                  Fonds disponibles prêts à être versés via Wave, Orange Money ou virement.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <p className="font-display text-xl sm:text-2xl font-extrabold text-white tabular-nums">
                {fcfa(totalSolde)} <span className="text-xs font-bold text-neutral-400">FCFA</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
