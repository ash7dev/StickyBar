'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Columns2,
  IdCard,
  ScanFace,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DocumentViewer } from './DocumentViewer';
import type { KycUserItem } from './AdminKycTable';

interface Props {
  user: KycUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (user: KycUserItem) => void;
  /** `motif` est optionnel : l'appelant existant continue de fonctionner. */
  onReject: (user: KycUserItem, motif?: string) => void;
}

/* ── Pièces du dossier ────────────────────────────────────────────────────── */

type PieceId = 'recto' | 'verso' | 'selfie';

const PIECES: { id: PieceId; label: string; court: string; champ: keyof KycUserItem }[] = [
  { id: 'recto', label: 'Pièce d’identité — recto', court: 'Recto', champ: 'kycDocumentUrl' },
  { id: 'verso', label: 'Pièce d’identité — verso', court: 'Verso', champ: 'kycVersoUrl' },
  { id: 'selfie', label: 'Selfie de vérification', court: 'Selfie', champ: 'kycSelfieUrl' },
];

/* ── Points de contrôle ───────────────────────────────────────────────────
   La checklist n'est pas décorative : elle conditionne l'approbation. Un
   dossier KYC approuvé d'un clic est un dossier non contrôlé, et c'est la
   plateforme qui en répond. Quatre points, ceux qui font rejeter un dossier
   en pratique.                                                              */

const CONTROLES = [
  { id: 'lisible', label: 'Pièce nette et entièrement lisible' },
  { id: 'validite', label: 'Pièce en cours de validité' },
  { id: 'identite', label: 'Nom et prénom identiques au profil' },
  { id: 'visage', label: 'Visage du selfie concordant avec la pièce' },
] as const;

/* ── Motifs de rejet ──────────────────────────────────────────────────────
   Des motifs normalisés produisent un message clair pour l'utilisateur et des
   statistiques exploitables. Le champ libre reste ouvert pour le reste.     */

const MOTIFS = [
  'Photo floue ou illisible',
  'Document expiré',
  'Pièce incomplète (coins coupés)',
  'Selfie non concordant',
  'Nom différent du profil',
  'Document suspecté de falsification',
];

