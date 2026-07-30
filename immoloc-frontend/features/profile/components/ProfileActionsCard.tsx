'use client';

import { useState } from 'react';
import { Phone, CheckCircle2, XCircle, ArrowLeftRight, LogOut, Lock, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { useSwitchRole } from '@/features/auth/hooks/use-switch-role';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
}

export function ProfileActionsCard({ user }: Props) {
  const router = useRouter();
  const clearSession = useRoleStore((s) => s.clearSession);
  const { switchRole, isSwitching } = useSwitchRole();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleLogout() {
    const supabase = createClient();
    clearSession();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await nestFetch(NEST_API.USERS.DELETE_ME, {
        method: 'DELETE',
      });
      const supabase = createClient();
      clearSession();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch {
      setDeleteError('Une erreur est survenue lors de la suppression de votre compte. Veuillez réessayer.');
      setIsDeleting(false);
    }
  }

  return (
    <div className="bg-background-card rounded-card border border-border/80 p-5 space-y-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border/60">
        <div className="w-9 h-9 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0 shadow-2xs">
          <Lock className="w-4 h-4 text-lime-400" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-forest-950">Sécurité & Paramètres de Compte</h3>
          <p className="text-[10px] font-extrabold text-foreground-muted uppercase tracking-wider">Compte & Accès</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Téléphone */}
        <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-lime-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-forest-950">Téléphone portable</p>
              <p className="text-[10px] text-foreground-muted truncate mt-0.5">{user.telephone ?? 'Non renseigné'}</p>
            </div>
          </div>

          {user.phoneVerified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-forest-50 border border-forest-100 text-[10px] font-extrabold text-forest-800 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-forest-600" />
              <span>Vérifié</span>
            </span>
          ) : (
            <Link
              href="/dashboard/profil/verifier-telephone"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-warning-50 border border-warning-200 text-[10px] font-extrabold text-warning-800 shrink-0 hover:bg-warning-100 transition-colors"
            >
              <XCircle className="w-3 h-3 text-warning-600" />
              <span>Vérifier</span>
            </Link>
          )}
        </div>

        {/* Switch mode */}
        {user.estProprietaire && (
          <div className="bg-background-alt p-3.5 rounded-inner border border-border/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-inner bg-forest-950 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-4 h-4 text-lime-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-forest-950">Bascule de Mode</p>
                <p className="text-[10px] text-foreground-muted truncate mt-0.5">
                  Mode actuel : {user.activeRole === 'PROPRIETAIRE' ? 'Propriétaire' : 'Locataire'}
                </p>
              </div>
            </div>

            <button
              onClick={() => switchRole(user.activeRole === 'PROPRIETAIRE' ? 'LOCATAIRE' : 'PROPRIETAIRE')}
              disabled={isSwitching}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-pill bg-lime-400 hover:bg-lime-300 text-forest-950 text-xs font-extrabold transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
            >
              <span>{isSwitching ? 'Chargement…' : 'Changer'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Actions sensibles */}
      <div className="pt-3 border-t border-border/60 grid sm:grid-cols-2 gap-3">
        <button
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-pill bg-background-alt hover:bg-background-card border border-border/80 text-xs font-extrabold text-forest-950 transition-all active:scale-95 shadow-2xs"
        >
          <LogOut className="w-4 h-4 text-foreground-muted" />
          <span>Se déconnecter de mon compte</span>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-pill bg-error-50 hover:bg-error-100 border border-error-200 text-xs font-extrabold text-error-700 transition-all active:scale-95 shadow-2xs"
        >
          <Trash2 className="w-4 h-4 text-error-600" />
          <span>Supprimer définitivement mon compte</span>
        </button>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-background-card rounded-card border border-border max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-inner bg-error-100 border border-error-200 flex items-center justify-center text-error-600 mx-auto">
              <AlertTriangle className="w-6 h-6 text-error-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-display text-xl font-extrabold text-forest-950">
                Supprimer votre compte ?
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Cette action est <strong className="text-error-700 font-extrabold">intégrale et définitive</strong>. Toutes vos réservations, annonces, transactions, pièces d&apos;identité et données personnelles seront définitivement effacées du système.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-error-50 border border-error-200 rounded-inner text-xs font-bold text-error-700 text-center">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-pill bg-error-600 hover:bg-error-700 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Suppression en cours…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-white" />
                    <span>Oui, supprimer définitivement mon compte</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full py-2.5 text-xs font-bold text-foreground-muted hover:text-forest-950 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
