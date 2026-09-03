'use client';

import { useMemo, type ComponentType } from 'react';
import {
  Calendar, CheckCircle2, Clock, Eye, ImageIcon, MapPin, Scale, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DisputeItem {
  id: string;
  reservationId: string;
  declarePar: 'LOCATAIRE' | 'PROPRIETAIRE';
  motif: string;
  description: string;
  statut: 'EN_ATTENTE' | 'FONDE' | 'NON_FONDE';
  decisionAdmin?: string | null;
  coutEstime?: number | null;
  montantCompensation?: number | null;
  creeLe?: string;
  resoluLe?: string | null;
  reservation?: {
    id: string;
    locataire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string };
    proprietaire?: { id: string; prenom?: string; nom?: string; email?: string; telephone?: string };
    logement?: { id: string; titre?: string; ville?: string };
    photosEtatLieu?: Array<{ id: string; url: string; type?: string; categorie?: string }>;
  };
}

interface AdminDisputesTableProps {
  disputes: DisputeItem[];
  isLoading?: boolean;
  onInspect: (dispute: DisputeItem) => void;
  onResolve: (dispute: DisputeItem) => void;
}

/* Un litige FONDÉ était en vert forêt, comme une réussite. C'est l'inverse :
   un litige fondé signifie que la plaine est justifiée, qu'une indemnisation
   part et qu'un hôte ou un locataire a mal agi. Le vert allait à NON_FONDÉ,
   qui est l'issue sans conséquence. Neutre pour l'un, warning pour l'autre —
   la table de modération n'a pas à se réjouir d'un litige. */
const STATUTS: Record<
  DisputeItem['statut'],
  { label: string; Icon: ComponentType<{ className?: string }>; badge: string }
> = {
  EN_ATTENTE: {
    label: 'À arbitrer',
    Icon: Clock,
    badge: 'border-warning-500/25 bg-warning-50 text-warning-700',
  },
  FONDE: {
    label: 'Fondé',
    Icon: Scale,
    badge: 'border-error-500/25 bg-error-50 text-error-700',
  },
  NON_FONDE: {
    label: 'Non fondé',
    Icon: XCircle,
    badge: 'border-border bg-background-alt text-foreground-muted',
  },
};

const MOTIFS: Record<string, string> = {
  LOGEMENT_NON_CONFORME: 'Logement non conforme',
  LOGEMENT_INACCESSIBLE: 'Logement inaccessible',
  DEPASSEMENT_PERSONNES: 'Dépassement de personnes',
  DOMMAGES: 'Dommages',
  NON_PAIEMENT: 'Non-paiement de suppléments',
  AUTRE: 'Autre',
};

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

const JOUR = 86_400_000;
const joursDepuis = (iso?: string) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / JOUR);
};

