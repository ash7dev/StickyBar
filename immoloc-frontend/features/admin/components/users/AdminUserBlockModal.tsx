'use client';

import { useState } from 'react';
import { X, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { UserItem } from './AdminUsersTable';

interface AdminUserBlockModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBlockToggle: (user: UserItem, bloquer: boolean, raison?: string) => void;
}

const COMMON_BLOCK_REASONS = [
  "Tentatives de fraude ou fausse identité constatées",
  "Non-respect répété des conditions d'utilisation Klef",
  "Comportement inapproprié ou menaçant envers d'autres membres",
  "Usurpation d'identité ou documents de vérification falsifiés",
  "Compte temporairement gelé sur demande de l'utilisateur ou par précaution",
];

export function AdminUserBlockModal({
  user,
  isOpen,
  onClose,
  onConfirmBlockToggle,
}: AdminUserBlockModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen || !user) return null;

  const isBlocking = user.actif; // If currently active, action is to block
  const title = isBlocking ? "Bloquer le Compte Utilisateur" : "Débloquer le Compte Utilisateur";
  const subtitle = isBlocking
    ? `Blocage du compte de ${user.prenom} ${user.nom} (${user.email})`
    : `Réactivation du compte de ${user.prenom} ${user.nom} (${user.email})`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmBlockToggle(user, isBlocking, reason.trim() || undefined);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-9 w-9 items-center justify-center rounded-inner border ${isBlocking ? "bg-error-50 border-error-200 text-error-700" : "bg-forest-50 border-forest-200 text-forest-700"}`}>
              {isBlocking ? <Lock className="h-4.5 w-4.5" /> : <Unlock className="h-4.5 w-4.5" />}
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
              <p className="text-xs text-foreground-muted">{subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isBlocking && (
            <>
              {/* Alert Impact */}
              <div className="rounded-inner border border-error-200 bg-error-50 p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-error-700 shrink-0 mt-0.5" />
                <p className="text-[0.6875rem] text-error-900 leading-snug">
                  Attention : Le blocage empêchera immédiatement l'utilisateur de se connecter, de publier des annonces et de réserver.
                </p>
              </div>

              {/* Motifs pré-définis */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">
                  Motifs fréquents :
                </label>
                <div className="space-y-1.5">
                  {COMMON_BLOCK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className="w-full text-left rounded-inner border border-border bg-background-alt/50 p-2.5 text-xs text-foreground hover:bg-background-alt transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Motif / Commentaire */}
          <div className="space-y-1.5">
            <label htmlFor="user-block-reason" className="block text-xs font-semibold text-foreground">
              {isBlocking ? "Motif officiel du blocage (enregistré dans les journaux d'audit) :" : "Motif ou note de déblocage (optionnel) :"}
            </label>
            <textarea
              id="user-block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isBlocking ? "Saisissez la raison détaillée du blocage..." : "Raison de la réactivation..."}
              rows={3}
              className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
            <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
              Annuler
            </button>
            <button
              type="submit"
              className={`h-9 rounded-inner px-5 text-xs font-semibold text-neutral-0 ${isBlocking ? "bg-error-600 hover:bg-error-700" : "bg-forest-700 hover:bg-forest-800"}`}
            >
              {isBlocking ? "Confirmer le blocage" : "Confirmer le déblocage"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
