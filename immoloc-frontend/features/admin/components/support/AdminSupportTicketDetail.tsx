'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, Loader2, Phone, Send, ShieldCheck, User, XCircle, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { adminApi } from '@/lib/nestjs';
import type {
  TicketSupportItem,
  TicketMessageItem,
  StatutTicket,
} from './AdminSupportTicketsList';

interface AdminSupportTicketDetailProps {
  ticket: TicketSupportItem | null;
  onRefresh: () => void;
}

/* ─── Référentiels ────────────────────────────────────────────────────────
   Redéclarés localement plutôt qu'importés : les libellés vivent dans la
   liste. À terme, `STATUTS`, `CATEGORIES` et `PRIORITES` devraient sortir dans
   `@/features/admin/support/lib/referentiels.ts` et servir aux deux écrans —
   ici on se contente de ne plus afficher les enums brutes. */

const STATUT_LABEL: Record<StatutTicket, string> = {
  OUVERT: 'Ouvert',
  EN_COURS: 'En cours',
  EN_ATTENTE_UTILISATEUR: 'Attente client',
  RESOLU: 'Résolu',
  FERME: 'Fermé',
};

const CATEGORIE_LABEL: Record<TicketSupportItem['categorie'], string> = {
  RESERVATION: 'Réservation',
  PAIEMENT: 'Paiement',
  KYC: 'Vérification KYC',
  LOGEMENT: 'Logement',
  LITIGE: 'Litige',
  AUTRE: 'Autre',
};

const PRIORITE_LABEL: Record<TicketSupportItem['priorite'], string> = {
  BASSE: 'Priorité basse',
  MOYENNE: 'Priorité moyenne',
  HAUTE: 'Priorité haute',
  URGENTE: 'Urgent',
};

/* ─── Réponses enregistrées ───────────────────────────────────────────────
   ⚠️ Deux de ces messages disaient « ImmoLoc » — l'ancien nom du produit —
   dans du texte envoyé à des clients, et contredisaient la signature « Support
   Klef » affichée dans le même fil.

   Un libellé court par macro : les chips affichaient la phrase entière
   tronquée à 200 px, donc quatre boutons commençant tous par « Bonjour. Nous
   vérifions… », impossibles à distinguer. */

const REPONSES_TYPES: { id: string; titre: string; texte: string }[] = [
  {
    id: 'verification',
    titre: 'Vérification en cours',
    texte:
      'Bonjour, nous vérifions votre dossier auprès du service financier. Une réponse vous sera apportée sous 2 heures.',
  },
  {
    id: 'paiement-debloque',
    titre: 'Paiement débloqué',
    texte:
      'Bonjour, votre paiement a été débloqué et crédité sur votre portefeuille Klef.',
  },
  {
    id: 'kyc-verso',
    titre: 'KYC — verso manquant',
    texte:
      'Bonjour, merci de nous transmettre le verso lisible de votre pièce d’identité afin de finaliser votre vérification.',
  },
  {
    id: 'remboursement',
    titre: 'Remboursement approuvé',
    texte:
      'Bonjour, votre demande de remboursement d’acompte a été approuvée conformément aux conditions d’annulation.',
  },
];

/* ─── Utilitaires ─────────────────────────────────────────────────────────── */

const nomDe = (u?: { prenom?: string; nom?: string }) =>
  `${u?.prenom ?? ''} ${u?.nom ?? ''}`.trim();

