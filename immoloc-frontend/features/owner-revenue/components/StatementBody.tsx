'use client';

import { useState } from 'react';
import type { OwnerStatementResponse } from '@/lib/nestjs';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { formatShort } from '@/features/calendar/lib/days';

const PREVIEW_ROWS = 6;

/**
 * Contenu du relevé mensuel (séjours, totaux, mouvements du wallet).
 * Partagé par la carte de la page Revenus et la page imprimable /releve/[mois].
 */
export function StatementBody({ statement, printable = false }: { statement: OwnerStatementResponse; printable?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const showAll = printable || expanded;
  const rows = showAll ? statement.stays : statement.stays.slice(0, PREVIEW_ROWS);
  const hidden = statement.stays.length - rows.length;
  const { wallet } = statement;

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="pb-2.5 text-left text-[13px] font-bold tracking-wide text-foreground-muted">
            SÉJOURS ({statement.stays.length})
          </caption>
          <thead>
            <tr className="text-left text-[11px] text-foreground-muted">
              <th scope="col" className="pb-2 font-semibold">ARRIVÉE</th>
              <th scope="col" className="pb-2 font-semibold">VOYAGEUR · BIEN</th>
              <th scope="col" className="pb-2 text-right font-semibold">PAYÉ</th>
              <th scope="col" className="pb-2 text-right font-semibold">COMMISSION</th>
              <th scope="col" className="pb-2 text-right font-semibold">NET</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={5} className="py-4 text-foreground-muted">
                  Aucun séjour arrivé ce mois-ci.
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.reservationId} className="border-t border-neutral-100">
                <td className="whitespace-nowrap py-3 text-foreground-muted">{formatShort(s.arrivee)}</td>
                <td className="py-3 text-foreground">
                  <strong>{s.locataire}</strong> · {s.logementTitre} · {s.nbNuits} nuit{s.nbNuits > 1 ? 's' : ''}
                </td>
                <td className="whitespace-nowrap py-3 text-right tabular-nums">{formatFCFA(s.paye)}</td>
                <td className="whitespace-nowrap py-3 text-right tabular-nums text-error-700">− {formatFCFA(s.commission)}</td>
                <td className="whitespace-nowrap py-3 text-right font-bold tabular-nums">{formatFCFA(s.net)}</td>
              </tr>
            ))}
            {hidden > 0 && (
              <tr className="border-t border-neutral-100">
                <td colSpan={5} className="py-3 text-[13px] text-foreground-muted">
                  + {hidden} autre{hidden > 1 ? 's' : ''} séjour{hidden > 1 ? 's' : ''} ·{' '}
                  <button type="button" onClick={() => setExpanded(true)} className="font-semibold text-link hover:text-link-hover">
                    tout afficher
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-5">
        <dl className="flex flex-[1_1_320px] flex-col gap-2.5 rounded-[20px] bg-background-alt p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Total payé par les voyageurs</dt>
            <dd className="tabular-nums">{formatFCFA(statement.totals.paye)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-error-700">
            <dt>Commission Paixi</dt>
            <dd className="tabular-nums">− {formatFCFA(statement.totals.commission)}</dd>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-4 border-t border-dashed border-neutral-300 pt-3">
            <dt className="font-semibold">Revenu net du mois</dt>
            <dd className="whitespace-nowrap font-display text-2xl font-semibold text-foreground">{formatFCFA(statement.totals.net)}</dd>
          </div>
        </dl>

        <dl className="flex flex-[1_1_320px] flex-col gap-2.5 rounded-[20px] border border-border p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Solde en début de mois</dt>
            <dd className="tabular-nums">{formatFCFA(wallet.opening)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Revenus crédités au check-in</dt>
            <dd className="tabular-nums text-success-700">+ {formatFCFA(wallet.credits)}</dd>
          </div>
          {wallet.deductions > 0 && (
            <div className="flex justify-between gap-4">
              <dt>Dettes et pénalités</dt>
              <dd className="tabular-nums text-error-700">− {formatFCFA(wallet.deductions)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt>Retraits demandés</dt>
            <dd className="tabular-nums">− {formatFCFA(wallet.withdrawals)}</dd>
          </div>
          {wallet.refunds > 0 && (
            <div className="flex justify-between gap-4">
              <dt>Remboursements (retraits refusés…)</dt>
              <dd className="tabular-nums text-success-700">+ {formatFCFA(wallet.refunds)}</dd>
            </div>
          )}
          <div className="mt-1.5 flex justify-between gap-4 border-t border-border pt-3">
            <dt className="font-semibold">Solde en fin de période</dt>
            <dd className="font-bold tabular-nums">{formatFCFA(wallet.closing)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
