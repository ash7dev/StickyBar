'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogOut, Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { translateApiError } from '@/lib/errors/translate';

const CONFIRMATION = 'SUPPRIMER';

interface Props {
  /** Empêche la suppression tant qu'un séjour ou des fonds sont engagés. */
  hasActiveReservations?: boolean;
  soldeSequestre?: number;
}

export function OwnerActionsCard({
  hasActiveReservations = false,
  soldeSequestre = 0,
}: Props) {
  const router = useRouter();
  const clearSession = useRoleStore((s) => s.clearSession);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const titleId = useId();
  const confirmId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const isBlocked = hasActiveReservations || soldeSequestre > 0;
  const canDelete = !isBlocked && confirmText.trim().toUpperCase() === CONFIRMATION;

  /* La modale n'avait ni rôle, ni Échap, ni piège à focus, ni verrou de
     scroll — sur une boîte de dialogue destructive. */
  useEffect(() => {
    if (!showDeleteModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) { setShowDeleteModal(false); return; }
      if (e.key !== 'Tab') return;
      const items = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])',
      );
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [showDeleteModal, isDeleting]);

  const closeModal = useCallback(() => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setConfirmText('');
    setDeleteError(null);
  }, [isDeleting]);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* `clearSession()` s'exécutait AVANT `signOut()` : un échec réseau
         laissait l'utilisateur sur le dashboard, session locale déjà vidée,
         sans rien qui fonctionne ni rien qui l'explique. */
    } finally {
      clearSession();
      router.push('/');
      router.refresh();
    }
  }, [supabase, clearSession, router]);

  const handleDeleteAccount = useCallback(async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await nestFetch(NEST_API.USERS.DELETE_ME, { method: 'DELETE' });
      clearSession();
      await supabase.auth.signOut().catch(() => { });
      router.push('/');
      router.refresh();
    } catch (err) {
      /* `catch {}` avalait le message serveur : un refus légitime du type
         « suppression impossible, un séjour est en cours » devenait un
         message générique, sans indiquer quoi faire. */
      const translated = translateApiError(err);
      setDeleteError(translated.message);
      setIsDeleting(false);
    }
  }, [canDelete, clearSession, supabase, router]);

  return (
    <section className="card space-y-6 p-6 sm:p-8">

      <header className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Sécurité du compte
          </h2>
          <p className="text-xs text-foreground-muted">
            Déconnexion et suppression définitive
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-pill border border-border bg-background-card px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt"
        >
          <LogOut className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
          Se déconnecter
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-pill border border-error-500/25 bg-background-card px-5 py-3.5 text-sm font-semibold text-error-700 transition-colors hover:bg-error-50"
        >
          <Trash2 className="h-4 w-4 text-error-600" aria-hidden="true" />
          Supprimer mon compte
        </button>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-forest-950/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
            className="w-full space-y-5 rounded-t-card border border-border bg-background-card p-6 shadow-xl sm:max-w-md sm:rounded-card"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-inner border border-error-500/25 bg-error-50 text-error-600">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                aria-label="Fermer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h2 id={titleId} className="font-display text-xl font-semibold text-foreground">
                Supprimer votre compte hôte
              </h2>
              <p className="text-sm leading-relaxed text-foreground-muted">
                Cette action est <strong className="font-semibold text-error-700">définitive</strong>.
                Vos annonces, réservations passées, historique de revenus et données personnelles
                seront effacés.
              </p>
            </div>

            {/* Un compte hôte peut détenir des fonds en séquestre et des
                séjours engagés : la suppression doit être bloquée, pas
                seulement déconseillée. */}
            {isBlocked ? (
              <div className="space-y-2 rounded-inner border border-warning-500/25 bg-warning-50 p-3.5">
                <p className="text-xs font-semibold text-warning-700">
                  Suppression impossible pour le moment
                </p>
                <ul className="space-y-1 text-xs leading-relaxed text-warning-700">
                  {hasActiveReservations && (
                    <li className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-pill bg-warning-600" />
                      Des réservations sont en cours. Attendez leur clôture ou annulez-les.
                    </li>
                  )}
                  {soldeSequestre > 0 && (
                    <li className="flex items-start gap-2">
                      <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-pill bg-warning-600" />
                      <span>
                        <span className="font-semibold tabular-nums">
                          {soldeSequestre.toLocaleString('fr-FR')} FCFA
                        </span>{' '}
                        sont encore en séquestre. Retirez ces fonds avant de continuer.
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              /* Un simple clic suffisait à effacer le compte — et le bouton
                 rouge était le premier des deux, donc le plus accessible au
                 pouce sur mobile. */
              <div className="space-y-2">
                <label htmlFor={confirmId} className="block text-xs font-semibold text-foreground">
                  Pour confirmer, saisissez{' '}
                  <span className="font-semibold text-error-700">{CONFIRMATION}</span>
                </label>
                <input
                  id={confirmId}
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isDeleting}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={CONFIRMATION}
                  className="w-full rounded-field border border-border bg-background px-4 py-3 text-foreground placeholder:text-foreground-faint focus:border-error-600 focus:outline-none disabled:opacity-50"
                />
              </div>
            )}

            {deleteError && (
              <p role="alert" className="rounded-inner border border-error-500/20 bg-error-50 p-3 text-xs leading-relaxed text-error-700">
                {deleteError}
              </p>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canDelete || isDeleting}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-2 rounded-pill py-3.5 text-sm font-semibold transition-colors',
                  canDelete && !isDeleting
                    ? 'bg-error-600 text-neutral-0 hover:bg-error-700'
                    : 'cursor-not-allowed bg-background-alt text-foreground-faint',
                )}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Suppression…
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Supprimer définitivement
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                className="w-full rounded-pill py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                Conserver mon compte
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}