const memeJour = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Étiquette de séparateur : « Aujourd'hui », « Hier », ou la date. */
function etiquetteJour(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  if (memeJour(d, now)) return "Aujourd'hui";
  const hier = new Date(now);
  hier.setDate(now.getDate() - 1);
  if (memeJour(d, hier)) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const heure = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

type Notification = { texte: string; ton: 'succes' | 'erreur' } | null;

/* ─── Composant ───────────────────────────────────────────────────────────── */

export function AdminSupportTicketDetail({ ticket, onRefresh }: AdminSupportTicketDetailProps) {
  const [reponse, setReponse] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [statutEnCours, setStatutEnCours] = useState(false);
  const [confirmationFermeture, setConfirmationFermeture] = useState(false);
  const [notification, setNotification] = useState<Notification>(null);

  const filRef = useRef<HTMLDivElement>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Le setTimeout n'était jamais nettoyé : changer de ticket pendant les
     4 secondes déclenchait un setState sur un composant démonté. */
  const notifier = useCallback((texte: string, ton: 'succes' | 'erreur') => {
    if (minuteur.current) clearTimeout(minuteur.current);
    setNotification({ texte, ton });
    minuteur.current = setTimeout(() => setNotification(null), 5000);
  }, []);

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  // Changer de ticket remet le composeur à zéro : envoyer au mauvais
  // destinataire un brouillon écrit pour un autre dossier serait pire que
  // de le perdre.
  useEffect(() => {
    setReponse('');
    setConfirmationFermeture(false);
    setNotification(null);
  }, [ticket?.id]);

  /* Les messages étaient rendus dans l'ordre du tableau, sans tri. */
  const messages = useMemo(() => {
    const liste = [...(ticket?.messages ?? [])];
    liste.sort((a, b) => new Date(a.creeLe).getTime() - new Date(b.creeLe).getTime());
    return liste;
  }, [ticket?.messages]);

  // Après un rechargement, l'agent restait en haut d'un fil de vingt messages.
  useEffect(() => {
    const el = filRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, ticket?.id]);

  const hauteur = 'h-[clamp(26rem,calc(100vh-13rem),46rem)]';

  if (!ticket) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-background-card p-12 text-center',
          hauteur,
        )}
      >
        <ShieldCheck className="h-10 w-10 text-neutral-400" aria-hidden />
        <p className="font-display text-base font-semibold text-foreground">Aucun ticket ouvert</p>
        <p className="max-w-sm text-xs text-foreground-muted">
          Choisissez une demande dans la file pour lire le fil et répondre.
        </p>
      </div>
    );
  }

  const utilisateur = ticket.utilisateur;
  const nomUtilisateur = nomDe(utilisateur) || 'Utilisateur';

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const texte = reponse.trim();
    if (!texte || envoiEnCours) return;

    setEnvoiEnCours(true);
    try {
      await adminApi.replyToTicket(ticket!.id, texte);
      setReponse('');
      notifier('Réponse envoyée.', 'succes');
      onRefresh();
    } catch (err) {
      /* Le message d'erreur était générique et s'affichait dans le même toast
         vert que le succès : un échec réseau ressemblait à une confirmation. */
      notifier(
        (err as Error)?.message || "La réponse n'a pas pu être envoyée. Réessayez.",
        'erreur',
      );
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function changerStatut(nouveau: StatutTicket) {
    if (statutEnCours) return;
    setStatutEnCours(true);
    try {
      await adminApi.updateTicketStatus(ticket!.id, nouveau);
      notifier(`Ticket marqué « ${STATUT_LABEL[nouveau]} ».`, 'succes');
      setConfirmationFermeture(false);
      onRefresh();
    } catch (err) {
      notifier(
        (err as Error)?.message || 'Le statut n’a pas pu être mis à jour.',
        'erreur',
      );
    } finally {
      setStatutEnCours(false);
    }
  }

  /* Insertion à la suite, pas remplacement : un agent ayant rédigé trois
     lignes perdait tout son texte en cliquant sur une macro. */
  function insererMacro(texte: string) {
    setReponse((actuel) => (actuel.trim() ? `${actuel.trimEnd()}\n\n${texte}` : texte));
  }

  const bouton =
    'inline-flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-card border border-border bg-background-card p-4 shadow-xs',
        hauteur,
      )}
    >
      {/* ── Notification ────────────────────────────────────────────────
          `role="status"` + `aria-live` : sans eux, un agent non-voyant
          envoyait une réponse sans aucun retour. */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'absolute right-4 top-3 z-50 flex items-center gap-2 rounded-pill px-3.5 py-2 text-xs font-semibold shadow-lg',
            notification.ton === 'succes'
              ? 'bg-forest-900 text-neutral-50'
              : 'bg-error-600 text-neutral-0',
          )}
        >
          {notification.ton === 'succes' ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {notification.texte}
        </div>
      )}

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <header className="shrink-0 space-y-2.5 border-b border-border pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-sm font-semibold text-forest-700">{ticket.code}</span>
            <span className="rounded-pill border border-border bg-background-alt px-2 py-0.5 text-xs font-medium text-foreground-muted">
              {CATEGORIE_LABEL[ticket.categorie] ?? ticket.categorie}
            </span>
            {/* « PRIORITÉ: URGENTE » en monospace majuscule devient un
                libellé, teinté seulement quand ça compte. */}
            <span
              className={cn(
                'rounded-pill border px-2 py-0.5 text-xs font-medium',
                ticket.priorite === 'URGENTE'
                  ? 'border-error-500/25 bg-error-50 text-error-700'
                  : ticket.priorite === 'HAUTE'
                    ? 'border-warning-500/25 bg-warning-50 text-warning-700'
                    : 'border-border bg-background-alt text-foreground-muted',
              )}
            >
              {PRIORITE_LABEL[ticket.priorite] ?? ticket.priorite}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {ticket.statut !== 'RESOLU' && ticket.statut !== 'FERME' && (
              <button
                type="button"
                disabled={statutEnCours}
                onClick={() => changerStatut('RESOLU')}
                aria-label="Marquer ce ticket comme résolu"
                className={cn(bouton, 'btn-primary h-8 px-3 text-xs')}
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Résolu
              </button>
            )}

            {ticket.statut !== 'FERME' && (
              <button
                type="button"
                disabled={statutEnCours}
                onClick={() => setConfirmationFermeture(true)}
                aria-label="Fermer définitivement ce ticket"
                className={cn(
                  bouton,
                  'border border-border bg-background-card text-foreground hover:bg-background-alt',
                )}
              >
                <XCircle className="h-3.5 w-3.5 text-foreground-muted" aria-hidden />
                Fermer
              </button>
            )}
          </div>
        </div>

        {/* Fermer est terminal et se déclenchait d'un seul clic, à côté de
            « Résolu ». La différence entre les deux est explicitée. */}
        {confirmationFermeture && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-inner bg-warning-50 px-3.5 py-2.5">
            <p className="text-xs text-warning-700">
              Fermer clôt la demande sans la marquer résolue. Le client ne pourra plus y répondre.
            </p>
            <span className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => setConfirmationFermeture(false)}
                className="text-xs font-semibold text-foreground-muted hover:text-foreground"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={statutEnCours}
                onClick={() => changerStatut('FERME')}
                className={cn(bouton, 'bg-error-600 text-neutral-0 hover:bg-error-700')}
              >
                {statutEnCours && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                Confirmer la fermeture
              </button>
            </span>
          </div>
        )}

        <h2 className="font-display text-base font-semibold leading-snug text-foreground">
          {ticket.sujet}
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-inner bg-background-alt px-3 py-2 text-xs">
          <span className="flex min-w-0 items-center gap-2">
            <User className="h-3.5 w-3.5 shrink-0 text-forest-600" aria-hidden />
            <span className="font-semibold text-foreground">{nomUtilisateur}</span>
            {utilisateur?.email && (
              <span className="truncate text-foreground-muted">{utilisateur.email}</span>
            )}
          </span>
          {utilisateur?.telephone && (
            <a
              href={`tel:${utilisateur.telephone.replace(/\s/g, '')}`}
              className="flex shrink-0 items-center gap-1.5 tabular-nums text-link hover:underline"
            >
              <Phone className="h-3 w-3" aria-hidden />
              {utilisateur.telephone}
            </a>
          )}
        </div>
      </header>

      {/* ── Fil ─────────────────────────────────────────────────────────── */}
      <div ref={filRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-foreground-muted">
            Aucun message dans ce fil.
          </p>
        ) : (
          messages.map((m: TicketMessageItem, i) => {
            const precedent = messages[i - 1];
            /* Seule l'heure était affichée : sur un fil vieux de cinq jours,
               tous les messages montraient « 14:32 ». */
            const nouveauJour =
              !precedent || !memeJour(new Date(precedent.creeLe), new Date(m.creeLe));
            const auteur = m.estAdmin
              ? nomDe(m.auteur) || 'Support Klef'
              : nomDe(m.auteur) || nomUtilisateur;

            return (
              <div key={m.id} className="space-y-3">
                {nouveauJour && (
                  <p className="text-center text-xs text-foreground-muted">
                    {etiquetteJour(m.creeLe)}
                  </p>
                )}

                {/* Le message du client porte la surface la plus lisible :
                    c'est lui qu'on lit pour décider. La réponse admin, déjà
                    connue de son auteur, reste en retrait. */}
                <div
                  className={cn(
                    'flex max-w-[85%] flex-col gap-1',
                    m.estAdmin ? 'ml-auto items-end' : 'mr-auto items-start',
                  )}
                >
                  <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                    <span className="font-semibold">{auteur}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={m.creeLe} className="tabular-nums">{heure(m.creeLe)}</time>
                  </p>
                  <div
                    className={cn(
                      'rounded-card px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line',
                      m.estAdmin
                        ? 'rounded-tr-md border border-border bg-background-alt text-foreground'
                        : 'rounded-tl-md border border-forest-100 bg-forest-50 text-foreground',
                    )}
                  >
                    {m.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Réponses enregistrées ───────────────────────────────────────── */}
      <div className="shrink-0 space-y-1.5 border-t border-border pt-3">
        <p className="eyebrow flex items-center gap-1.5 text-[0.6875rem]">
          <Zap className="h-3 w-3" aria-hidden />
          Réponses enregistrées
        </p>
        <div className="flex flex-wrap gap-1.5">
          {REPONSES_TYPES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => insererMacro(r.texte)}
              title={r.texte}
              className="rounded-pill border border-border bg-background-card px-3 py-1 text-xs font-medium text-foreground-muted transition-colors hover:border-forest-500 hover:text-foreground"
            >
              {r.titre}
            </button>
          ))}
        </div>
      </div>

      {/* ── Composeur ───────────────────────────────────────────────────── */}
      <form onSubmit={envoyer} className="shrink-0 space-y-2">
        <label htmlFor="reponse-support" className="sr-only">
          Réponse à {nomUtilisateur}
        </label>
        {/* Pas de `text-xs` : la couche base force 16 px et un utilitaire de
            taille ici ferait zoomer Safari iOS au focus. */}
        <textarea
          id="reponse-support"
          value={reponse}
          onChange={(e) => setReponse(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Votre réponse au client…"
          className="w-full resize-none rounded-field border border-border bg-background-alt px-3.5 py-2.5 leading-relaxed text-foreground placeholder:text-neutral-500 transition-colors focus:border-forest-600 focus:outline-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-foreground-muted">
            Envoyée dans l’application et par e-mail.
          </p>
          <button
            type="submit"
            disabled={envoiEnCours || !reponse.trim()}
            className="btn-primary h-9 px-5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            {envoiEnCours ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
}