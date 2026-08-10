'use client';

import { useState } from 'react';
import { Send, CheckCircle2, XCircle, Clock, User, ShieldCheck, Phone, Mail, AlertTriangle, FileText, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { adminApi } from '@/lib/nestjs';

interface AdminSupportTicketDetailProps {
  ticket: any | null;
  onRefresh: () => void;
}

const CANNED_RESPONSES = [
  "Bonjour. Nous vérifions votre dossier auprès du service financier. Une réponse vous sera apportée d'ici 2 heures.",
  "Bonjour. Votre paiement a été débloqué et crédité sur votre portefeuille ImmoLoc.",
  "Bonjour. Merci de nous transmettre le verso lisible de votre pièce d'identité (CNI) pour finaliser votre vérification KYC.",
  "Bonjour. Votre demande de remboursement d'acompte a été approuvée conformément aux conditions d'annulation.",
];

export function AdminSupportTicketDetail({ ticket, onRefresh }: AdminSupportTicketDetailProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (!ticket) {
    return (
      <div className="rounded-card border border-border bg-background-card p-12 text-center h-[720px] flex flex-col items-center justify-center space-y-3">
        <ShieldCheck className="h-12 w-12 text-foreground-muted opacity-30" />
        <p className="font-display text-base font-bold text-foreground">Aucun ticket sélectionné</p>
        <p className="text-xs text-foreground-muted max-w-sm">
          Sélectionnez un ticket dans la liste à gauche pour afficher le fil de discussion et répondre à l'utilisateur.
        </p>
      </div>
    );
  }

  const user = ticket.utilisateur;
  const userName = `${user?.prenom ?? ''} ${user?.nom ?? ''}`.trim() || 'Utilisateur';

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSubmitting(true);
    try {
      await adminApi.replyToTicket(ticket.id, replyMessage.trim());
      showToast("Réponse transmise à l'utilisateur avec succès !");
      setReplyMessage('');
      onRefresh();
    } catch {
      showToast("Erreur lors de l'envoi de la réponse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatut: string) => {
    setIsUpdatingStatus(true);
    try {
      await adminApi.updateTicketStatus(ticket.id, newStatut);
      showToast(`Statut du ticket mis à jour : ${newStatut}`);
      onRefresh();
    } catch {
      showToast("Erreur lors de la mise à jour du statut.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-4 flex flex-col h-[720px] relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 right-4 z-50 rounded-card border border-forest-300 bg-forest-950 px-4 py-2.5 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Ticket Header & Status Controls */}
      <div className="border-b border-border pb-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-extrabold text-forest-800 text-sm">{ticket.code}</span>
            <span className="rounded-pill bg-forest-50 border border-forest-200 px-2 py-0.5 text-[0.625rem] font-bold text-forest-800 uppercase">
              {ticket.categorie}
            </span>
            <span className="rounded-pill bg-background-alt border border-border px-2 py-0.5 text-[0.625rem] font-bold text-foreground uppercase font-mono">
              PRIORITÉ: {ticket.priorite}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            {ticket.statut !== 'RESOLU' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('RESOLU')}
                className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-3 text-xs font-semibold text-neutral-0 hover:bg-forest-800 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Marquer Résolu</span>
              </button>
            )}

            {ticket.statut !== 'FERME' && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleUpdateStatus('FERME')}
                className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-alt px-3 text-xs font-semibold text-foreground hover:bg-background-card transition-colors disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5 text-foreground-muted" />
                <span>Fermer</span>
              </button>
            )}
          </div>
        </div>

        <h2 className="font-display text-base font-bold text-foreground">{ticket.sujet}</h2>

        {/* User Card Bar */}
        <div className="flex items-center justify-between text-xs rounded-inner bg-background-alt/50 p-2.5 border border-border/60">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-forest-700" />
            <span className="font-bold text-foreground">{userName}</span>
            {user?.email && <span className="text-foreground-muted text-[0.75rem]">({user.email})</span>}
          </div>
          {user?.telephone && (
            <span className="font-mono text-foreground-muted flex items-center gap-1 text-[0.75rem]">
              <Phone className="h-3 w-3 text-forest-700" /> {user.telephone}
            </span>
          )}
        </div>
      </div>

      {/* Messages Discussion Thread */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
        {ticket.messages && ticket.messages.length > 0 ? (
          ticket.messages.map((m: any) => {
            const isMeAdmin = m.estAdmin;
            const authorName = m.auteur ? `${m.auteur.prenom ?? ''} ${m.auteur.nom ?? ''}`.trim() : (isMeAdmin ? 'Support ImmoLoc' : userName);

            return (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col max-w-[85%] space-y-1',
                  isMeAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                )}
              >
                <div className="flex items-center gap-1.5 text-[0.625rem] text-foreground-muted">
                  <span className="font-bold">{isMeAdmin ? 'Support Officiel Klef' : authorName}</span>
                  <span>·</span>
                  <span className="font-mono">{new Date(m.creeLe).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={cn(
                    'rounded-card p-3 text-xs leading-relaxed shadow-2xs',
                    isMeAdmin
                      ? 'bg-forest-900 text-neutral-0 rounded-tr-none border border-forest-800'
                      : 'bg-background-alt border border-border text-foreground rounded-tl-none'
                  )}
                >
                  {m.message}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-foreground-muted">Aucun message dans ce fil.</div>
        )}
      </div>

      {/* Canned Responses / Macros Quick Insert */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-[0.6875rem] font-bold text-foreground-muted uppercase tracking-wider">
          <Zap className="h-3 w-3 text-forest-700" /> Réponses Rapides Pré-enregistrées :
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CANNED_RESPONSES.map((macro, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setReplyMessage(macro)}
              className="rounded-pill border border-border bg-background-alt px-2.5 py-1 text-[0.625rem] font-medium text-foreground hover:bg-forest-50 hover:border-forest-200 transition-colors truncate max-w-[200px]"
            >
              {macro}
            </button>
          ))}
        </div>
      </div>

      {/* Reply Form Composer */}
      <form onSubmit={handleSendReply} className="space-y-2 pt-1">
        <div className="relative">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            rows={3}
            placeholder="Rédigez votre réponse officielle au client..."
            className="w-full rounded-inner border border-border bg-background-card p-3 text-xs text-foreground focus:border-forest-600 focus:outline-hidden"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] text-foreground-muted">
            Le client recevra cette réponse directement sur son application et par e-mail.
          </span>

          <button
            type="submit"
            disabled={isSubmitting || !replyMessage.trim()}
            className="inline-flex h-9 items-center gap-2 rounded-pill bg-forest-700 px-5 text-xs font-semibold text-neutral-0 hover:bg-forest-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Envoyer Réponse</span>
          </button>
        </div>
      </form>
    </div>
  );
}
