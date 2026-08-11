'use client';

import type { ComponentType } from 'react';
import { AlertTriangle, Coins, Lock, ShieldCheck, TrendingUp } from 'lucide-react';
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

/* `null` → « — », jamais « 0 FCFA ». Sur un compte de séquestre, afficher un
   solde nul là où la donnée n'est pas arrivée est le pire affichage possible :
   c'est indiscernable d'un compte réellement vide.
   `Intl` en style currency XOF rendait « 12 345 F CFA » ; le reste de l'app
   écrit « 12 345 FCFA ». */
const fmt = (n?: number | null) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

interface Compte {
  cle: string;
  icon: ComponentType<{ className?: string }>;
  titre: string;
  etiquette: string;
  montant?: number;
  note: string;
}

export function AdminSystemLedgerCard({ data, isLoading }: AdminSystemLedgerCardProps) {
  if (isLoading) {
    return (
      <div className="section-inverse space-y-5 p-6 sm:p-8" aria-busy="true">
        <div className="h-7 w-1/3 animate-pulse rounded-pill bg-border-inverse-strong" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-card bg-border-inverse-strong" />
          ))}
        </div>
      </div>
    );
  }

  /* `data?.soldeSequestre ?? 0` transformait une absence de réponse en solde à
     zéro. Les valeurs restent `undefined` et l'écran le dit. */
  const indisponible = !data;

  const comptes: Compte[] = [
    {
      cle: 'sequestre',
      icon: Lock,
      titre: 'Séquestre actif',
      etiquette: 'En attente de check-in',
      montant: data?.soldeSequestre,
      note: 'Fonds des réservations en cours, non encore reversés aux hôtes.',
    },
    {
      cle: 'commissions',
      icon: TrendingUp,
      titre: 'Commissions acquises',
      etiquette: 'Revenu net',
      montant: data?.soldeCommissionsCumulees,
      /* « Commissions 7% » était écrit en dur — le taux varie et n'est pas
         connu de ce composant. Le ×1,07 du prix public est par ailleurs une
         majoration, pas la commission : deux notions que le libellé
         confondait. */
      note: 'Chiffre d’affaires net perçu, commissions et pénalités.',
    },
    {
      cle: 'pool',
      icon: Coins,
      titre: 'Pool Teranga Club',
      etiquette: 'Budget fidélité',
      montant: data?.soldePoolTeranga,
      note: 'Provision Klef finançant les Klef Coins émis.',
    },
  ];

  const total = indisponible
    ? undefined
    : comptes.reduce((acc, c) => acc + (Number(c.montant) || 0), 0);

  return (
    <section className="section-inverse relative overflow-hidden p-6 shadow-lg sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-pill bg-forest-700/40 blur-3xl"
      />

      <div className="relative z-10 space-y-6">
        {/* ── En-tête ────────────────────────────────────────────────────── */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow flex items-center gap-1.5 text-[0.6875rem]">
              {/* L'accent marque : il tient dans l'icône, pas dans la phrase. */}
              <ShieldCheck className="h-3.5 w-3.5 text-on-inverse-marker" aria-hidden />
              Grand livre système
            </p>
            <h2 className="mt-1.5 font-display text-xl font-semibold text-on-inverse-display sm:text-2xl">
              Trésorerie et fonds sous séquestre
            </h2>
            <p className="mt-1 text-xs text-on-inverse-muted">
              Encaissements en attente de check-in et revenus acquis.
            </p>
          </div>

          {/* ⚠️ Ici se trouvait un badge « Trésorerie 100% Équilibrée &
              Solvable », avec un point vert clignotant — affirmé en dur, jamais
              calculé, et donc affiché à l'identique sur une trésorerie en
              déficit. Sur un écran de séquestre, une garantie de solvabilité
              qui ne vérifie rien est pire que pas de badge du tout.
              Remplacé par le seul chiffre que ce composant peut établir : la
              somme des trois comptes. Une vraie mesure de solvabilité exige
              le passif (dû aux hôtes), qui n'est pas dans ce type. */}
          <div className="shrink-0 rounded-card border border-border-inverse bg-surface-inverse-alt px-4 py-3">
            <p className="eyebrow text-[0.6875rem]">Total en trésorerie</p>
            <p className="mt-1 font-display text-xl font-semibold tabular-nums text-on-inverse-display">
              {fmt(total)}
            </p>
          </div>
        </header>

        {indisponible && (
          <p className="flex items-start gap-2 rounded-inner border border-border-inverse bg-surface-inverse-alt px-3.5 py-2.5 text-xs text-on-inverse-muted">
            <AlertTriangle className="mt-px h-4 w-4 shrink-0 text-on-inverse-marker" aria-hidden />
            Les soldes n’ont pas pu être chargés. Aucun montant n’est affiché — ne pas les
            interpréter comme nuls.
          </p>
        )}

        {/* ── Comptes ────────────────────────────────────────────────────── */}
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {comptes.map(({ cle, icon: Icon, titre, etiquette, montant, note }) => (
            <div
              key={cle}
              className="space-y-2 rounded-card border border-border-inverse bg-surface-inverse-alt p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-on-inverse-muted">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-on-inverse-marker" aria-hidden />
                  {titre}
                </dt>
                {/* Les trois étiquettes étaient écrites en lime ou en gold —
                    l'accent portait des phrases, et le gold, qui signale le
                    statut, chiffrait de l'argent. Toutes neutres. */}
                <span className="shrink-0 rounded-pill border border-border-inverse px-2 py-0.5 text-xs text-on-inverse-muted">
                  {etiquette}
                </span>
              </div>

              <dd>
                <p
                  className={cn(
                    'font-display text-2xl font-semibold tabular-nums',
                    montant == null ? 'text-on-inverse-muted' : 'text-on-inverse-display',
                  )}
                >
                  {fmt(montant)}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-on-inverse-muted">{note}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}