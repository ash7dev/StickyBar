'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  History,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { fcfa, STATUT_CFG_LIGHT } from '@/lib/dashboard/owner-tokens';

/* ────────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────────── */

export interface TransactionItem {
  id: string;
  reference: string;
  type: 'ENCAISSEMENT' | 'REVERSEMENT' | 'COMMISSION';
  libelle: string;
  logementTitre?: string;
  ownerName?: string;
  montant: number;
  date: string;
  methode: string;
  statut: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'PAID' | 'CANCELLED';
}

interface Props {
  transactions: TransactionItem[];
}

/* ────────────────────────────────────────────────────────────────────────────
   Filter Tabs
   ──────────────────────────────────────────────────────────────────────────── */

type FilterKey = 'ALL' | 'ENCAISSEMENT' | 'REVERSEMENT' | 'COMMISSION';

const TABS: { id: FilterKey; label: string }[] = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'ENCAISSEMENT', label: 'Encaissements' },
  { id: 'REVERSEMENT', label: 'Reversements' },
  { id: 'COMMISSION', label: 'Commissions' },
];

/* ────────────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────────────── */

export function GestionnaireTransactionsHistoryTable({ transactions }: Props) {
  const [filterType, setFilterType] = useState<FilterKey>('ALL');

  /* ── Calculs synthétiques ────────────────────────────────────────────────── */
  const totalEncaissements = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'ENCAISSEMENT' && (t.statut === 'COMPLETED' || t.statut === 'PAID'))
      .reduce((acc, t) => acc + t.montant, 0);
  }, [transactions]);

  const totalReversements = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'REVERSEMENT' && (t.statut === 'COMPLETED' || t.statut === 'PAID'))
      .reduce((acc, t) => acc + t.montant, 0);
  }, [transactions]);

  const counts = useMemo(() => {
    return {
      all: transactions.length,
      encaissements: transactions.filter((t) => t.type === 'ENCAISSEMENT').length,
      reversements: transactions.filter((t) => t.type === 'REVERSEMENT').length,
      commissions: transactions.filter((t) => t.type === 'COMMISSION').length,
    };
  }, [transactions]);

  const filtered = useMemo(() => {
    if (filterType === 'ALL') return transactions;
    return transactions.filter((t) => t.type === filterType);
  }, [transactions, filterType]);

  const soldeNet = totalEncaissements - totalReversements;

  /* ── Rendu ──────────────────────────────────────────────────────────────── */
  return (
    <div className="rounded-card border overflow-hidden shadow-2xs" style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}>

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Titre */}
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
              style={{ background: 'var(--forest-50)' }}
            >
              <History className="w-5 h-5" style={{ color: 'var(--forest-700)' }} />
            </div>
            <div>
              <h3
                className="font-display text-base sm:text-lg font-bold tracking-tight"
                style={{ color: 'var(--forest-900)' }}
              >
                Historique des Flux &amp; Transactions
              </h3>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                Traçabilité complète des entrées et sorties de fonds conciergerie.
              </p>
            </div>
          </div>

          {/* Onglets filtres */}
          <div
            className="flex flex-wrap items-center gap-1 rounded-pill p-1 self-start lg:self-auto"
            style={{ background: 'var(--background-alt)', border: '1px solid var(--border)' }}
          >
            {TABS.map((tab) => {
              const count = tab.id === 'ALL' ? counts.all
                : tab.id === 'ENCAISSEMENT' ? counts.encaissements
                : tab.id === 'REVERSEMENT' ? counts.reversements
                : counts.commissions;
              const active = filterType === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-pill transition-all cursor-pointer',
                    active ? 'shadow-2xs' : '',
                  )}
                  style={{
                    background: active ? 'var(--background-card)' : 'transparent',
                    color: active ? 'var(--forest-900)' : 'var(--foreground-muted)',
                    border: active ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    className="px-1.5 py-px text-[0.6rem] rounded-pill font-extrabold leading-tight"
                    style={{
                      background: active ? 'var(--forest-900)' : 'var(--neutral-200)',
                      color: active ? 'var(--lime-400)' : 'var(--neutral-700)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Bandeau synthèse ──────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-inner overflow-hidden"
          style={{ background: 'var(--border)', border: '1px solid var(--border)' }}
        >
          {/* Entrées */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: 'var(--background-alt)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--success-50)', border: '1px solid var(--success-500)' }}
            >
              <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--success-700)' }} />
            </div>
            <div>
              <span
                className="text-[0.625rem] font-bold uppercase tracking-wider block"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Volume Entrées
              </span>
              <span
                className="font-extrabold text-sm tabular-nums"
                style={{ color: 'var(--forest-900)' }}
              >
                + {fcfa(totalEncaissements)}{' '}
                <span className="text-[0.6rem] font-semibold" style={{ color: 'var(--foreground-muted)' }}>FCFA</span>
              </span>
            </div>
          </div>

          {/* Sorties */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: 'var(--background-alt)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--forest-950)', color: 'var(--neutral-0)' }}
            >
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span
                className="text-[0.625rem] font-bold uppercase tracking-wider block"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Reversements Exécutés
              </span>
              <span
                className="font-extrabold text-sm tabular-nums"
                style={{ color: 'var(--forest-950)' }}
              >
                - {fcfa(totalReversements)}{' '}
                <span className="text-[0.6rem] font-semibold" style={{ color: 'var(--foreground-muted)' }}>FCFA</span>
              </span>
            </div>
          </div>

          {/* Solde net */}
          <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: 'var(--background-alt)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--gold-50)', border: '1px solid var(--gold-200)' }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--gold-700)' }} />
            </div>
            <div>
              <span
                className="text-[0.625rem] font-bold uppercase tracking-wider block"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Solde Net Opérationnel
              </span>
              <span
                className="font-extrabold text-sm tabular-nums"
                style={{ color: soldeNet >= 0 ? 'var(--success-700)' : 'var(--error-700)' }}
              >
                {soldeNet >= 0 ? '+' : ''} {fcfa(soldeNet)}{' '}
                <span className="text-[0.6rem] font-semibold" style={{ color: 'var(--foreground-muted)' }}>FCFA</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Séparateur ─────────────────────────────────────────────────────── */}
      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* ── Tableau ────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--neutral-100)' }}
          >
            <Inbox className="w-6 h-6" style={{ color: 'var(--neutral-400)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground-muted)' }}>
            Aucune transaction enregistrée
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--foreground-faint)' }}>
            {filterType === 'ALL'
              ? 'Les transactions apparaîtront ici lorsqu\u2019un séjour sera payé.'
              : 'Aucune transaction de ce type pour la période sélectionnée.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[780px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Référence & Date', 'Type & Description', 'Bien & Bailleur', 'Règlement', 'Montant', 'Statut'].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={cn('px-5 py-3.5 text-[0.65rem] font-bold uppercase tracking-wider', i === 5 && 'text-right')}
                      style={{ color: 'var(--foreground-muted)', background: 'var(--neutral-50)' }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, idx) => {
                const key = t.statut === 'REFUNDED' ? 'CANCELLED' : t.statut;
                const cfg = STATUT_CFG_LIGHT[key] || STATUT_CFG_LIGHT.PAID;
                const isLast = idx === filtered.length - 1;

                return (
                  <tr
                    key={t.id}
                    className="transition-colors"
                    style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--neutral-50)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Référence & Date */}
                    <td className="px-5 py-4">
                      <span
                        className="font-mono font-bold text-[0.7rem] px-2 py-0.5 rounded-inner inline-block"
                        style={{
                          background: 'var(--background-alt)',
                          color: 'var(--forest-950)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        {t.reference}
                      </span>
                      <p className="text-[0.65rem] font-medium mt-1" style={{ color: 'var(--foreground-muted)' }}>
                        {t.date}
                      </p>
                    </td>

                    {/* Type & Description */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <TypeIcon type={t.type} />
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate max-w-[220px]" style={{ color: 'var(--forest-950)' }}>
                            {t.libelle}
                          </p>
                          <span
                            className="text-[0.6rem] font-bold uppercase tracking-wider"
                            style={{ color: 'var(--foreground-muted)' }}
                          >
                            {t.type === 'ENCAISSEMENT'
                              ? 'Encaissement Séjour'
                              : t.type === 'REVERSEMENT'
                                ? 'Décaissement Bailleur'
                                : 'Commission Klef'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Bien & Bailleur */}
                    <td className="px-5 py-4">
                      <p
                        className="font-semibold text-xs truncate max-w-[180px]"
                        style={{ color: 'var(--forest-950)' }}
                      >
                        {t.logementTitre || '—'}
                      </p>
                      {t.ownerName && (
                        <span
                          className="inline-flex items-center gap-1 text-[0.6rem] font-bold px-2 py-0.5 rounded-pill mt-1 truncate"
                          style={{
                            background: 'var(--forest-50)',
                            color: 'var(--forest-800)',
                            border: '1px solid var(--forest-200)',
                          }}
                        >
                          {t.ownerName}
                        </span>
                      )}
                    </td>

                    {/* Moyen de Règlement */}
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold px-2.5 py-1 rounded-pill"
                        style={{
                          background: 'var(--background-card)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <CreditCard className="w-3 h-3" style={{ color: 'var(--foreground-muted)' }} />
                        {t.methode}
                      </span>
                    </td>

                    {/* Montant */}
                    <td className="px-5 py-4">
                      <span
                        className="font-extrabold text-sm tabular-nums"
                        style={{
                          color: t.type === 'ENCAISSEMENT' ? 'var(--success-700)' : 'var(--forest-950)',
                        }}
                      >
                        {t.type === 'ENCAISSEMENT' ? '+' : '-'} {fcfa(t.montant)}
                      </span>
                      <span className="text-[0.6rem] font-semibold ml-1" style={{ color: 'var(--foreground-muted)' }}>
                        FCFA
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-5 py-4 text-right">
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[0.625rem]', cfg.cls)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
                        <span>{cfg.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pied récapitulatif ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <>
          <div className="h-px" style={{ background: 'var(--border)' }} />
          <div
            className="px-6 py-3.5 flex items-center justify-between"
            style={{ background: 'var(--neutral-50)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--foreground-muted)' }}>
              {filtered.length} transaction{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--forest-900)' }}>
              Volume total :{' '}
              {fcfa(filtered.reduce((a, t) => a + t.montant, 0))}{' '}
              <span style={{ color: 'var(--foreground-muted)' }}>FCFA</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────────────────────── */

function TypeIcon({ type }: { type: TransactionItem['type'] }) {
  if (type === 'ENCAISSEMENT') {
    return (
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'var(--success-50)', border: '1px solid var(--success-500)' }}
      >
        <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--success-700)' }} />
      </span>
    );
  }
  if (type === 'REVERSEMENT') {
    return (
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'var(--forest-950)', color: 'var(--neutral-0)' }}
      >
        <ArrowUpRight className="w-4 h-4" />
      </span>
    );
  }
  return (
    <span
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: 'var(--gold-50)', border: '1px solid var(--gold-200)' }}
    >
      <CreditCard className="w-4 h-4" style={{ color: 'var(--gold-700)' }} />
    </span>
  );
}
