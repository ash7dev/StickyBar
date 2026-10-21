'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { dashboardApi } from '@/lib/nestjs';
import type { OwnerRevenueResponse } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';
import { monthLong, monthShort } from '@/features/owner-home/lib/format';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOwnerStatement } from '../hooks/use-owner-revenue';
import { StatementBody } from './StatementBody';

const SELECTABLE_MONTHS = 6;

/** Relevé de revenus d'un mois, avec choix du mois (mini-barres), PDF et CSV. */
export function StatementCard({ history }: { history: OwnerRevenueResponse['history'] }) {
  const months = history.slice(-SELECTABLE_MONTHS);
  const [month, setMonth] = useState(() => months.at(-1)?.month ?? null);
  const { data: statement, isLoading, isError } = useOwnerStatement(month);
  const { data: user } = useCurrentUser();
  const [downloading, setDownloading] = useState(false);
  const max = Math.max(...months.map((m) => m.revenueNet), 1);

  if (!month) return null;
  const [year] = month.split('-');

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      await dashboardApi.downloadOwnerStatementCsv(month);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Téléchargement impossible');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article
      aria-labelledby="revenue-statement"
      className="flex flex-col gap-6 rounded-[28px] border border-border/70 bg-background-card p-6 shadow-[0_20px_50px_rgba(4,25,18,0.06)] sm:p-8"
    >
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-foreground-muted">RELEVÉ DE REVENUS</p>
          <h2 id="revenue-statement" className="mt-1.5 font-display text-3xl font-semibold capitalize text-foreground">
            {monthLong(month)} {year}
          </h2>
          {user?.prenom && (
            <p className="mt-1 text-[13px] text-foreground-muted">
              {[user.prenom, user.nom].filter(Boolean).join(' ')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div role="group" aria-label="Mois du relevé" className="flex items-end gap-1">
            {months.map((m) => {
              const active = m.month === month;
              return (
                <button
                  key={m.month}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Relevé de ${monthLong(m.month)}`}
                  onClick={() => setMonth(m.month)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] transition-colors',
                    active ? 'bg-forest-950 font-bold text-neutral-50' : 'text-foreground-muted hover:bg-background-alt',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn('w-[18px] rounded-[5px]', active ? 'bg-lime-400' : 'bg-forest-100')}
                    style={{ height: `${8 + (m.revenueNet / max) * 30}px` }}
                  />
                  {monthShort(m.month)}
                </button>
              );
            })}
          </div>
          <span className="mx-1.5 hidden h-12 w-px bg-border sm:block" aria-hidden="true" />
          <a
            href={`/releve/${month}`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center gap-2 rounded-pill bg-forest-950 px-4 text-[13px] font-semibold text-neutral-50 transition-opacity hover:opacity-90"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            PDF
          </a>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={downloading}
            className="inline-flex h-10 items-center gap-2 rounded-pill border border-border px-4 text-[13px] font-semibold text-foreground transition-colors hover:bg-background-alt disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {downloading ? 'Export…' : 'CSV'}
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-background-alt" aria-busy="true" />
      ) : isError || !statement ? (
        <p role="alert" className="text-sm text-error-700">Impossible de charger le relevé de ce mois.</p>
      ) : (
        <StatementBody statement={statement} />
      )}
    </article>
  );
}
