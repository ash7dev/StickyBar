'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Scale, X, XCircle } from 'lucide-react';
import type { DisputeItem } from './AdminDisputesTable';
import { cn } from '@/lib/utils/cn';

interface Props {
  dispute: DisputeItem | null;
  isOpen: boolean;
  onClose: () => void;
  /**
   * `montantCompensation` est le quatrième paramètre, optionnel : les appelants
   * existants compilent sans changement.
   *
   * ⚠️ Il manquait entièrement. Les modèles de décision écrivaient
   * « Remboursement intégral » ou « Remboursement 100% » en prose, mais aucun
   * montant ne partait vers le backend — alors que `DisputeItem` porte déjà
   * `montantCompensation`. L'arbitrage produisait un texte, pas une écriture.
   */
  onConfirmResolve: (
    dispute: DisputeItem,
    statut: 'FONDE' | 'NON_FONDE',
    decisionAdmin: string,
    montantCompensation?: number,
  ) => void;
}

const MOTIFS: Record<string, string> = {
  LOGEMENT_NON_CONFORME: 'Logement non conforme',
  LOGEMENT_INACCESSIBLE: 'Logement inaccessible',
  DEPASSEMENT_PERSONNES: 'Dépassement de personnes',
  DOMMAGES: 'Dommages',
  NON_PAIEMENT: 'Non-paiement de suppléments',
  AUTRE: 'Autre',
};

/* Les modèles préfixaient chaque texte par « Litige FONDÉ : ». Redondant avec
   le verdict, et surtout contradictoire dès que l'agent changeait d'avis après
   avoir inséré le texte. Le préfixe saute ; les libellés courts remplacent les
   pavés tronqués, illisibles dans une liste. */
const MODELES: Record<'FONDE' | 'NON_FONDE', { titre: string; texte: string }[]> = {
  FONDE: [
    {
      titre: 'Non-conformité avérée',
      texte:
        'Le logement ne correspond pas à la description publiée. La non-conformité est établie par les pièces au dossier.',
    },
    {
      titre: 'Hôte absent au check-in',
      texte:
        'L’hôte n’était pas présent au moment de la remise des clés et n’a pas prévenu. Le séjour n’a pas pu commencer.',
    },
    {
      titre: 'Équipement essentiel absent',
      texte:
        'Un équipement essentiel au séjour (eau, électricité) était indisponible, rendant le logement inhabitable.',
    },
    {
      titre: 'Dépassement de capacité',
      texte:
        'Le nombre d’occupants a dépassé la capacité contractuelle du logement sans accord préalable.',
    },
  ],
  NON_FONDE: [
    {
      titre: 'Preuves insuffisantes',
      texte:
        'Les éléments fournis ne démontrent pas de manquement aux conditions de la réservation.',
    },
    {
      titre: 'Hors délai',
      texte:
        'La réclamation a été déposée en dehors de la fenêtre prévue par les conditions de location.',
    },
    {
      titre: 'Conditions respectées',
      texte: 'Les termes du contrat de réservation ont été respectés par les deux parties.',
    },
  ],
};

const MOTIVATION_MIN = 40;

