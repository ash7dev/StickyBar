'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { X, AlertTriangle, Loader2, Info } from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';

const MOTIF_MIN = 15;

/* ─── Politique de remboursement ──────────────────────────────────────────
   Les paliers sont décrits une seule fois, avec des classes Tailwind
   ÉCRITES EN ENTIER.

   ⚠️ La version précédente construisait ses classes à l'exécution
   (`text-${color}-400`, `bg-${color}-500/10`). Tailwind analyse les sources
   statiquement : ces chaînes n'existent nulle part dans le code, donc aucune
   de ces classes n'était générée. En production, tout le bloc annonçant le
   remboursement s'affichait sans fond, sans bordure et sans couleur — sur
   l'écran le plus sensible du produit. Ne jamais interpoler un nom de classe.
                                                                            */

type TierId = 'full' | 'half' | 'quarter' | 'none';

interface Tier {
  id: TierId;
  percentage: number;
  short: string;
  window: string;
  label: string;
  description: string;
  /** Classes complètes — jamais interpolées. */
  tone: { chip: string; text: string; ring: string; dot: string };
}

const TIERS: Tier[] = [
  {
    id: 'full',
    percentage: 100,
    short: '100 %',
    window: 'Plus de 7 jours',
    label: 'Remboursement intégral',
    description: 'Vous annulez plus de 7 jours avant l’arrivée.',
    tone: {
      chip: 'bg-success-50 border-success-500/25',
      text: 'text-success-700',
      ring: 'ring-success-500/30',
      dot: 'bg-success-600',
    },
  },
  {
    id: 'half',
    percentage: 50,
    short: '50 %',
    window: '3 à 7 jours',
    label: 'Remboursement partiel',
    description: 'Vous annulez entre 3 et 7 jours avant l’arrivée.',
    tone: {
      chip: 'bg-warning-50 border-warning-500/25',
      text: 'text-warning-700',
      ring: 'ring-warning-500/30',
      dot: 'bg-warning-600',
    },
  },
  {
    id: 'quarter',
    percentage: 25,
    short: '25 %',
    window: '24 h à 3 jours',
    label: 'Remboursement minimal',
    description: 'Vous annulez entre 24 heures et 3 jours avant l’arrivée.',
    tone: {
      chip: 'bg-error-50 border-error-500/25',
      text: 'text-error-600',
      ring: 'ring-error-500/25',
      dot: 'bg-error-500',
    },
  },
  {
    id: 'none',
    percentage: 0,
    short: '0 %',
    window: 'Moins de 24 h',
    label: 'Aucun remboursement',
    description: 'Vous annulez moins de 24 heures avant l’arrivée.',
    tone: {
      chip: 'bg-error-50 border-error-500/25',
      text: 'text-error-700',
      ring: 'ring-error-500/35',
      dot: 'bg-error-600',
    },
  },
];

function resolveTier(hoursToCheckin: number): Tier {
  const days = hoursToCheckin / 24;
  if (days > 7) return TIERS[0];
  if (days >= 3) return TIERS[1];
  if (hoursToCheckin >= 24) return TIERS[2];
  return TIERS[3];
}

