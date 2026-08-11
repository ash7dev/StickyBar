'use client';

import type { ComponentType } from 'react';
import { Eye, Check, X, CheckCircle2, Clock, XCircle, RotateCcw, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface KycUserItem {
  id: string;
  userId?: string;
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  statutKyc: StatutKyc;
  kycDocumentUrl?: string | null;
  kycVersoUrl?: string | null;
  kycSelfieUrl?: string | null;
  kycRejectionReason?: string | null;
  selfieMatchScore?: number | null;
  creeLe?: string;
  misAJourLe?: string;
}

/* `A_RENOUVELER` manquait à l'union alors que `onFlagRenewal` était déjà dans
   les props et que AdminListingDetailModal affiche déjà ce badge. Le prop
   était passé et jamais appelé — le statut existait partout sauf ici. */
export type StatutKyc = 'NON_VERIFIE' | 'EN_ATTENTE' | 'VERIFIE' | 'REJETE' | 'A_RENOUVELER';

interface AdminKycTableProps {
  users: KycUserItem[];
  isLoading?: boolean;
  onInspect: (user: KycUserItem) => void;
  onVerify: (user: KycUserItem) => void;
  onReject: (user: KycUserItem) => void;
  onFlagRenewal: (user: KycUserItem) => void;
}

/* ─── Statuts ──────────────────────────────────────────────────────────────
   Un objet plutôt que cinq blocs conditionnels : un statut oublié devient une
   erreur TypeScript au lieu d'une cellule vide. `NON_VERIFIE` ne s'affichait
   nulle part — le modérateur ne savait pas s'il lisait un statut ou un bug.

   ⚠ Les rampes sémantiques s'arrêtent à 50/500/600/700. `warning-200`,
   `warning-800`, `error-200`, `error-800` et `purple-*` n'existent pas dans
   globals.css : les badges sortaient sans couleur de texte ni bordure. */

const STATUTS: Record<StatutKyc, { label: string; badge: string; Icon: ComponentType<{ className?: string }> }> = {
  VERIFIE: {
    label: 'Vérifié',
    badge: 'border-forest-100 bg-forest-50 text-forest-700',
    Icon: CheckCircle2,
  },
  EN_ATTENTE: {
    label: 'En attente',
    badge: 'border-warning-500/25 bg-warning-50 text-warning-700',
    Icon: Clock,
  },
  A_RENOUVELER: {
    label: 'À renouveler',
    badge: 'border-warning-500/25 bg-warning-50 text-warning-700',
    Icon: RotateCcw,
  },
  REJETE: {
    label: 'Rejeté',
    badge: 'border-error-500/25 bg-error-50 text-error-700',
    Icon: XCircle,
  },
  NON_VERIFIE: {
    label: 'Non vérifié',
    badge: 'border-border bg-background-alt text-foreground-muted',
    Icon: ShieldAlert,
  },
};

/* ─── Score de correspondance faciale ─────────────────────────────────────
   Un pourcentage seul n'aide pas à décider. Le seuil est nommé, et rien n'est
   marqué « bon » : au-dessus de 80 %, la lecture humaine reste requise —
   c'est l'agent qui valide, pas le modèle. */

function lireScore(score: number) {
  if (score >= 80) return { label: 'Concordance forte', ton: 'bg-forest-600 text-forest-700' };
  if (score >= 60) return { label: 'À examiner', ton: 'bg-warning-600 text-warning-700' };
  return { label: 'Concordance faible', ton: 'bg-error-600 text-error-700' };
}

const PIECES = [
  { cle: 'kycDocumentUrl', court: 'Recto' },
  { cle: 'kycVersoUrl', court: 'Verso' },
  { cle: 'kycSelfieUrl', court: 'Selfie' },
] as const;

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : null);

/* ─── Table ───────────────────────────────────────────────────────────────── */

