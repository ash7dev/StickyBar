import Link from 'next/link';
import type { OwnerRevenueResponse, RevenueTimelineEvent } from '@/lib/nestjs';
import { formatFCFA } from '@/features/wallet/lib/transaction-labels';
import { cn } from '@/lib/utils/cn';
import { formatShort } from '@/features/calendar/lib/days';

// ── Carte Wallet ────────────────────────────────────────────────────────────

export function WalletSummaryCard({ wallet }: { wallet: OwnerRevenueResponse['wallet'] }) {
  return (
    <section
      aria-labelledby="revenue-wallet"
      className="flex flex-[1_1_320px] flex-col gap-4 rounded-[28px] border border-white/10 bg-forest-950 p-6 text-neutral-50"
    >
      <h2 id="revenue-wallet" className="text-[13px] font-semibold text-forest-200">
        Solde disponible
      </h2>
      <p className="-mt-2 whitespace-nowrap font-display text-[clamp(2rem,2.8vw,2.6rem)] font-semibold leading-tight">
        {formatFCFA(wallet.available)}
      </p>
      <div className="flex gap-2">
        <Link
          href="/dashboard/wallet"
          className="flex h-12 flex-1 items-center justify-center rounded-pill bg-lime-400 text-sm font-bold text-forest-800 transition-opacity hover:opacity-90"
        >
          Retirer
        </Link>
        <a
          href="#transactions"
          className="flex h-12 flex-1 items-center justify-center rounded-pill border border-white/20 text-sm font-semibold transition-colors hover:bg-white/5"
        >
          Historique
        </a>
      </div>
      <dl className="mt-auto grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
          <dt className="text-[11px] text-forest-200">En séquestre</dt>
          <dd className="mt-1 whitespace-nowrap text-base font-bold">{formatFCFA(wallet.escrow)}</dd>
        </div>
        <div className="rounded-2xl bg-white/[0.06] px-4 py-3">
          <dt className="text-[11px] text-forest-200">Retiré ce mois</dt>
          <dd className="mt-1 whitespace-nowrap text-base font-bold">{formatFCFA(wallet.withdrawnThisMonth)}</dd>
        </div>
      </dl>
    </section>
  );
}

// ── Chronologie des versements ──────────────────────────────────────────────

const METHODES: Record<string, string> = { WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', VIREMENT: 'virement' };

function eventView(e: RevenueTimelineEvent) {
  switch (e.kind) {
    case 'UPCOMING':
      return {
        kicker: `${formatShort(e.date)} · à venir`,
        kickerClass: 'text-lime-800',
        dot: 'bg-lime-400 border-2 border-lime-600',
        amount: formatFCFA(e.amount),
        detail: `${e.locatairePrenom}, ${e.logementTitre}`,
      };
    case 'CREDITED':
      return {
        kicker: `${formatShort(e.date)} · crédité`,
        kickerClass: 'text-foreground-muted',
        dot: 'bg-forest-600',
        amount: formatFCFA(e.amount),
        detail: [e.locatairePrenom, e.logementTitre].filter(Boolean).join(', ') || 'Revenu de location',
      };
    case 'WITHDRAWAL':
      return {
        kicker: `${formatShort(e.date)} · retrait ${METHODES[e.methode] ?? e.methode}`,
        kickerClass: 'text-foreground-muted',
        dot: 'border-2 border-neutral-400 bg-background-card',
        amount: `− ${formatFCFA(e.amount)}`,
        detail: e.statut === 'REJETE' ? 'Refusé, montant recrédité' : e.statut === 'EN_ATTENTE' ? 'En cours de traitement' : 'Effectué',
      };
  }
}

export function PayoutsTimeline({ timeline, escrow }: { timeline: RevenueTimelineEvent[]; escrow: number }) {
  return (
    <section
      aria-labelledby="revenue-payouts"
      className="flex flex-[1_1_320px] flex-col gap-4 rounded-[28px] border border-border/70 bg-background-card p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="revenue-payouts" className="text-[15px] font-bold text-foreground">
          Versements
        </h2>
        {escrow > 0 && (
          <span className="whitespace-nowrap rounded-pill bg-lime-50 px-2.5 py-1 text-xs font-bold text-lime-800">
            {formatFCFA(escrow)} à venir
          </span>
        )}
      </div>

      {timeline.length === 0 ? (
        <p className="text-sm text-foreground-muted">Aucun versement pour l’instant. Ils apparaîtront après vos premiers séjours.</p>
      ) : (
        <ol className="flex flex-col">
          {timeline.map((e, i) => {
            const v = eventView(e);
            const last = i === timeline.length - 1;
            return (
              <li key={`${e.kind}-${e.date}-${i}`} className="flex gap-3.5">
                <div className="flex flex-col items-center" aria-hidden="true">
                  <span className={cn('mt-1 h-3 w-3 shrink-0 rounded-pill', v.dot)} />
                  {!last && <span className="w-0.5 flex-1 bg-border" />}
                </div>
                <div className={cn(!last && 'pb-[18px]')}>
                  <p className={cn('text-xs font-bold uppercase', v.kickerClass)}>{v.kicker}</p>
                  <p className="mt-0.5 text-sm text-foreground">
                    <strong className="whitespace-nowrap">{v.amount}</strong> · {v.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
