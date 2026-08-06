'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone, CheckCircle2, XCircle, ArrowLeftRight, LogOut, Lock,
  Trash2, AlertTriangle, Loader2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { UserProfile } from '../types';

const CONFIRMATION = 'SUPPRIMER';

interface Props {
  user: UserProfile;
}

export function ProfileActionsCard({ user }: Props) {
  const router = useRouter();
  const clearSession = useRoleStore((s) => s.clearSession);
  const { switchRole, isSwitching } = useSwitchRole();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const confirmId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const canDelete = confirmText.trim().toUpperCase() === CONFIRMATION;
  const roleCible = user.activeRole === 'PROPRIETAIRE' ? 'LOCATAIRE' : 'PROPRIETAIRE';

  /* ── Modale : Échap, piège à focus, verrou de scroll ──────────────────── */

  useEffect(() => {
    if (!showDeleteModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();

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

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setConfirmText('');
    setDeleteError(null);
  }, [isDeleting]);

  /* ── Déconnexion ─────────────────────────────────────────────────────── */

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* L'ordre d'origine vidait la session locale AVANT signOut : un échec
         réseau laissait l'utilisateur sur le dashboard, session effacée. */
    } finally {
      clearSession();
      router.push('/');
      router.refresh();
    }
  }, [supabase, clearSession, router]);

  /* ── Suppression ─────────────────────────────────────────────────────── */

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
    } catch (e) {
      /* `catch {}` avalait le message serveur : un refus « suppression
         impossible, une réservation est en cours » devenait « une erreur est
         survenue », sans indiquer quoi faire. */
      setDeleteError(
        e instanceof Error && e.message
          ? e.message
          : 'La suppression n’a pas pu aboutir. Réessayez dans un instant.',
      );
      setIsDeleting(false);
    }
  }, [canDelete, clearSession, supabase, router]);

  return (
    <section className="space-y-4 rounded-card border border-border bg-background-card p-5 shadow-sm">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}

      <header className="flex items-center gap-3 border-b border-border pb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-foreground">
            Sécurité et accès
          </h2>
          <p className="text-xs text-foreground-muted">Compte et connexion</p>
        </div>
      </header>

      {/* ── Réglages ─────────────────────────────────────────────────────── */}

      <div className="grid gap-3 sm:grid-cols-2">

        <div className="flex items-center justify-between gap-3 rounded-inner border border-border bg-background-alt p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
              <Phone className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Téléphone</p>
              <p className="mt-0.5 truncate text-xs text-foreground-muted">
                {user.telephone ?? 'Non renseigné'}
              </p>
            </div>
          </div>

          {user.phoneVerified ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-xs font-semibold text-gold-700">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Vérifié
            </span>
          ) : (
            <Link
              href="/dashboard/profil/verifier-telephone"
              className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-warning-500/25 bg-warning-50 px-2.5 py-0.5 text-xs font-semibold text-warning-700 transition-colors hover:bg-warning-50/70"
            >
              <XCircle className="h-3 w-3" aria-hidden="true" />
              Vérifier
            </Link>
          )}
        </div>

        {user.estProprietaire && (
          <div className="flex items-center justify-between gap-3 rounded-inner border border-border bg-background-alt p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
                <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">Mode d’utilisation</p>
                <p className="mt-0.5 truncate text-xs text-foreground-muted">
                  Actuel : {user.activeRole === 'PROPRIETAIRE' ? 'propriétaire' : 'locataire'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => switchRole(roleCible)}
              disabled={isSwitching}
              className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-border bg-background-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt disabled:opacity-50"
            >
              {isSwitching
                ? 'Chargement…'
                : roleCible === 'LOCATAIRE' ? 'Passer locataire' : 'Passer propriétaire'}
            </button>
          </div>
        )}
      </div>

      {/* ── Actions sensibles ────────────────────────────────────────────── */}

      <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-border bg-background-card py-3 text-xs font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt"
        >
          <LogOut className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
          Se déconnecter
        </button>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-error-500/25 bg-background-card py-3 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
        >
          <Trash2 className="h-4 w-4 text-error-600" aria-hidden="true" />
          Supprimer mon compte
        </button>
      </div>

      {/* ── Confirmation de suppression ──────────────────────────────────── */}

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-forest-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={closeDeleteModal}
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
                ref={cancelRef}
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                aria-label="Fermer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-border text-foreground-muted transition-colors hover:bg-background-alt disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h2 id={titleId} className="font-display text-xl font-semibold text-foreground">
                Supprimer votre compte
              </h2>
              <p className="text-sm leading-relaxed text-foreground-muted">
                Cette action est <strong className="font-semibold text-error-700">définitive</strong>.
                Vos réservations, annonces, transactions, pièces d’identité et données
                personnelles seront effacées.
              </p>
              {/* Un séquestre en cours doit être arbitré avant, pas après. */}
              <p className="rounded-inner border border-warning-500/25 bg-warning-50 p-3 text-xs leading-relaxed text-warning-700">
                Si un séjour est en cours ou des fonds sont en séquestre, réglez-les avant de
                supprimer votre compte. Sinon, contactez le support.
              </p>
            </div>

            {/* Saisie explicite : un clic isolé ne peut pas effacer un compte. */}
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

            {deleteError && (
              <p role="alert" className="rounded-inner border border-error-500/20 bg-error-50 p-3 text-xs leading-relaxed text-error-700">
                {deleteError}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canDelete || isDeleting}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-2 rounded-pill py-3 text-xs font-semibold transition-colors',
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
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="w-full rounded-pill py-2.5 text-xs font-semibold text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
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