export function AdminKycTable({
  users,
  isLoading = false,
  onInspect,
  onVerify,
  onReject,
  onFlagRenewal,
}: AdminKycTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-card border border-border bg-background-card p-6" aria-busy="true">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-inner bg-background-alt" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 rounded-card border border-dashed border-border bg-background-card p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-forest-50 text-forest-700">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <p className="font-display text-base font-semibold text-foreground">Aucun dossier à traiter</p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Tous les dossiers soumis ont été traités, ou aucun ne correspond à la recherche.
          </p>
        </div>
      </div>
    );
  }

  const boutonBase =
    'inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="overflow-hidden rounded-card border border-border bg-background-card shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-background-alt text-[0.6875rem] font-semibold uppercase tracking-wider text-foreground-muted">
            <tr>
              <th scope="col" className="px-4 py-3.5 sm:px-6">Utilisateur</th>
              <th scope="col" className="px-4 py-3.5">Pièces</th>
              <th scope="col" className="px-4 py-3.5">Correspondance faciale</th>
              <th scope="col" className="px-4 py-3.5">Statut</th>
              <th scope="col" className="px-4 py-3.5 text-right sm:px-6">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {users.map((item) => {
              const nomComplet = `${item.prenom ?? ''} ${item.nom ?? ''}`.trim() || 'Utilisateur Klef';
              const initiales =
                `${item.prenom?.[0] ?? ''}${item.nom?.[0] ?? ''}`.toUpperCase() ||
                (item.email?.[0] ?? 'U').toUpperCase();

              const statut = STATUTS[item.statutKyc] ?? STATUTS.NON_VERIFIE;
              const StatutIcon = statut.Icon;

              const deposees = PIECES.filter((p) => item[p.cle]);
              const dossierComplet = deposees.length === PIECES.length;
              const soumisLe = fmtDate(item.creeLe);

              return (
                <tr key={item.id} className="transition-colors hover:bg-background-alt">
                  {/* ── Identité ────────────────────────────────────── */}
                  <td className="px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner bg-forest-800 font-display text-xs font-semibold text-neutral-0"
                      >
                        {initiales}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{nomComplet}</p>
                        <p className="truncate text-xs text-foreground-muted">{item.email}</p>
                        {item.telephone && (
                          <p className="text-xs tabular-nums text-foreground-muted">{item.telephone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* ── Pièces déposées ─────────────────────────────────
                      Le badge « CNI / Passeport » affirmait un type de pièce
                      que rien dans les données ne confirme. Ce qui manque à
                      un dossier est une information ; son intitulé supposé
                      n'en est pas une. */}
                  <td className="px-4 py-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        {PIECES.map((p) => {
                          const presente = Boolean(item[p.cle]);
                          return (
                            <span
                              key={p.cle}
                              title={`${p.court} : ${presente ? 'déposé' : 'manquant'}`}
                              className={cn(
                                'rounded-pill border px-2 py-0.5 text-[0.6875rem] font-medium',
                                presente
                                  ? 'border-forest-100 bg-forest-50 text-forest-700'
                                  : 'border-dashed border-border bg-background-alt text-foreground-muted',
                              )}
                            >
                              {p.court}
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-xs text-foreground-muted">
                        {soumisLe ? `Soumis le ${soumisLe}` : 'Non soumis'}
                      </p>
                    </div>
                  </td>

                  {/* ── Correspondance faciale ──────────────────────── */}
                  <td className="px-4 py-4">
                    {item.selfieMatchScore != null ? (
                      (() => {
                        const score = Math.max(0, Math.min(100, item.selfieMatchScore));
                        const { label, ton } = lireScore(score);
                        const [fond, texte] = ton.split(' ');
                        return (
                          <div className="space-y-1.5">
                            <p className="flex items-baseline gap-2">
                              <span className="font-semibold tabular-nums text-foreground">
                                {Math.round(score)} %
                              </span>
                              <span className={cn('text-[0.6875rem] font-medium', texte)}>{label}</span>
                            </p>
                            <span
                              aria-hidden
                              className="block h-1.5 w-24 overflow-hidden rounded-pill bg-background-alt"
                            >
                              <span
                                className={cn('block h-full rounded-pill', fond)}
                                style={{ width: `${score}%` }}
                              />
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-foreground-muted">Vérification manuelle</span>
                    )}
                  </td>

                  {/* ── Statut ──────────────────────────────────────── */}
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-xs font-semibold',
                        statut.badge,
                      )}
                    >
                      <StatutIcon className="h-3.5 w-3.5" />
                      {statut.label}
                    </span>
                  </td>

                  {/* ── Actions ─────────────────────────────────────────
                      `title` seul n'étiquette pas un bouton dont le libellé
                      est masqué sous sm : le tooltip natif n'apparaît pas au
                      clavier et n'est pas lu partout. `aria-label` en plus. */}
                  <td className="px-4 py-4 text-right sm:px-6">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onInspect(item)}
                        aria-label={`Inspecter le dossier de ${nomComplet}`}
                        className={cn(
                          boutonBase,
                          'border border-border bg-background-card text-foreground hover:bg-background-alt',
                        )}
                      >
                        <Eye className="h-3.5 w-3.5 text-foreground-muted" aria-hidden />
                        <span className="hidden sm:inline">Inspecter</span>
                      </button>

                      {item.statutKyc === 'VERIFIE' ? (
                        <button
                          type="button"
                          onClick={() => onFlagRenewal(item)}
                          aria-label={`Demander le renouvellement du dossier de ${nomComplet}`}
                          className={cn(
                            boutonBase,
                            'border border-warning-500/25 bg-warning-50 text-warning-700 hover:bg-warning-50/70',
                          )}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          <span className="hidden sm:inline">À renouveler</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onVerify(item)}
                          disabled={!dossierComplet}
                          aria-label={
                            dossierComplet
                              ? `Valider le dossier de ${nomComplet}`
                              : `Validation impossible : ${PIECES.length - deposees.length} pièce(s) manquante(s)`
                          }
                          /* Un dossier incomplet ne peut pas être validé
                             depuis la ligne : le raccourci existait, et
                             cliquer « Valider » sur un dossier sans selfie
                             était à un pixel du bouton « Inspecter ». */
                          className={cn(
                            boutonBase,
                            'bg-button-primary text-on-button-primary hover:bg-button-primary-hover',
                          )}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          <span className="hidden sm:inline">Valider</span>
                        </button>
                      )}

                      {item.statutKyc !== 'REJETE' && item.statutKyc !== 'NON_VERIFIE' && (
                        <button
                          type="button"
                          onClick={() => onReject(item)}
                          aria-label={`Rejeter le dossier de ${nomComplet}`}
                          className={cn(
                            boutonBase,
                            'border border-error-500/25 bg-error-50 text-error-700 hover:bg-error-50/70',
                          )}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                          <span className="hidden sm:inline">Rejeter</span>
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