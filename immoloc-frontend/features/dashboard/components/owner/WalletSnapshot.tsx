'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Clock, Landmark, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
/** Number(undefined) donne NaN : le montant s'affichait « NaN ». */
const money = (n?: number) => nf.format(Number.isFinite(Number(n)) ? Number(n) : 0);

interface Props {
  available: number;
  pending: number;
  processing: number;
  isLoading?: boolean;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    // Le degrade partait de forest-950 pour y revenir via #072A20, soit
    // forest-900 en hexadecimal brut. Le halo radial remplace aussi les deux
    // orbes floutes en blur-3xl.
    <section className="klef-rise flex h-full min-h-[22rem] flex-col rounded-card bg-[radial-gradient(75%_55%_at_50%_0%,var(--forest-700)_0%,rgba(15,80,61,0)_70%),linear-gradient(180deg,var(--forest-900)_0%,var(--forest-950)_100%)] p-6 text-white">
      {children}
    </section>
  );
}

export function WalletSnapshot({ available, pending, processing, isLoading = false }: Props) {
  const av = Math.max(0, Number(available) || 0);
  const pe = Math.max(0, Number(pending) || 0);
  const pr = Math.max(0, Number(processing) || 0);
  const total = av + pe + pr;

  const canWithdraw = av > 0;

  const segments = [
    { key: 'av', label: 'Disponible', value: av, tone: 'bg-lime-400', dot: 'bg-lime-400', text: 'text-lime-400' },
    { key: 'pe', label: 'En séquestre', value: pe, tone: 'bg-warning-500', dot: 'bg-warning-500', text: 'text-warning-500' },
    { key: 'pr', label: 'En traitement', value: pr, tone: 'bg-forest-400', dot: 'bg-forest-400', text: 'text-forest-300' },
  ] as const;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex-1 animate-pulse space-y-5" aria-hidden="true">
          <div className="h-10 w-40 rounded-inner bg-white/10" />
          <div className="h-2 rounded-pill bg-white/10" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-inner bg-white/10" />
            <div className="h-20 rounded-inner bg-white/10" />
          </div>
        </div>
        <span className="sr-only" role="status">Chargement du portefeuille</span>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-inner bg-white/[0.07] text-forest-200">
            <Wallet className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-forest-200">Portefeuille</p>
            <h2 className="font-display text-base font-semibold tracking-[-0.015em] text-neutral-50">
              Solde et retraits
            </h2>
          </div>
        </div>
        <Link
          href="/dashboard/wallet"
          // Le lien n'avait aucun libelle : un lecteur d'ecran annoncait
          // « lien » sans destination.
          aria-label="Ouvrir le portefeuille"
          className="grid h-9 w-9 place-items-center rounded-pill border border-white/10 bg-white/[0.06] text-forest-200 transition-colors duration-150 hover:bg-white/10 hover:text-neutral-50"
        >
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      {/* ── Solde disponible ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-[0.6875rem] uppercase tracking-[0.14em] text-forest-200">Solde disponible</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tabular-nums tracking-[-0.025em] text-neutral-50 sm:text-4xl">
            {money(av)}
          </span>
          <span className="text-sm text-forest-200">FCFA</span>
        </p>

        {/* « Retirable immédiatement » s'affichait sous un solde de 0 FCFA,
            avec un écusson vert. */}
        <p className={cn('mt-2 text-xs', canWithdraw ? 'text-on-inverse-marker' : 'text-forest-200')}>
          {canWithdraw
            ? 'Retirable immédiatement'
            : pe > 0
              ? 'Vos fonds se libéreront après la remise des clés'
              : 'Aucun montant disponible pour l’instant'}
        </p>
      </div>

      {/* ── Répartition ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="mb-2 text-[0.6875rem] uppercase tracking-[0.12em] text-forest-200">Répartition</p>

        {/*
          La barre montrait « X% disponible » sur une seule couleur, et
          `total > 0 ? … : 100` affichait 100% quand tout etait a zero :
          un portefeuille vide se lisait comme un portefeuille plein.

          Trois segments empiles disent la verite : ce qui est a vous, ce qui
          est encore sous sequestre, et ce qui est deja parti en virement.
        */}
        {total > 0 ? (
          <>
            <div
              className="flex h-2 overflow-hidden rounded-pill bg-white/10"
              role="img"
              aria-label={segments.filter((s) => s.value > 0)
                .map((s) => `${s.label} ${money(s.value)} FCFA`).join(', ')}
            >
              {segments.map((s) => s.value > 0 && (
                <span
                  key={s.key}
                  className={cn('h-full', s.tone)}
                  style={{
                    width: `${(s.value / total) * 100}%`,
                    transition: 'width 320ms cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              ))}
            </div>

            <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {segments.filter((s) => s.value > 0).map((s) => (
                <li key={s.key} className="flex items-center gap-1.5 text-[0.6875rem] text-forest-200">
                  <span className={cn('h-2 w-2 rounded-pill', s.dot)} aria-hidden="true" />
                  {s.label}
                  <span className="tabular-nums text-neutral-50">
                    {Math.round((s.value / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="h-2 rounded-pill bg-white/10" aria-hidden="true" />
        )}
      </div>

      {/* ── Sous-soldes ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { icon: Clock, label: 'En séquestre', value: pe, sub: 'Libéré à la remise des clés', tone: 'text-warning-500' },
          { icon: Landmark, label: 'En traitement', value: pr, sub: 'Virements en cours', tone: 'text-forest-200' },
        ].map(({ icon: Icon, label, value, sub, tone }) => (
          <div key={label} className="rounded-inner border border-white/10 bg-white/[0.04] p-3.5">
            <div className="mb-2 flex items-center gap-2">
              {/* text-warning-400 n'existe pas dans l'echelle (50, 500, 600,
                  700) : la classe ne produisait rien. */}
              <Icon className={cn('h-4 w-4 shrink-0', tone)} aria-hidden="true" />
              <span className="text-[0.6875rem] uppercase tracking-[0.1em] text-forest-200">{label}</span>
            </div>
            <p className="text-lg font-semibold tabular-nums text-neutral-50">{money(value)}</p>
            <p className="mt-0.5 text-[0.6875rem] leading-snug text-forest-200/70">{sub}</p>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      {/*
        Le bouton « Retirer mes fonds » etait toujours actif, meme a zero :
        il menait a une page ou il n'y avait rien a retirer. Il n'apparait
        que si un retrait est possible.

        L'icone Sparkles a aussi disparu : un retrait bancaire n'est pas une
        etincelle.
      */}
      {canWithdraw ? (
        <Link
          href="/dashboard/wallet"
          className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-action py-3 text-sm font-semibold text-on-action transition-colors duration-150 hover:bg-action-hover"
        >
          Retirer {money(av)} FCFA
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <Link
          href="/dashboard/wallet"
          className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-white/15 py-3 text-sm font-medium text-neutral-50 transition-colors duration-150 hover:bg-white/10"
        >
          Voir mon portefeuille
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </Shell>
  );
}