interface Props {
  reservationId: string;
  /** ISO. Idéalement l'horodatage complet du check-in, pas seulement la date. */
  dateDebut: string;
  /** Montant déjà débité, en FCFA. Permet d'afficher un montant, pas un taux. */
  montantPaye?: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function CancelReservationModal({
  reservationId,
  dateDebut,
  montantPaye,
  onSuccess,
  onClose,
}: Props) {
  const [raison, setRaison] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const titleId = useId();
  const motifId = useId();
  const motifHelpId = useId();
  const errorId = useId();

  const trimmedLength = raison.trim().length;
  const isValid = trimmedLength >= MOTIF_MIN;

  /* ── Palier applicable ──────────────────────────────────────────────────
     Calculé à partir de l'horloge du poste client. C'est une ESTIMATION :
     seule la date serveur fait foi au moment de l'annulation, et l'écart
     compte près des seuils de 24 h / 3 j / 7 j. Le texte le dit maintenant.

     Note : si `dateDebut` arrive au format 'YYYY-MM-DD', il est interprété à
     minuit UTC. Le check-in réel étant plus tard dans la journée, l'écart
     peut faire basculer un utilisateur d'un palier à l'autre. Envoyer un
     horodatage complet depuis l'API.                                       */

  const { tier, hasStarted } = useMemo(() => {
    const checkin = new Date(dateDebut).getTime();
    if (Number.isNaN(checkin)) return { tier: TIERS[3], hasStarted: false };
    const hours = (checkin - Date.now()) / 3_600_000;
    return { tier: resolveTier(hours), hasStarted: hours <= 0 };
  }, [dateDebut]);

  const montantRembourse =
    montantPaye != null ? Math.round((montantPaye * tier.percentage) / 100) : null;

  /* ── Fermeture ───────────────────────────────────────────────────────── */

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  /** Le clic sur le fond ne ferme pas si un motif est en cours de saisie :
      perdre un texte rédigé sur un geste involontaire est inacceptable. */
  const handleBackdrop = useCallback(() => {
    if (raison.trim().length > 0) return;
    handleClose();
  }, [raison, handleClose]);

  /* ── Verrou de scroll, focus, Échap ──────────────────────────────────── */

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSubmitting) onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [isSubmitting, onClose]);

  /* ── Soumission ──────────────────────────────────────────────────────── */

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      setErrorMsg(`Le motif doit contenir au moins ${MOTIF_MIN} caractères.`);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await nestFetch(NEST_API.RESERVATIONS.CANCEL(reservationId), {
        method: 'PATCH',
        body: JSON.stringify({ raison: raison.trim() }),
      });
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMsg(
        error instanceof Error && error.message
          ? error.message
          : 'L’annulation n’a pas pu être enregistrée. Réessayez dans un instant.',
      );
      setIsSubmitting(false);
    }
  }, [isValid, raison, reservationId, onSuccess, onClose]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-forest-950/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={handleBackdrop}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-card border border-border bg-background-card shadow-xl sm:max-w-lg sm:rounded-card"
      >
        {/* ── En-tête ──────────────────────────────────────────────────── */}

        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-error-500/20 bg-error-50">
              <AlertTriangle className="h-4 w-4 text-error-600" aria-hidden="true" />
            </span>
            <h2 id={titleId} className="font-display text-base font-semibold text-foreground">
              Annuler la réservation
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt hover:text-foreground disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* ── Corps ────────────────────────────────────────────────────── */}

        <div className="flex-1 space-y-5 overflow-y-auto p-6">

          {hasStarted && (
            <div
              role="status"
              className="rounded-inner border border-warning-500/25 bg-warning-50 p-3.5 text-xs leading-relaxed text-warning-700"
            >
              La date d’arrivée est dépassée. Contactez le support avant d’annuler : les
              conditions applicables peuvent différer de celles indiquées ci-dessous.
            </div>
          )}

          {/* ── Résultat : la seule information que l'utilisateur cherche ──
              Un pourcentage seul ne dit rien. Quand le montant payé est
              connu, on affiche des FCFA.                                   */}

          <section className={cn('rounded-card border p-5', tier.tone.chip)}>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Si vous annulez maintenant
            </p>

            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className={cn(
                  'font-display text-3xl font-semibold tabular-nums',
                  tier.tone.text,
                )}
              >
                {montantRembourse != null
                  ? `${montantRembourse.toLocaleString('fr-FR')} FCFA`
                  : tier.short}
              </span>
              {montantRembourse != null && (
                <span className="text-sm font-semibold text-foreground-muted tabular-nums">
                  soit {tier.short}
                </span>
              )}
            </p>

            <p className={cn('mt-1 text-sm font-semibold', tier.tone.text)}>{tier.label}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground-muted">
              {tier.description} Estimation indicative : le montant définitif est arrêté par
              Klef à la réception de votre demande.
            </p>
          </section>

          {/* ── Barème complet ───────────────────────────────────────────── */}

          <section>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Barème d’annulation
            </h3>
            <ul className="divide-y divide-border overflow-hidden rounded-inner border border-border">
              {TIERS.map((t) => {
                const current = t.id === tier.id;
                return (
                  <li
                    key={t.id}
                    aria-current={current ? 'true' : undefined}
                    className={cn(
                      'flex items-center justify-between gap-3 px-4 py-3 transition-colors',
                      current ? 'bg-background-alt' : 'bg-background-card',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'h-2 w-2 shrink-0 rounded-pill',
                          current ? t.tone.dot : 'bg-border-hover',
                        )}
                      />
                      <span
                        className={cn(
                          'truncate text-xs',
                          current ? 'font-semibold text-foreground' : 'text-foreground-muted',
                        )}
                      >
                        {t.window} avant l’arrivée
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-xs font-semibold tabular-nums',
                        current ? t.tone.text : 'text-foreground-muted',
                      )}
                    >
                      {t.short}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ── Motif ────────────────────────────────────────────────────── */}

          <section>
            <label
              htmlFor={motifId}
              className="block text-xs font-semibold uppercase tracking-wider text-foreground"
            >
              Motif d’annulation <span className="text-error-600">*</span>
            </label>
            <p id={motifHelpId} className="mt-1.5 mb-2.5 text-xs leading-relaxed text-foreground-muted">
              Ce motif est transmis à l’hôte et conservé avec la réservation.
            </p>

            <textarea
              id={motifId}
              rows={4}
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              disabled={isSubmitting}
              aria-describedby={errorMsg ? `${motifHelpId} ${errorId}` : motifHelpId}
              aria-invalid={errorMsg ? true : undefined}
              placeholder="Ex : un imprévu professionnel m’empêche de voyager à ces dates."
              className="w-full resize-none rounded-field border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-forest-500 focus:outline-none disabled:opacity-50"
            />

            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="text-xs text-foreground-muted">
                Minimum {MOTIF_MIN} caractères
              </p>
              {/* Le compteur suit désormais la même règle que la validation :
                  il comptait la chaîne brute et passait au vert sur des
                  espaces, avant de refuser l'envoi. */}
              <p
                aria-live="polite"
                className={cn(
                  'text-xs tabular-nums',
                  isValid ? 'font-semibold text-success-700' : 'text-foreground-muted',
                )}
              >
                {trimmedLength} / {MOTIF_MIN}
              </p>
            </div>
          </section>

          {errorMsg && (
            <div
              id={errorId}
              role="alert"
              className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3.5"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-error-700">{errorMsg}</p>
            </div>
          )}

          <div className="flex items-start gap-2.5 rounded-inner border border-border bg-background-alt p-3.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-foreground-muted">
              <span className="font-semibold text-foreground">Délai de remboursement :</span>{' '}
              3 à 5 jours ouvrés après validation. Une confirmation vous est envoyée par
              e-mail.
            </p>
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────
            Aucun lime ici : le lime signale la conversion. Une annulation
            n'en est pas une, et l'action destructrice porte la couleur
            d'erreur.                                                       */}

        <footer className="flex shrink-0 gap-3 border-t border-border bg-background-alt px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 rounded-pill border border-border bg-background-card py-3 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt disabled:opacity-40"
          >
            Conserver ma réservation
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-error-600 py-3 text-sm font-semibold text-neutral-0 transition-colors hover:bg-error-700 disabled:cursor-not-allowed disabled:bg-background-card disabled:text-foreground-faint"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Annulation…
              </>
            ) : (
              'Confirmer l’annulation'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}