export function AdminKycInspectionModal({ user, isOpen, onClose, onVerify, onReject }: Props) {
  const [pieceActive, setPieceActive] = useState<PieceId>('recto');
  const [comparaison, setComparaison] = useState(false);
  const [coches, setCoches] = useState<Set<string>>(new Set());
  const [enRejet, setEnRejet] = useState(false);
  const [motifs, setMotifs] = useState<Set<string>>(new Set());
  const [precision, setPrecision] = useState('');

  const panneau = useRef<HTMLDivElement>(null);

  // Réinitialisation à chaque dossier : garder les coches d'un utilisateur
  // pour le suivant est le pire défaut possible sur un écran de contrôle.
  useEffect(() => {
    setPieceActive('recto');
    setComparaison(false);
    setCoches(new Set());
    setEnRejet(false);
    setMotifs(new Set());
    setPrecision('');
  }, [user?.id]);

  // Échap ferme, la page ne défile plus derrière, le focus entre dans la modale.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (enRejet ? setEnRejet(false) : onClose());
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    panneau.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, enRejet]);

  const nomComplet = useMemo(
    () => `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Utilisateur',
    [user?.prenom, user?.nom],
  );

  if (!isOpen || !user) return null;

  const urlDe = (p: PieceId) =>
    (user[PIECES.find((x) => x.id === p)!.champ] as string | undefined) ?? undefined;

  const manquantes = PIECES.filter((p) => !urlDe(p.id));
  const toutControle = coches.size === CONTROLES.length;
  const peutRejeter = motifs.size > 0 || precision.trim().length > 0;

  const bascule = (set: Set<string>, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  function rejeter() {
    const motif = [...motifs, precision.trim()].filter(Boolean).join(' · ');
    onClose();
    onReject(user!, motif);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-label={`Dossier d’identité de ${nomComplet}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden border-border bg-background-card shadow-xl focus-visible:outline-none sm:h-[min(90vh,900px)] sm:rounded-card sm:border"
      >
        {/* ═══ EN-TÊTE ═══════════════════════════════════════════════════ */}
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner bg-forest-50 text-forest-700">
              <IdCard className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-semibold leading-tight text-foreground">
                {nomComplet}
              </h2>
              <p className="truncate text-xs text-foreground-muted">
                {user.email}
                {user.telephone ? ` · ${user.telephone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="badge-verified">En attente</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-pill text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        {/* ═══ CORPS ═════════════════════════════════════════════════════ */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* ── Visionneuse ──────────────────────────────────────────── */}
          <div className="flex min-h-0 flex-1 flex-col gap-3 bg-background-alt p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-pill bg-background-card p-1">
                {PIECES.map((p) => {
                  const actif = !comparaison && pieceActive === p.id;
                  const absente = !urlDe(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setComparaison(false);
                        setPieceActive(p.id);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors',
                        actif
                          ? 'bg-forest-600 text-neutral-0'
                          : 'text-foreground-muted hover:bg-background-alt hover:text-foreground',
                      )}
                    >
                      {p.court}
                      {absente && (
                        <span
                          aria-label="manquante"
                          className={cn(
                            'h-1.5 w-1.5 rounded-pill',
                            actif ? 'bg-neutral-0' : 'bg-error-500',
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Le geste central du contrôle KYC : la pièce et le visage
                  côte à côte. Le faire en basculant entre deux onglets oblige
                  à comparer de mémoire. */}
              <button
                type="button"
                onClick={() => setComparaison((v) => !v)}
                className={cn(
                  'flex items-center gap-2 rounded-pill border px-3 py-1.5 text-xs font-semibold transition-colors',
                  comparaison
                    ? 'border-forest-600 bg-forest-600 text-neutral-0'
                    : 'border-border bg-background-card text-foreground hover:border-border-hover',
                )}
              >
                <Columns2 className="h-3.5 w-3.5" aria-hidden />
                Comparer
              </button>
            </div>

            {comparaison ? (
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                <figure className="flex min-h-0 flex-col gap-2">
                  <DocumentViewer
                    src={urlDe('recto')}
                    alt="Pièce d’identité, recto"
                    className="min-h-0 flex-1"
                  />
                  <figcaption className="eyebrow text-center text-[0.6875rem]">Pièce</figcaption>
                </figure>
                <figure className="flex min-h-0 flex-col gap-2">
                  <DocumentViewer
                    src={urlDe('selfie')}
                    alt="Selfie de vérification"
                    className="min-h-0 flex-1"
                  />
                  <figcaption className="eyebrow text-center text-[0.6875rem]">Selfie</figcaption>
                </figure>
              </div>
            ) : (
              <DocumentViewer
                src={urlDe(pieceActive)}
                alt={PIECES.find((p) => p.id === pieceActive)!.label}
                className="min-h-0 flex-1"
              />
            )}

            <p className="text-center text-xs text-foreground-muted">
              Molette pour zoomer · double-clic pour ajuster · glisser pour déplacer
            </p>
          </div>

          {/* ── Panneau de contrôle ──────────────────────────────────── */}
          <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-border p-5 lg:w-[22rem] lg:border-l lg:border-t-0">
            {manquantes.length > 0 && (
              <p className="flex items-start gap-2 rounded-inner bg-warning-50 px-3.5 py-2.5 text-xs text-warning-700">
                <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {manquantes.length === 1 ? 'Pièce manquante' : 'Pièces manquantes'} :{' '}
                  {manquantes.map((p) => p.court.toLowerCase()).join(', ')}.
                </span>
              </p>
            )}

            {user.kycRejectionReason && (
              <div className="rounded-inner bg-error-50 px-3.5 py-3">
                <p className="eyebrow text-[0.6875rem] text-error-700">Rejet précédent</p>
                <p className="mt-1.5 text-xs leading-relaxed text-error-700">
                  {user.kycRejectionReason}
                </p>
              </div>
            )}

            <section>
              <h3 className="eyebrow text-[0.6875rem]">Points de contrôle</h3>
              <ul className="mt-3 space-y-1">
                {CONTROLES.map((c) => {
                  const coche = coches.has(c.id);
                  return (
                    <li key={c.id}>
                      <label
                        htmlFor={`ctrl-${c.id}`}
                        className="group flex cursor-pointer items-start gap-3 rounded-inner px-2 py-2 transition-colors hover:bg-background-alt"
                      >
                        <span className="relative mt-px flex shrink-0 items-center justify-center">
                          <input
                            id={`ctrl-${c.id}`}
                            type="checkbox"
                            checked={coche}
                            onChange={() => setCoches((s) => bascule(s, c.id))}
                            className="peer absolute h-5 w-5 cursor-pointer opacity-0"
                          />
                          <span
                            aria-hidden
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-[6px] border transition-colors',
                              'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring',
                              coche
                                ? 'border-forest-600 bg-forest-600'
                                : 'border-border-hover bg-background-card group-hover:border-forest-500',
                            )}
                          >
                            {coche && <Check className="h-3 w-3 text-neutral-0" aria-hidden />}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'text-xs leading-relaxed transition-colors',
                            coche ? 'text-foreground' : 'text-foreground-muted',
                          )}
                        >
                          {c.label}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 flex items-center gap-3 px-2">
                <span
                  aria-hidden
                  className="h-1 flex-1 overflow-hidden rounded-pill bg-background-alt"
                >
                  <span
                    className="block h-full rounded-pill bg-forest-600 transition-[width] duration-200"
                    style={{ width: `${(coches.size / CONTROLES.length) * 100}%` }}
                  />
                </span>
                <span className="text-xs tabular-nums text-foreground-muted">
                  {coches.size}/{CONTROLES.length}
                </span>
              </div>
            </section>

            <section className="mt-auto space-y-1 border-t border-border pt-4 text-xs">
              <p className="flex items-center gap-2 text-foreground-muted">
                <ScanFace className="h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
                L’approbation donne accès à la réservation et au paiement.
              </p>
            </section>
          </aside>
        </div>

        {/* ═══ PIED — décision ═══════════════════════════════════════════ */}
        <footer className="shrink-0 border-t border-border bg-background-card px-5 py-4">
          {enRejet ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Motif du rejet</h3>
                <button
                  type="button"
                  onClick={() => setEnRejet(false)}
                  className="text-xs font-semibold text-foreground-muted transition-colors hover:text-foreground"
                >
                  Annuler
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {MOTIFS.map((m) => {
                  const actif = motifs.has(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={actif}
                      onClick={() => setMotifs((s) => bascule(s, m))}
                      className={cn(
                        'rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors',
                        actif
                          ? 'border-error-500 bg-error-50 text-error-700'
                          : 'border-border bg-background-card text-foreground-muted hover:border-border-hover hover:text-foreground',
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={precision}
                onChange={(e) => setPrecision(e.target.value)}
                rows={2}
                maxLength={280}
                placeholder="Précision transmise à l’utilisateur (facultatif)"
                className="w-full resize-none rounded-field border border-border bg-background-alt px-3.5 py-2.5 text-foreground placeholder:text-neutral-500 focus:border-forest-600 focus:outline-none"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={rejeter}
                  disabled={!peutRejeter}
                  className="rounded-pill bg-error-600 px-5 py-2.5 text-sm font-semibold text-neutral-0 transition-colors hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-foreground-muted">
                {toutControle
                  ? 'Tous les points sont contrôlés.'
                  : `Encore ${CONTROLES.length - coches.size} ${CONTROLES.length - coches.size > 1 ? 'points' : 'point'
                  } à contrôler avant d’approuver.`}
              </p>

              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => setEnRejet(true)} className="btn-ghost py-2.5">
                  Rejeter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onVerify(user);
                  }}
                  disabled={!toutControle}
                  className="btn-primary py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Approuver
                </button>
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}