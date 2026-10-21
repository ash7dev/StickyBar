import Link from 'next/link';
import type { OwnerRevenueResponse } from '@/lib/nestjs';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import { percent } from '@/features/owner-home/lib/format';

export function PerLogementTable({ logements }: { logements: OwnerRevenueResponse['logements'] }) {
  const sorted = [...logements].sort((a, b) => b.metrics.revenueNet - a.metrics.revenueNet);

  return (
    <section
      aria-labelledby="revenue-per-logement"
      className="flex min-w-0 flex-[2_1_560px] flex-col gap-4 rounded-[28px] border border-border/70 bg-background-card p-6"
    >
      <h2 id="revenue-per-logement" className="text-[15px] font-bold text-foreground">
        Par bien
      </h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-foreground-muted">Aucun bien pour l’instant.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] text-foreground-muted">
                <th scope="col" className="pb-2.5 font-semibold">BIEN</th>
                <th scope="col" className="pb-2.5 font-semibold">OCCUPATION</th>
                <th scope="col" className="pb-2.5 text-right font-semibold">NUITS</th>
                <th scope="col" className="pb-2.5 text-right font-semibold">NET / NUIT</th>
                <th scope="col" className="pb-2.5 text-right font-semibold">REVENU NET</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ id, titre, metrics }) => {
                const weak = metrics.occupancy.availableNights > 0 && metrics.occupancy.rate < 0.5;
                return (
                  <tr key={id} className="border-t border-border">
                    <th scope="row" className="py-3.5 pr-3 text-left font-semibold text-foreground">
                      <Link href={`/dashboard/annonces/${id}`} className="hover:text-link">
                        {titre}
                      </Link>
                    </th>
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-pill bg-neutral-100">
                          <div
                            className={cn('h-1.5 rounded-pill', weak ? 'bg-gold-400' : 'bg-forest-600')}
                            style={{ width: `${Math.min(metrics.occupancy.rate, 1) * 100}%` }}
                          />
                        </div>
                        <span className="tabular-nums">{percent(metrics.occupancy.rate)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right tabular-nums">{metrics.nightsSold}</td>
                    <td className="py-3.5 text-right tabular-nums">
                      {metrics.netPerNight !== null ? formatFCFA(metrics.netPerNight) : '—'}
                    </td>
                    <td className="py-3.5 text-right font-bold tabular-nums">{formatFCFA(metrics.revenueNet)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