const nomComplet = (u?: { prenom?: string; nom?: string } | null) =>
  `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim() || '—';

const COLONNES = ['Litige', 'Parties', 'Logement', 'Enjeu', 'Statut', 'Actions'];

export function AdminDisputesTable({
  disputes,
  isLoading = false,
  onInspect,
  onResolve,
}: AdminDisputesTableProps) {
  /* Les litiges arrivaient dans l'ordre de l'API. Sur une file d'arbitrage,
     ce qui attend depuis le plus longtemps doit remonter : c'est ce qui
     déclenche des relances, et parfois des recours. */
  const lignes = useMemo(
    () =>
      [...disputes].sort((a, b) => {
        const aAttente = a.statut === 'EN_ATTENTE' ? 0 : 1;
        const bAttente = b.statut === 'EN_ATTENTE' ? 0 : 1;
        if (aAttente !== bAttente) return aAttente - bAttente;
        return new Date(a.creeLe ?? 0).getTime() - new Date(b.creeLe ?? 0).getTime();
      }),
    [disputes],
  );

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6" aria-busy="true">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-20 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (lignes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-card border border-dashed border-border bg-background-card p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 text-forest-700">
          <Scale className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">Aucun litige</p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Aucun litige ne correspond au filtre ou à la recherche.
          </p>
        </div>
      </div>
    );
  }

  const bouton =
    'inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-semibold transition-colors';

  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-background-alt text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
            <tr>
              {COLONNES.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={cn(
                    'px-4 py-3.5',
                    i === 0 && 'sm:px-6',
                    i === 3 && 'text-right',
                    i === COLONNES.length - 1 && 'text-right sm:px-6',
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {lignes.map((item) => {
              const statut = STATUTS[item.statut] ?? STATUTS.EN_ATTENTE;
              const StatutIcon = statut.Icon;
              const parLocataire = item.declarePar === 'LOCATAIRE';
              const preuves = item.reservation?.photosEtatLieu?.length ?? 0;
              const attente = item.statut === 'EN_ATTENTE' ? joursDepuis(item.creeLe) : null;
              const dort = attente != null && attente >= 3;
              const reference = MOTIFS[item.motif] ?? item.motif;

              return (
                <tr key={item.id} className="align-top transition-colors hover:bg-background-alt">
                  {/* ── Litige ───────────────────────────────────────── */}
                  <td className="px-4 py-4 sm:px-6">
                    <p className="font-semibold text-foreground">{reference}</p>
                    {/* La description était tronquée sans recours : ni infobulle
                        ni retour à la ligne. Deux lignes + `title`. */}
                    <p
                      title={item.description}
                      className="mt-0.5 line-clamp-2 max-w-[240px] text-xs leading-relaxed text-foreground-muted"
                    >
                      {item.description}
                    </p>
                    <p
                      className={cn(
                        'mt-1 flex items-center gap-1 text-xs tabular-nums',
                        dort ? 'font-semibold text-warning-700' : 'text-foreground-muted',
                      )}
                    >
                      <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                      {fmtDate(item.creeLe)}
                      {attente != null && attente > 0 && ` · ${attente} j d’attente`}
                    </p>
                  </td>

                  {/* ── Parties ──────────────────────────────────────────
                      « Déclaré par » occupait une colonne entière pour un mot,
                      pendant que les deux parties étaient listées à côté sans
                      qu'on sache laquelle se plaint. Le marqueur est posé sur
                      la bonne personne. */}
                  <td className="px-4 py-4">
                    <dl className="space-y-1.5">
                      {([
                        { cle: 'loc', role: 'Locataire', personne: item.reservation?.locataire, plaignant: parLocataire },
                        { cle: 'prop', role: 'Hôte', personne: item.reservation?.proprietaire, plaignant: !parLocataire },
                      ]).map(({ cle, role, personne, plaignant }, i) => (
                        <div key={cle} className={i === 1 ? 'border-t border-border pt-1.5' : undefined}>
                          <dt className="flex items-center gap-1.5 text-xs text-foreground-muted">
                            {role}
                            {plaignant && (
                              <span className="rounded-pill border border-warning-500/25 bg-warning-50 px-1.5 py-0.5 text-xs font-medium text-warning-700">
                                déclarant
                              </span>
                            )}
                          </dt>
                          <dd className="font-semibold text-foreground">{nomComplet(personne)}</dd>
                          {personne?.email && (
                            <dd className="max-w-[150px] truncate text-xs text-foreground-muted">
                              {personne.email}
                            </dd>
                          )}
                        </div>
                      ))}
                    </dl>
                  </td>

                  {/* ── Logement ─────────────────────────────────────── */}
                  <td className="px-4 py-4">
                    <p className="max-w-[160px] truncate font-semibold text-foreground">
                      {item.reservation?.logement?.titre ?? '—'}
                    </p>
                    {item.reservation?.logement?.ville && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-foreground-muted">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {item.reservation.logement.ville}
                      </p>
                    )}
                    {/* `photosEtatLieu` était dans le type et jamais lu : un
                        litige sans photo d'état des lieux ne s'arbitre pas de
                        la même façon qu'un litige avec huit clichés. */}
                    <p
                      className={cn(
                        'mt-1 flex items-center gap-1 text-xs tabular-nums',
                        preuves === 0 ? 'text-warning-700' : 'text-foreground-muted',
                      )}
                    >
                      <ImageIcon className="h-3 w-3 shrink-0" aria-hidden />
                      {preuves === 0
                        ? 'Aucun état des lieux'
                        : `${preuves} photo${preuves > 1 ? 's' : ''}`}
                    </p>
                  </td>

                  {/* ── Enjeu ────────────────────────────────────────────
                      `coutEstime` et `montantCompensation` étaient dans le type
                      sans jamais apparaître. Sur une file d'arbitrage, la somme
                      en jeu est le premier critère de priorité — c'était
                      exactement l'information manquante. */}
                  <td className="px-4 py-4 text-right">
                    <div className="space-y-0.5">
                      <p className="text-xs text-foreground-muted">Réclamé</p>
                      <p className="font-semibold tabular-nums text-foreground">
                        {fmtMontant(item.coutEstime)}
                      </p>
                      {item.montantCompensation != null && (
                        <>
                          <p className="pt-1 text-xs text-foreground-muted">Accordé</p>
                          <p className="font-semibold tabular-nums text-error-700">
                            {fmtMontant(item.montantCompensation)}
                          </p>
                        </>
                      )}
                    </div>
                  </td>

                  {/* ── Statut ───────────────────────────────────────── */}
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold',
                        statut.badge,
                      )}
                    >
                      <StatutIcon className="h-3.5 w-3.5" aria-hidden />
                      {statut.label}
                    </span>

                    {item.resoluLe && (
                      <p className="mt-1 text-xs tabular-nums text-foreground-muted">
                        Clos le {fmtDate(item.resoluLe)}
                      </p>
                    )}

                    {/* `decisionAdmin` n'était affiché nulle part : la table
                        montrait qu'un litige était tranché sans jamais dire
                        comment. */}
                    {item.decisionAdmin && (
                      <p
                        title={item.decisionAdmin}
                        className="mt-1 line-clamp-2 max-w-[170px] text-xs leading-relaxed text-foreground-muted"
                      >
                        {item.decisionAdmin}
                      </p>
                    )}
                  </td>

                  {/* ── Actions ──────────────────────────────────────── */}
                  <td className="px-4 py-4 text-right sm:px-6">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        aria-label={`Ouvrir le litige « ${reference} »`}
                        className={cn(
                          bouton,
                          'border border-border bg-background-card text-foreground hover:bg-background-alt',
                        )}
                      >
                        <Eye className="h-3.5 w-3.5 text-foreground-muted" aria-hidden />
                        <span className="hidden sm:inline">Détails</span>
                      </button>

                      {item.statut === 'EN_ATTENTE' && (
                        <button
                          type="button"
                          onClick={() => onResolve(item)}
                          aria-label={`Arbitrer le litige « ${reference} »`}
                          className={cn(bouton, 'btn-primary h-8 px-3 text-xs')}
                        >
                          <Scale className="h-3.5 w-3.5" aria-hidden />
                          <span className="hidden sm:inline">Arbitrer</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}