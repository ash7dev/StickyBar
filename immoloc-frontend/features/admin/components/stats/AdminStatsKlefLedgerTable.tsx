'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowUpRight, Building2, Download, Receipt, Search, User,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface KlefLedgerEntry {
  id: string;
  date: string;
  title?: string;
  ville?: string;
  locataire?: string;
  totalBrut: number;
  partHote: number;
  partKlef: number;
  typeGain: string;
}

interface AdminStatsKlefLedgerTableProps {
  entries: KlefLedgerEntry[];
  isLoading: boolean;
}

/* Aligné sur le reste de l'app. `Intl` en style `currency` XOF rendait
   « 12 345 F CFA » ; ailleurs c'est « 12 345 FCFA ». Sur un journal comptable
   comparé à d'autres écrans, l'unité ne doit pas changer de forme.

   `null` renvoie « — » et non « 0 FCFA » : afficher un zéro comptable là où la
   donnée manque est la pire confusion possible sur un livre de comptes. */
const fmtMontant = (n?: number | null) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Écart toléré sur l'égalité brut = hôte + Klef, en francs. */
const TOLERANCE = 1;

export function AdminStatsKlefLedgerTable({ entries, isLoading }: AdminStatsKlefLedgerTableProps) {
  const [recherche, setRecherche] = useState('');

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.title, e.ville, e.locataire, e.typeGain, e.id]
        .some((champ) => (champ ?? '').toLowerCase().includes(q)),
    );
  }, [entries, recherche]);

  /* Un journal sans totaux n'est pas un journal : c'était la première chose
     qu'un comptable allait chercher, et il fallait sortir la calculatrice.
     Le taux effectif est CALCULÉ, jamais écrit en dur — voir plus bas. */
  const totaux = useMemo(() => {
    const t = lignes.reduce(
      (acc, e) => ({
        brut: acc.brut + (Number(e.totalBrut) || 0),
        hote: acc.hote + (Number(e.partHote) || 0),
        klef: acc.klef + (Number(e.partKlef) || 0),
      }),
      { brut: 0, hote: 0, klef: 0 },
    );
    return { ...t, taux: t.brut > 0 ? (t.klef / t.brut) * 100 : null };
  }, [lignes]);

  function exporterCsv() {
    const enTetes = ['Date', 'Reference', 'Logement', 'Ville', 'Locataire', 'Type', 'Brut', 'Part hote', 'Part Klef'];
    const echapper = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const corps = lignes.map((e) =>
      [e.date, e.id, e.title, e.ville, e.locataire, e.typeGain, e.totalBrut, e.partHote, e.partKlef]
        .map(echapper)
        .join(';'),
    );
    // BOM : sans lui, Excel ouvre les accents en mojibake.
    const blob = new Blob([`\uFEFF${[enTetes.map(echapper).join(';'), ...corps].join('\n')}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klef-journal-commissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  const cellule = 'px-4 py-4';
  const chiffre = 'text-right tabular-nums';

  return (
    <div className="space-y-4 rounded-card border border-border bg-background-card p-6 shadow-xs">
      {/* ── En-tête ───────────────────────────────────────────────────────
          Le titre annonçait « Commissions (7%) » et une colonne « Part Hôte
          (93%) ». Rien ne garantit ce taux : il varie par accord, et le ×1,07
          du prix public est une MAJORATION, pas la commission. Deux notions
          différentes que ce libellé confondait. Le taux affiché est
          désormais celui que produisent réellement les écritures. */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Receipt className="h-5 w-5 text-forest-600" aria-hidden />
            Journal des commissions
          </h3>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Part nette perçue par la plateforme, écriture par écriture.
          </p>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />
            {/* Pas de `text-xs` : la couche base force 16 px, un utilitaire de
                taille ici ferait zoomer Safari iOS au focus. */}
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              aria-label="Filtrer le journal par logement, ville, locataire ou référence"
              placeholder="Logement, ville, client…"
              className="h-10 w-full rounded-pill border border-border bg-background-alt pl-10 pr-4 text-foreground placeholder:text-neutral-500 transition-colors focus:border-forest-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={exporterCsv}
            disabled={lignes.length === 0}
            aria-label="Exporter le journal filtré au format CSV"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-pill border border-border bg-background-card px-3.5 text-xs font-semibold text-foreground transition-colors hover:bg-background-alt disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5 text-foreground-muted" aria-hidden />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {lignes.length === 0 ? (
        <div className="space-y-1.5 py-12 text-center">
          <Receipt className="mx-auto h-8 w-8 text-neutral-400" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Aucune écriture</p>
          <p className="text-xs text-foreground-muted">
            {recherche
              ? 'Aucune écriture ne correspond à ce filtre.'
              : 'Aucun gain enregistré sur la période.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Journal des commissions Klef, {lignes.length} écritures
            </caption>

            <thead className="border-b border-border bg-background-alt text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Date et référence</th>
                <th scope="col" className="px-4 py-3">Logement</th>
                <th scope="col" className="px-4 py-3">Locataire</th>
                {/* Les montants s'alignent à droite : c'est ce qui permet de
                    comparer des ordres de grandeur en balayant la colonne. */}
                <th scope="col" className={cn('px-4 py-3', chiffre)}>Brut</th>
                <th scope="col" className={cn('px-4 py-3', chiffre)}>Part hôte</th>
                <th scope="col" className={cn('px-4 py-3', chiffre)}>Part Klef</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {lignes.map((item) => {
                const brut = Number(item.totalBrut) || 0;
                const klef = Number(item.partKlef) || 0;
                const hote = Number(item.partHote) || 0;
                const taux = brut > 0 ? (klef / brut) * 100 : null;
                /* Sur un livre de comptes, une écriture qui ne s'équilibre pas
                   doit se voir. Rien ne le contrôlait. */
                const desequilibre = Math.abs(brut - hote - klef) > TOLERANCE;

                return (
                  <tr key={item.id} className="transition-colors hover:bg-background-alt">
                    <td className={cellule}>
                      <p className="font-semibold tabular-nums text-foreground">
                        {fmtDate(item.date)}
                      </p>
                      {/* `slice(0, 8) + '...'` donnait une référence qu'on ne
                          pouvait ni lire ni copier. */}
                      <p className="font-mono text-xs text-foreground-muted" title={item.id}>
                        {item.id}
                      </p>
                    </td>

                    <td className={cellule}>
                      <p className="flex max-w-[240px] items-center gap-1.5 font-semibold text-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                        <span className="truncate">{item.title ?? 'Logement'}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-muted">
                        {item.ville ?? '—'}
                        {/* `typeGain` était dans le type et n'apparaissait
                            nulle part : un journal doit dire la nature du
                            gain, pas seulement son montant. */}
                        {item.typeGain ? ` · ${item.typeGain.toLowerCase()}` : ''}
                      </p>
                    </td>

                    <td className={cellule}>
                      <p className="flex items-center gap-1.5 text-foreground">
                        <User className="h-3.5 w-3.5 shrink-0 text-foreground-muted" aria-hidden />
                        {item.locataire || 'Voyageur'}
                      </p>
                    </td>

                    <td className={cn(cellule, chiffre, 'font-display font-semibold text-foreground')}>
                      {fmtMontant(item.totalBrut)}
                      {desequilibre && (
                        <span
                          title="Brut ≠ part hôte + part Klef"
                          className="ml-1.5 inline-flex align-middle text-error-600"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          <span className="sr-only">Écriture déséquilibrée</span>
                        </span>
                      )}
                    </td>

                    <td className={cn(cellule, chiffre, 'text-foreground-muted')}>
                      {fmtMontant(item.partHote)}
                    </td>

                    <td className={cn(cellule, chiffre)}>
                      <span className="inline-flex items-center gap-1 rounded-pill border border-forest-100 bg-forest-50 px-2.5 py-1 font-display text-sm font-semibold text-forest-700">
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                        {fmtMontant(item.partKlef)}
                      </span>
                      {taux != null && (
                        <p className="mt-1 text-xs tabular-nums text-foreground-muted">
                          {taux.toFixed(1).replace('.', ',')} %
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="border-t-2 border-border bg-background-alt">
              <tr>
                <th scope="row" colSpan={3} className="px-4 py-3.5 text-left font-semibold text-foreground">
                  Total
                  <span className="ml-1.5 font-normal tabular-nums text-foreground-muted">
                    {lignes.length} écriture{lignes.length > 1 ? 's' : ''}
                    {recherche ? ' (filtré)' : ''}
                  </span>
                </th>
                <td className={cn('px-4 py-3.5', chiffre, 'font-display font-semibold text-foreground')}>
                  {fmtMontant(totaux.brut)}
                </td>
                <td className={cn('px-4 py-3.5', chiffre, 'font-display text-foreground-muted')}>
                  {fmtMontant(totaux.hote)}
                </td>
                <td className={cn('px-4 py-3.5', chiffre)}>
                  <p className="font-display text-sm font-semibold text-forest-700">
                    {fmtMontant(totaux.klef)}
                  </p>
                  {totaux.taux != null && (
                    <p className="mt-0.5 text-xs tabular-nums text-foreground-muted">
                      {totaux.taux.toFixed(1).replace('.', ',')} % en moyenne
                    </p>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}