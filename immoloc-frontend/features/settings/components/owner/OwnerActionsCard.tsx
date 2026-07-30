'use client';

import { useState } from 'react';
import { Lock, LogOut, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';

export function OwnerActionsCard() {
  const router = useRouter();
  const clearSession = useRoleStore((s) => s.clearSession);

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
    <div className="card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/80">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Sécurité & Actions du Compte</h2>
          <p className="text-xs text-foreground-muted">Déconnexion de session et suppression définitive du compte Hôte</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Déconnexion */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-pill bg-background-alt hover:bg-background-card border border-border text-xs font-semibold text-foreground transition-all shadow-xs active:scale-98 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-foreground-muted" />
          <span>Se déconnecter de mon compte</span>
        </button>

        {/* Suppression définitive */}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-pill bg-error-50 hover:bg-error-100 border border-error-500/30 text-xs font-semibold text-error-700 dark:text-error-500 transition-all shadow-xs active:scale-98 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 text-error-600" />
          <span>Supprimer définitivement mon compte</span>
        </button>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-background-card rounded-card border border-border max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-inner bg-error-500/15 border border-error-500/30 flex items-center justify-center text-error-600 mx-auto">
              <AlertTriangle className="w-6 h-6 text-error-600" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-display text-xl font-semibold text-foreground">
                Supprimer votre compte Hôte ?
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Cette action est <strong className="text-error-600 font-bold">intégrale et définitive</strong>. Vos annonces, réservations, revenus enregistrés et données personnelles seront définitivement effacés de la plateforme Klef.
              </p>
            </div>

            {deleteError && (
              <div className="p-3.5 bg-error-50 border border-error-500/30 rounded-inner text-xs font-semibold text-error-700 text-center">
                {deleteError}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-pill bg-error-600 hover:bg-error-700 text-white text-xs font-semibold shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
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
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full py-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
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
