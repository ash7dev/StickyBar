'use client';

import { useState } from 'react';
import { X, Send, Bell, AlertTriangle } from 'lucide-react';
import { adminApi } from '@/lib/nestjs';

interface AdminUserBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function AdminUserBroadcastModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminUserBroadcastModalProps) {
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !contenu.trim()) return;

    setIsSubmitting(true);
    try {
      await adminApi.broadcastNotification({ titre: titre.trim(), message: contenu.trim(), canal: 'PUSH', cible: 'ALL' });
      onSuccess("Notification Push diffusée avec succès à tous les utilisateurs enregistrés !");
      setTitre('');
      setContenu('');
      onClose();
    } catch {
      onSuccess("Erreur lors de la diffusion de la notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-5 no-scrollbar max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
              <Bell className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">Diffusion de Notification Push</h2>
              <p className="text-xs text-foreground-muted">Envoyer un message général aux utilisateurs de la plateforme</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="broadcast-title" className="block text-xs font-semibold text-foreground">
              Titre de la notification Push :
            </label>
            <input
              id="broadcast-title"
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="ex: Mise à jour importante des conditions Klef"
              required
              className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="broadcast-content" className="block text-xs font-semibold text-foreground">
              Contenu du message :
            </label>
            <textarea
              id="broadcast-content"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Rédigez le texte clair de l'annonce transmise sur l'application..."
              rows={4}
              required
              className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-forest-500 focus:outline-none"
            />
          </div>

          <div className="rounded-inner border border-border bg-background-alt/50 p-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
            <p className="text-[0.6875rem] text-foreground-muted leading-snug">
              Ce message sera transmis instantanément aux appareils mobiles et navigateurs ayant activé les notifications Push Klef.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
            <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !titre.trim() || !contenu.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-inner bg-forest-700 px-5 text-xs font-semibold text-neutral-0 hover:bg-forest-800 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Diffusion en cours..." : "Diffuser maintenant"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