const fmtMontant = (n?: number | null) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(n)))} FCFA`;

const versNombre = (v: string) => {
  const n = Number.parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

export function AdminDisputeResolveModal({ dispute, isOpen, onClose, onConfirmResolve }: Props) {
  const [verdict, setVerdict] = useState<'FONDE' | 'NON_FONDE'>('FONDE');
  const [motivation, setMotivation] = useState('');
  const [montant, setMontant] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  const panneau = useRef<HTMLDivElement>(null);

  // Un dossier suivant ne doit rien hériter du précédent.
  useEffect(() => {
    setVerdict('FONDE');
    setMotivation('');
    setMontant(dispute?.coutEstime != null ? String(Math.round(dispute.coutEstime)) : '');
    setConfirmation(false);
  }, [dispute?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmation) setConfirmation(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    panneau.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, confirmation]);

  const reclame = dispute?.coutEstime ?? null;
  const compensation = verdict === 'FONDE' ? versNombre(montant) : 0;

  const erreurs = useMemo(() => {
    const texte = motivation.trim();
    return {
      motivation:
        texte.length === 0
          ? 'La motivation est transmise aux deux parties : elle ne peut pas être vide.'
          : texte.length < MOTIVATION_MIN
            ? `Encore ${MOTIVATION_MIN - texte.length} caractères pour une motivation exploitable.`
            : null,
      montant:
        verdict === 'FONDE' && reclame != null && compensation > reclame
          ? `La compensation dépasse le montant réclamé (${fmtMontant(reclame)}).`
          : null,
    };
  }, [motivation, verdict, compensation, reclame]);

  const valide = !erreurs.motivation && !erreurs.montant;

  if (!isOpen || !dispute) return null;

  const parLocataire = dispute.declarePar === 'LOCATAIRE';
  const beneficiaire = parLocataire ? 'le locataire' : 'l’hôte';
  const sanctionne = parLocataire ? 'l’hôte' : 'le locataire';

  /* Insertion à la suite, et le texte survit au changement de verdict.
     `setDecisionText('')` effaçait la rédaction en cours dès qu'on basculait
     d'un verdict à l'autre — le geste le plus naturel pendant qu'on hésite. */
  const insererModele = (texte: string) =>
    setMotivation((actuel) => (actuel.trim() ? `${actuel.trimEnd()}\n\n${texte}` : texte));

  function valider() {
    if (!valide) return;
    onConfirmResolve(
      dispute!,
      verdict,
      motivation.trim(),
      verdict === 'FONDE' ? compensation : 0,
    );
    onClose();
  }

  const champ =
    'w-full rounded-field border border-border bg-background-alt px-3.5 py-2.5 text-foreground placeholder:text-neutral-500 transition-colors focus:border-forest-600 focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-overlay p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirmation) onClose();
      }}
    >
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-label="Arbitrage du litige"
        tabIndex={-1}
        className="no-scrollbar max-h-[90vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-card border border-border bg-background-card p-6 shadow-xl focus-visible:outline-none"
      >
        {/* ── En-tête ────────────────────────────────────────────────────── */}
        <header className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner bg-forest-50 text-forest-700">
              <Scale className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-foreground">
                {confirmation ? 'Confirmer la décision' : 'Arbitrer le litige'}
              </h2>
              {/* La modale ne rappelait ni le motif, ni les faits, ni la somme :
                  il fallait avoir mémorisé le dossier de l'écran précédent. */}
              <p className="mt-0.5 text-xs text-foreground-muted">
                {MOTIFS[dispute.motif] ?? dispute.motif} · déclaré par{' '}
                {parLocataire ? 'le locataire' : 'l’hôte'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {confirmation ? (
          /* ── Écran de confirmation ────────────────────────────────────
             Un remboursement et une faute au dossier partaient d'un seul clic,
             sans récapitulatif. Cet écran ne demande pas « êtes-vous sûr » : il
             affiche ce qui va se produire. */
          <div className="space-y-4">
            <div className="space-y-3 rounded-inner bg-background-alt p-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground-muted">Verdict</dt>
                  <dd className="font-semibold text-foreground">
                    {verdict === 'FONDE' ? 'Litige fondé' : 'Litige non fondé'}
                  </dd>
                </div>
                {verdict === 'FONDE' && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-foreground-muted">Compensation</dt>
                    <dd className="font-display font-semibold tabular-nums text-foreground">
                      {fmtMontant(compensation)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-foreground-muted">Bénéficiaire</dt>
                  <dd className="font-semibold text-foreground">
                    {verdict === 'FONDE' ? beneficiaire : 'Aucun'}
                  </dd>
                </div>
              </dl>

              <p className="border-t border-border pt-3 text-xs leading-relaxed text-foreground-muted">
                {verdict === 'FONDE' ? (
                  <>
                    {compensation > 0
                      ? `${fmtMontant(compensation)} seront versés à ${beneficiaire}. `
                      : 'Aucun montant ne sera versé. '}
                    Une faute sera inscrite au dossier de {sanctionne}.
                  </>
                ) : (
                  'Le litige est rejeté, la réservation reprend son cours et aucune sanction n’est appliquée.'
                )}{' '}
                La motivation ci-dessous est envoyée aux deux parties.
              </p>

              <p className="whitespace-pre-line rounded-inner bg-background-card px-3.5 py-2.5 text-xs leading-relaxed text-foreground">
                {motivation.trim()}
              </p>
            </div>

            <p className="flex items-start gap-2 rounded-inner bg-warning-50 px-3.5 py-2.5 text-xs text-warning-700">
              <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />
              Cette décision est définitive et notifiée immédiatement.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setConfirmation(false)}
                className="btn-ghost h-9 px-4 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Modifier
              </button>
              <button
                type="button"
                onClick={valider}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-pill px-5 text-xs font-semibold transition-colors',
                  verdict === 'FONDE'
                    ? 'bg-error-600 text-neutral-0 hover:bg-error-700'
                    : 'btn-primary h-9 px-5 text-xs',
                )}
              >
                Rendre la décision
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ── Rappel du dossier ──────────────────────────────────────── */}
            <section className="space-y-2 rounded-inner bg-background-alt p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="eyebrow text-[0.6875rem]">Montant réclamé</span>
                <span className="font-display text-base font-semibold tabular-nums text-foreground">
                  {fmtMontant(reclame)}
                </span>
              </div>
              {dispute.description && (
                <p className="border-t border-border pt-2 text-xs leading-relaxed text-foreground-muted">
                  {dispute.description}
                </p>
              )}
            </section>

            {/* ── Verdict ───────────────────────────────────────────────────
                FONDÉ était en vert avec une coche : la couleur de la réussite
                pour l'issue qui déclenche un remboursement et une faute. Le
                vert allait à NON FONDÉ, la seule issue sans conséquence. */}
            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-semibold text-foreground">Verdict</legend>
              <div className="grid grid-cols-2 gap-3">
                {([
                  {
                    id: 'FONDE' as const,
                    Icon: Scale,
                    titre: 'Fondé',
                    note: `Compensation pour ${beneficiaire}, faute pour ${sanctionne}`,
                    actif: 'border-error-500 bg-error-50 text-error-700',
                  },
                  {
                    id: 'NON_FONDE' as const,
                    Icon: XCircle,
                    titre: 'Non fondé',
                    note: 'Rejet, aucune sanction',
                    actif: 'border-forest-600 bg-forest-50 text-forest-700',
                  },
                ]).map(({ id, Icon, titre, note, actif }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={verdict === id}
                    onClick={() => setVerdict(id)}
                    className={cn(
                      'flex items-start gap-2 rounded-inner border p-3 text-left transition-colors',
                      verdict === id
                        ? actif
                        : 'border-border bg-background-card text-foreground hover:border-border-hover',
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      <span className="block text-xs font-semibold">{titre}</span>
                      <span className="mt-0.5 block text-xs text-foreground-muted">{note}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* ── Notice périmètre Klef & règles spécifiques ───────────── */}
            {verdict === 'FONDE' && (
              <div className="space-y-2">
                {['LOGEMENT_NON_CONFORME', 'LOGEMENT_INACCESSIBLE', 'ANNULATION_ABUSIVE_HOTE'].includes(dispute.motif) && (
                  <div className="rounded-inner bg-forest-50 p-3.5 border border-forest-200 text-xs text-forest-900 space-y-1">
                    <p className="font-semibold text-forest-900">🏠 Non-conformité / Inaccessibilité retenue</p>
                    <p className="leading-relaxed text-forest-800">
                      Remboursement **100% intégral** appliqué d'office au voyageur. La réservation repasse en statut annulé (`CANCELLED`) et l'hôte ne perçoit aucun versement.
                    </p>
                  </div>
                )}

                {['DEPASSEMENT_PERSONNES', 'DEGRADATION', 'DOMMAGES'].includes(dispute.motif) && (
                  <div className="rounded-inner bg-warning-50 p-3.5 border border-warning-200 text-xs text-warning-900 space-y-1">
                    <p className="font-semibold text-warning-900">⚖️ Périmètre Klef & Dédommagement</p>
                    <p className="leading-relaxed text-warning-800">
                      Le dédommagement est prélevé en priorité sur les fonds retenus en séquestre. Si les fonds sont insuffisants ou en cas de refus du voyageur, une dette sera inscrite sur son profil Klef bloquant ses futures réservations. Klef décline toute responsabilité pour la médiation physique ou le règlement liquide hors plateforme.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Compensation ────────────────────────────────────────────── */}
            {verdict === 'FONDE' && (
              <div className="space-y-2">
                <label htmlFor="compensation" className="block text-xs font-semibold text-foreground">
                  Compensation versée à {beneficiaire}
                </label>

                <div className="flex items-center gap-2">
                  {/* `type="number"` capte la molette et modifie la valeur au
                      scroll : sur un montant d'indemnisation, c'est exclu. */}
                  <input
                    id="compensation"
                    type="text"
                    inputMode="numeric"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value.replace(/\D/g, ''))}
                    aria-invalid={!!erreurs.montant}
                    placeholder="0"
                    className={cn(champ, 'tabular-nums')}
                  />
                  <span className="shrink-0 text-xs text-foreground-muted">FCFA</span>
                </div>

                {reclame != null && reclame > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Intégral', valeur: Math.round(reclame) },
                      { label: 'Moitié', valeur: Math.round(reclame / 2) },
                      { label: 'Aucune', valeur: 0 },
                    ].map(({ label, valeur }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setMontant(String(valeur))}
                        className={cn(
                          'rounded-pill border px-3 py-1 text-xs font-medium transition-colors',
                          versNombre(montant) === valeur
                            ? 'border-forest-600 bg-forest-50 text-forest-700'
                            : 'border-border bg-background-card text-foreground-muted hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {erreurs.montant && (
                  <p role="alert" className="text-xs text-error-700">{erreurs.montant}</p>
                )}
              </div>
            )}

            {/* ── Modèles ─────────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground">Formulations types</p>
              <div className="flex flex-wrap gap-1.5">
                {MODELES[verdict].map((m) => (
                  <button
                    key={m.titre}
                    type="button"
                    onClick={() => insererModele(m.texte)}
                    title={m.texte}
                    className="rounded-pill border border-border bg-background-card px-3 py-1 text-xs font-medium text-foreground-muted transition-colors hover:border-forest-500 hover:text-foreground"
                  >
                    {m.titre}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Motivation ──────────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label htmlFor="motivation" className="block text-xs font-semibold text-foreground">
                Motivation transmise aux deux parties
              </label>
              {/* Pas de `text-xs` : la couche base force 16 px, un utilitaire de
                  taille ici ferait zoomer Safari iOS au focus. */}
              <textarea
                id="motivation"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                rows={4}
                maxLength={1500}
                aria-invalid={!!erreurs.motivation}
                placeholder="Exposez les faits retenus et le fondement de la décision…"
                className={cn(champ, 'resize-none leading-relaxed')}
              />
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className={erreurs.motivation ? 'text-warning-700' : 'text-foreground-muted'}>
                  {erreurs.motivation ?? 'Cette motivation sera archivée avec le dossier.'}
                </span>
                <span className="shrink-0 tabular-nums text-foreground-muted">
                  {motivation.trim().length}/1500
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button type="button" onClick={onClose} className="btn-ghost h-9 px-4 text-xs">
                Annuler
              </button>
              <button
                type="button"
                disabled={!valide}
                onClick={() => setConfirmation(true)}
                className="btn-primary h-9 px-5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                Vérifier la décision
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}