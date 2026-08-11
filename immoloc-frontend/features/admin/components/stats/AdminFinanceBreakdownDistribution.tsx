'use client';

import { useMemo, type ComponentType } from 'react';
import { Building2, Layers, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CityBreakdown {
  ville: string;
  gmv: number;
  commissions: number;
  count: number;
  logementsCount?: number;
  sharePct?: number;
}

interface TypeBreakdown {
  type: string;
  gmv: number;
  commissions: number;
  count: number;
}

interface AdminFinanceBreakdownDistributionProps {
  breakdownByCity: CityBreakdown[];
  breakdownByType: TypeBreakdown[];
  isLoading: boolean;
}

/* `null` → « — », pas « 0 FCFA » : sur un tableau de bord financier, un zéro
   affiché à la place d'une donnée absente se lit comme un résultat nul.
   Et `Intl` en style currency XOF rendait « 12 345 F CFA » alors que le reste
   de l'app écrit « 12 345 FCFA ». */
const fmt = (n?: number | null) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

const fmtCourt = (n?: number | null) => {
  const v = Number(n);
  if (n == null || Number.isNaN(v)) return '—';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} k`;
  return String(Math.round(v));
};

const pct1 = (v: number) => `${v.toFixed(1).replace('.', ',')} %`;

/* Libellés neutres. « Villas d'Exception » et « Chambres Hôtes » sont du
   vocabulaire de vitrine ; un tableau de bord financier nomme les catégories
   telles qu'elles existent en base. */
const TYPE_LABELS: Record<string, string> = {
  VILLA: 'Villa',
  APPARTEMENT: 'Appartement',
  STUDIO: 'Studio',
  CHAMBRE: 'Chambre',
};

interface LigneRepartition {
  cle: string;
  libelle: string;
  detail: string;
  gmv: number;
  commissions: number;
  part: number;
}

/* ─── Bloc de répartition ─────────────────────────────────────────────────── */

function Repartition({
  icon: Icon,
  titre,
  sousTitre,
  compteur,
  lignes,
  totalCommissions,
  totalGmv,
  couleurBarre,
  vide,
}: {
  icon: ComponentType<{ className?: string }>;
  titre: string;
  sousTitre: string;
  compteur: string;
  lignes: LigneRepartition[];
  totalCommissions: number;
  totalGmv: number;
  couleurBarre: string;
  vide: string;
}) {
  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-6 shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-start gap-2.5">
          <span className="marker-box h-8 w-8 shrink-0">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">{titre}</h3>
            <p className="mt-0.5 text-xs text-foreground-muted">{sousTitre}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-pill bg-background-alt px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground-muted">
          {compteur}
        </span>
      </header>

      {lignes.length === 0 ? (
        <p className="py-8 text-center text-xs text-foreground-muted">{vide}</p>
      ) : (
        <>
          <ul className="space-y-3.5">
            {lignes.map((l) => (
              <li key={l.cle} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <span className="truncate font-semibold text-foreground">{l.libelle}</span>
                    <span className="shrink-0 text-foreground-muted">{l.detail}</span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-3 tabular-nums">
                    <span className="text-foreground-muted">{fmtCourt(l.gmv)} GMV</span>
                    <span className="font-semibold text-foreground">{fmt(l.commissions)}</span>
                  </span>
                </div>

                {/* `Math.max(4, pct)` donnait la même barre à une ville qui pèse
                    0,4 % et à une qui pèse 4 %. Sur un graphe de parts, gonfler
                    les petites valeurs est un mensonge visuel. La largeur est
                    exacte ; la lisibilité passe par un minimum en pixels, qui
                    ne déforme pas l'échelle. */}
                <div
                  role="img"
                  aria-label={`${l.libelle} : ${pct1(l.part)} des commissions`}
                  className="h-2 w-full overflow-hidden rounded-pill bg-background-alt"
                >
                  <span
                    className={cn('block h-full min-w-[2px] rounded-pill', couleurBarre)}
                    style={{ width: `${l.part}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* Un classement sans total ne dit pas ce que représente le premier. */}
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3 text-xs">
            <span className="font-semibold text-foreground">Total</span>
            <span className="flex items-baseline gap-3 tabular-nums">
              <span className="text-foreground-muted">{fmtCourt(totalGmv)} GMV</span>
              <span className="font-display text-sm font-semibold text-foreground">
                {fmt(totalCommissions)}
              </span>
            </span>
          </div>
        </>
      )}
    </section>
  );
}

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminFinanceBreakdownDistribution({
  breakdownByCity,
  breakdownByType,
  isLoading,
}: AdminFinanceBreakdownDistributionProps) {
  /* Tri décroissant sur les commissions. Les listes arrivaient dans l'ordre de
     l'API : un « classement de performance » qui ne classe pas oblige à lire
     les dix lignes pour trouver la première. */
  const villes = useMemo(() => {
    const total = breakdownByCity.reduce((a, c) => a + (Number(c.commissions) || 0), 0);
    const gmv = breakdownByCity.reduce((a, c) => a + (Number(c.gmv) || 0), 0);
    const lignes: LigneRepartition[] = breakdownByCity
      .map((c) => {
        const commissions = Number(c.commissions) || 0;
        return {
          cle: c.ville || 'inconnue',
          libelle: c.ville || 'Ville inconnue',
          detail:
            c.logementsCount != null
              ? `${c.logementsCount} bien${c.logementsCount > 1 ? 's' : ''} · ${c.count} séjour${c.count > 1 ? 's' : ''}`
              : `${c.count} séjour${c.count > 1 ? 's' : ''}`,
          gmv: Number(c.gmv) || 0,
          commissions,
          /* `item.sharePct ?? calcul` mélangeait deux sources : rien ne
             garantit que le `sharePct` du backend est calculé sur les
             commissions et non sur le GMV. Une seule base, locale. */
          part: total > 0 ? (commissions / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.commissions - a.commissions);
    return { lignes, total, gmv };
  }, [breakdownByCity]);

  const types = useMemo(() => {
    const total = breakdownByType.reduce((a, c) => a + (Number(c.commissions) || 0), 0);
    const gmv = breakdownByType.reduce((a, c) => a + (Number(c.gmv) || 0), 0);
    const lignes: LigneRepartition[] = breakdownByType
      .map((t) => {
        const commissions = Number(t.commissions) || 0;
        return {
          cle: t.type || 'inconnu',
          libelle: TYPE_LABELS[t.type] ?? t.type ?? 'Non catégorisé',
          detail: `${t.count} séjour${t.count > 1 ? 's' : ''}`,
          gmv: Number(t.gmv) || 0,
          commissions,
          part: total > 0 ? (commissions / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.commissions - a.commissions);
    return { lignes, total, gmv };
  }, [breakdownByType]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-4 rounded-card border border-border bg-background-card p-6">
            <div className="h-10 animate-pulse rounded-inner bg-background-alt" />
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-8 animate-pulse rounded-inner bg-background-alt" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Repartition
        icon={MapPin}
        titre="Par ville"
        // La barre mesurait la part de commissions pendant que l'œil lisait le
        // GMV affiché à côté. La base est désormais annoncée.
        sousTitre="Part de chaque ville dans les commissions perçues"
        compteur={`${villes.lignes.length} ${villes.lignes.length > 1 ? 'villes' : 'ville'}`}
        lignes={villes.lignes}
        totalCommissions={villes.total}
        totalGmv={villes.gmv}
        couleurBarre="bg-forest-600"
        vide="Aucune donnée géographique sur cette période."
      />

      <Repartition
        icon={Building2}
        titre="Par type de bien"
        sousTitre="Part de chaque catégorie dans les commissions perçues"
        compteur={`${types.lignes.length} ${types.lignes.length > 1 ? 'catégories' : 'catégorie'}`}
        lignes={types.lignes}
        totalCommissions={types.total}
        totalGmv={types.gmv}
        /* Le gold porte le STATUT dans le système — badge Vérifié, étoiles.
           L'utiliser pour une série de données lui fait perdre ce sens. */
        couleurBarre="bg-info-500"
        vide="Aucune donnée par type sur cette période."
      />
    </div>
  );
}