'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  X,
  Send,
  HelpCircle,
  Ticket,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PlusCircle,
  ShieldAlert,
  PhoneCall,
  ExternalLink,
  Wallet,
  ShieldCheck,
  Building,
  CreditCard,
  Search,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useRoleStore } from '@/stores/role.store';
import { useAssistantStore } from '@/stores/assistant.store';
import { translateApiError } from '@/lib/errors/translate';
import { toast } from 'sonner';

// Knowledge Base de l'Assistant Klef
interface FAQItem {
  id: string;
  category: 'VOYAGEUR' | 'HOTE' | 'PAIEMENT' | 'KYC';
  question: string;
  answer: string;
  actionUrl?: string;
  actionLabel?: string;
  tags: string[];
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'PAIEMENT',
    question: 'Quels sont les moyens de paiement acceptés au Sénégal ?',
    answer: 'Nous acceptons exclusivement Wave et Orange Money. Tous les paiements sont 100% sécurisés. Les fonds restent sous séquestre jusqu\'à votre entrée effective dans le logement.',
    tags: ['wave', 'orange money', 'paiement', 'payer', 'sequestre', 'sécurité', 'mobile money'],
  },
  {
    id: 'faq-2',
    category: 'HOTE',
    question: 'Quelle est la commission prélevée sur les hôtes (propriétaires) ?',
    answer: 'Klef applique 0% de commission sur les hôtes ! Vous percevez 100% du prix de nuitée que vous avez fixé. Seule une commission transparente de 7% est ajoutée côté voyageur.',
    tags: ['commission', 'hôte', 'frais', 'tarif', 'gratuit', 'propriétaire', 'pourcentage', '0%'],
  },
  {
    id: 'faq-3',
    category: 'PAIEMENT',
    question: 'Comment fonctionnent les retraits de revenus pour les hôtes ?',
    answer: 'Vos gains débloqués après chaque séjour sont disponibles sur votre portefeuille Klef. Vous pouvez demander un virement directement vers votre compte Wave ou Orange Money (traitement sous 24h à 48h).',
    actionUrl: '/dashboard/wallet',
    actionLabel: 'Accéder à mon portefeuille',
    tags: ['retrait', 'virement', 'solde', 'portefeuille', 'récupérer argent', 'wave', 'om'],
  },
  {
    id: 'faq-4',
    category: 'VOYAGEUR',
    question: 'Quelles sont les règles et barèmes d\'annulation ?',
    answer: '• Plus de 7 jours avant le check-in : Remboursement à 100%\n• Entre 3 et 7 jours : Remboursement à 50%\n• Entre 24h et 3 jours : Remboursement à 25%\n• Moins de 24h : Aucun remboursement.',
    tags: ['annulation', 'remboursement', 'annuler', 'politique', 'barème', 'délai'],
  },
  {
    id: 'faq-5',
    category: 'KYC',
    question: 'Comment vérifier mon identité (KYC) ?',
    answer: 'Allez dans vos paramètres, téléchargez votre CNI sénégalaise ou votre Passeport (recto/verso) et prenez un selfie rapide. La validation automatique prend moins de 15 minutes.',
    actionUrl: '/dashboard/parametres',
    actionLabel: 'Vérifier mon identité maintenant',
    tags: ['kyc', 'cni', 'carte identité', 'passeport', 'vérification', 'selfie', 'compte vérifié'],
  },
  {
    id: 'faq-6',
    category: 'VOYAGEUR',
    question: 'Comment fonctionne la caution et l\'état des lieux photo ?',
    answer: 'Lors de votre arrivée (Check-in) et de votre départ (Check-out), vous téléchargez des photos de l\'état du logement directement depuis l\'application. En cas de dégât avéré, Klef gère la médiation.',
    actionUrl: '/reservations',
    actionLabel: 'Voir mes réservations',
    tags: ['caution', 'état des lieux', 'dégâts', 'check-in', 'check-out', 'photos', 'photos état des lieux'],
  },
  {
    id: 'faq-7',
    category: 'VOYAGEUR',
    question: 'Où télécharger mon contrat de location PDF ?',
    answer: 'Chaque réservation confirmée génère automatiquement un contrat de location horodaté et signé numériquement. Vous pouvez le consulter et le télécharger sur la page de détails de votre séjour.',
    actionUrl: '/reservations',
    actionLabel: 'Consulter mes séjours & contrats',
    tags: ['contrat', 'pdf', 'bail', 'signature', 'document', 'télécharger'],
  },
];

interface TicketMessage {
  id: string;
  message: string;
  estAdmin: boolean;
  creeLe: string;
  auteur: {
    prenom: string;
    nom: string;
    avatarUrl?: string;
  };
}

interface TicketItem {
  id: string;
  code: string;
  sujet: string;
  categorie: string;
  statut: string;
  priorite: string;
  creeLe: string;
  misAJourLe: string;
  messages: TicketMessage[];
}

export function KlefAssistantWidget() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const store = useAssistantStore();

  const isAuthenticated = useRoleStore((s) => Boolean(s.nestToken));
  const activeRole = useRoleStore((s) => s.activeRole);

  const [activeTab, setActiveTab] = useState<'faq' | 'tickets'>(store.activeTab);
  const [isDismissed, setIsDismissed] = useState(false);

  // FAQ state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null);

  // Ticket Form state
  const [showCreateForm, setShowCreateForm] = useState(store.showCreateForm);
  const [ticketSujet, setTicketSujet] = useState(store.initialSubject);
  const [ticketCategorie, setTicketCategorie] = useState(store.initialCategory || 'RESERVATION');
  const [ticketPriorite, setTicketPriorite] = useState('MOYENNE');
  const [ticketMessage, setTicketMessage] = useState(store.initialMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User Tickets state
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Charger l'état masqué depuis sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('klef-assistant-dismissed') === 'true';
      setIsDismissed(dismissed);
    }
  }, []);

  // Synchronisation avec Zustand store lors d'un appel externe "Demander un assistant"
  useEffect(() => {
    if (store.isOpen) {
      setIsDismissed(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('klef-assistant-dismissed');
      }
      setActiveTab(store.activeTab);
      if (store.showCreateForm) {
        setShowCreateForm(true);
        if (store.initialSubject) setTicketSujet(store.initialSubject);
        if (store.initialCategory) setTicketCategorie(store.initialCategory);
        if (store.initialMessage) setTicketMessage(store.initialMessage);
      }
    }
  }, [store.isOpen, store.activeTab, store.showCreateForm, store.initialSubject, store.initialCategory, store.initialMessage]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('klef-assistant-dismissed', 'true');
    }
    if (store.isOpen) {
      store.closeAssistant();
    }
    toast.info('Assistant masqué', {
      description: `Vous pouvez le réactiver à tout moment depuis le footer de l'application.`,
    });
  }, [store]);

  const dialogId = useId();

  // Charger les tickets de l'utilisateur connecté
  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingTickets(true);
    try {
      const data = await nestFetch<TicketItem[]>(NEST_API.SUPPORT.MY_TICKETS);
      setTickets(data || []);
    } catch {
      // Erreur silencieuse
    } finally {
      setIsLoadingTickets(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (store.isOpen && activeTab === 'tickets') {
      fetchTickets();
    }
  }, [store.isOpen, activeTab, fetchTickets]);

  // Early return APRÈS tous les hooks (règle des hooks React)
  if (isAdminPage || (isDismissed && !store.isOpen)) {
    return null;
  }

  // Filtrer la FAQ avec recherche naturelle
  const filteredFAQ = FAQ_DATA.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q))
    );
  });

  // Création de ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSujet.trim() || !ticketMessage.trim()) {
      toast.error('Veuillez remplir le sujet et le message.');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Connexion requise', {
        description: 'Veuillez vous connecter pour créer un ticket de support.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newTicket = await nestFetch<TicketItem>(NEST_API.SUPPORT.CREATE_TICKET, {
        method: 'POST',
        body: JSON.stringify({
          sujet: ticketSujet,
          message: ticketMessage,
          categorie: ticketCategorie,
          priorite: ticketPriorite,
          reservationId: store.initialReservationId,
          logementId: store.initialLogementId,
        }),
      });

      toast.success('Ticket créé avec succès !', {
        description: `Référence : ${newTicket.code}. Nos équipes vous répondront rapidement.`,
      });

      // Réinitialiser le formulaire
      setTicketSujet('');
      setTicketMessage('');
      setShowCreateForm(false);
      setSelectedFAQ(null);
      setActiveTab('tickets');
      fetchTickets();
    } catch (err) {
      const translated = translateApiError(err);
      toast.error(translated.title, { description: translated.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Envoi de réponse à un ticket existant
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const newMsg = await nestFetch<TicketMessage>(
        NEST_API.SUPPORT.ADD_MESSAGE(selectedTicket.id),
        {
          method: 'POST',
          body: JSON.stringify({ message: replyMessage }),
        },
      );

      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, newMsg] } : null,
      );
      setReplyMessage('');
      fetchTickets();
    } catch (err) {
      const translated = translateApiError(err);
      toast.error(translated.title, { description: translated.message });
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <aside className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end print:hidden">
      {/* Fenêtre principale de l'assistant */}
      {store.isOpen && (
        <div
          id={dialogId}
          className="mb-3 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-forest-800/20 bg-background-card shadow-2xl transition-all sm:h-[560px] sm:w-[410px]"
        >
          {/* Header de l'assistant */}
          <div className="flex items-center justify-between border-b border-border bg-forest-950 px-4 py-3.5 text-neutral-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-pill bg-action text-on-action font-bold shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold leading-none text-neutral-0">
                  Assistant Klef
                </h3>
                <p className="mt-1 text-[11px] text-on-inverse-marker">
                  {activeRole === 'PROPRIETAIRE' ? 'Hôte Privilégié · Support 24/7' : 'Voyageur · Aide Instantanée'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex items-center gap-1 px-2 py-1 rounded-pill text-neutral-400 hover:text-white hover:bg-white/10 text-[11px] font-semibold transition-colors cursor-pointer"
                title="Masquer le bouton d’assistance"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Masquer</span>
              </button>
              <button
                type="button"
                onClick={store.closeAssistant}
                className="flex h-8 w-8 items-center justify-center rounded-pill text-neutral-0/80 transition-colors hover:bg-neutral-0/10 hover:text-neutral-0 cursor-pointer"
                aria-label="Fermer l'assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navigation Onglets */}
          <div className="flex border-b border-border bg-background-alt p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('faq');
                setSelectedTicket(null);
                setShowCreateForm(false);
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-inner py-2 text-xs font-semibold transition-all',
                activeTab === 'faq'
                  ? 'bg-background-card text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Guide & Réponses
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('tickets');
                setSelectedFAQ(null);
                setShowCreateForm(false);
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-inner py-2 text-xs font-semibold transition-all',
                activeTab === 'tickets'
                  ? 'bg-background-card text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              <Ticket className="h-3.5 w-3.5" />
              Mes Tickets {tickets.length > 0 && `(${tickets.length})`}
            </button>
          </div>

          {/* Contenu : Onglet FAQ / Réponses */}
          {activeTab === 'faq' && (
            <div className="flex flex-1 flex-col overflow-y-auto p-4 space-y-3">
              {showCreateForm ? (
                /* Formulaire de création de ticket */
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Retour au guide
                    </button>
                    <span className="text-xs font-semibold text-foreground-muted">
                      Nouveau Ticket
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Sujet de votre demande *
                    </label>
                    <input
                      type="text"
                      value={ticketSujet}
                      onChange={(e) => setTicketSujet(e.target.value)}
                      placeholder="Ex: Problème de paiement Wave, Question caution..."
                      required
                      className="w-full rounded-field border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-foreground-faint focus:border-forest-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Catégorie
                      </label>
                      <select
                        value={ticketCategorie}
                        onChange={(e) => setTicketCategorie(e.target.value)}
                        className="w-full rounded-field border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:outline-none"
                      >
                        <option value="RESERVATION">Réservation</option>
                        <option value="PAIEMENT">Paiement Mobile</option>
                        <option value="KYC">Vérification KYC</option>
                        <option value="LOGEMENT">Annonce / Logement</option>
                        <option value="LITIGE">Litige</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Priorité
                      </label>
                      <select
                        value={ticketPriorite}
                        onChange={(e) => setTicketPriorite(e.target.value)}
                        className="w-full rounded-field border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:outline-none"
                      >
                        <option value="MOYENNE">Moyenne</option>
                        <option value="HAUTE">Haute</option>
                        <option value="URGENTE">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Description détaillée *
                    </label>
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={4}
                      placeholder="Expliquez votre situation pour une prise en charge rapide..."
                      required
                      className="w-full rounded-field border border-border bg-background p-3 text-xs text-foreground placeholder:text-foreground-faint focus:border-forest-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-forest-950 py-3 text-xs font-semibold text-neutral-0 transition-colors hover:bg-forest-900 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5 text-on-inverse-marker" /> Transmettre à l&apos;équipe Klef
                      </>
                    )}
                  </button>
                </form>
              ) : selectedFAQ ? (
                /* Vue détaillée d'une question FAQ */
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setSelectedFAQ(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Retour à la liste
                  </button>

                  <div className="rounded-card border border-border bg-background-alt p-4 space-y-3">
                    <h4 className="font-display text-sm font-bold text-foreground leading-snug">
                      {selectedFAQ.question}
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground-muted whitespace-pre-line">
                      {selectedFAQ.answer}
                    </p>

                    {selectedFAQ.actionUrl && (
                      <div className="pt-2">
                        <Link
                          href={selectedFAQ.actionUrl}
                          onClick={() => store.closeAssistant()}
                          className="inline-flex items-center gap-1.5 rounded-pill bg-forest-950 px-4 py-2 text-xs font-semibold text-on-inverse-marker transition-colors hover:bg-forest-900"
                        >
                          <span>{selectedFAQ.actionLabel}</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="rounded-card border border-action-edge bg-marker-bg p-3.5 text-center space-y-2">
                    <p className="text-xs text-foreground font-medium">
                      Cette réponse ne résout pas totalement votre problème ?
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(true)}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-forest-950 px-4 py-2 text-xs font-semibold text-neutral-0 transition-colors hover:bg-forest-900"
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-on-inverse-marker" /> Transmettre un ticket de support
                    </button>
                  </div>
                </div>
              ) : (
                /* Recherche & Chips de catégories FAQ */
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-foreground-faint" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher (Wave, 0% commission, caution, CNI)..."
                      className="w-full rounded-field border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-foreground-faint focus:border-forest-600 focus:outline-none"
                    />
                  </div>

                  {/* Chips de raccourcis rapides */}
                  <div className="flex flex-wrap gap-1.5 py-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('ALL')}
                      className={cn(
                        'rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all',
                        selectedCategory === 'ALL'
                          ? 'bg-forest-950 text-on-inverse-marker'
                          : 'bg-background-alt text-foreground-muted hover:bg-border',
                      )}
                    >
                      Tous
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('PAIEMENT')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all',
                        selectedCategory === 'PAIEMENT'
                          ? 'bg-forest-950 text-on-inverse-marker'
                          : 'bg-background-alt text-foreground-muted hover:bg-border',
                      )}
                    >
                      <CreditCard className="h-3 w-3" /> Wave / OM
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('HOTE')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all',
                        selectedCategory === 'HOTE'
                          ? 'bg-forest-950 text-on-inverse-marker'
                          : 'bg-background-alt text-foreground-muted hover:bg-border',
                      )}
                    >
                      <Building className="h-3 w-3" /> Hôte (0% fee)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('KYC')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all',
                        selectedCategory === 'KYC'
                          ? 'bg-forest-950 text-on-inverse-marker'
                          : 'bg-background-alt text-foreground-muted hover:bg-border',
                      )}
                    >
                      <ShieldCheck className="h-3 w-3" /> KYC / CNI
                    </button>
                  </div>

                  {/* Liste FAQ */}
                  <div className="space-y-2">
                    {filteredFAQ.map((faq) => (
                      <button
                        key={faq.id}
                        type="button"
                        onClick={() => setSelectedFAQ(faq)}
                        className="flex w-full items-center justify-between rounded-inner border border-border bg-background-card p-3 text-left transition-colors hover:border-forest-300 hover:bg-background-alt"
                      >
                        <span className="text-xs font-semibold text-foreground pr-2">
                          {faq.question}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-foreground-muted" />
                      </button>
                    ))}
                  </div>

                  {/* WhatsApp Support Direct Button */}
                  <div className="mt-4 rounded-card border border-border bg-background-alt p-3.5 space-y-2">
                    <p className="text-xs text-foreground-muted text-center">
                      Vous préférez discuter directement avec une personne de notre équipe ?
                    </p>
                    <a
                      href="https://wa.me/221770000000?text=Bonjour%20Klef,%20j'ai%20une%20question"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-pill border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    >
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                      Contacter l&apos;équipe sur WhatsApp
                    </a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Contenu : Onglet Tickets */}
          {activeTab === 'tickets' && (
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              {!isAuthenticated ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center space-y-3 p-4">
                  <ShieldAlert className="h-8 w-8 text-forest-600" />
                  <p className="text-xs text-foreground-muted">
                    Connectez-vous à votre compte Klef pour suivre vos tickets de support et échanger avec l&apos;équipe.
                  </p>
                </div>
              ) : selectedTicket ? (
                /* Vue conversation ticket */
                <div className="flex flex-1 flex-col space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-forest-600 hover:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Retour aux tickets
                  </button>

                  <div className="rounded-inner border border-border bg-background-alt p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-forest-700">
                        {selectedTicket.code}
                      </span>
                      <span className="rounded-pill bg-forest-950 px-2 py-0.5 text-[10px] font-semibold text-on-inverse-marker">
                        {selectedTicket.statut}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-foreground">
                      {selectedTicket.sujet}
                    </h4>
                  </div>

                  {/* Fil de discussion */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[240px] p-1">
                    {selectedTicket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex flex-col max-w-[85%] rounded-card p-3 text-xs',
                          msg.estAdmin
                            ? 'self-start bg-forest-950 text-neutral-0 border border-forest-800'
                            : 'self-end bg-background-alt border border-border text-foreground ml-auto',
                        )}
                      >
                        <span className="text-[10px] font-semibold opacity-75 mb-1">
                          {msg.estAdmin ? 'Équipe Support Klef' : 'Vous'}
                        </span>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))}
                  </div>

                  {/* Formulaire de réponse */}
                  <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-2 border-t border-border">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Répondre..."
                      className="flex-1 rounded-field border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-forest-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSendingReply || !replyMessage.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-pill bg-forest-950 text-neutral-0 disabled:opacity-40"
                    >
                      {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-on-inverse-marker" />}
                    </button>
                  </form>
                </div>
              ) : (
                /* Liste des tickets de l'utilisateur */
                <div className="space-y-3">
                  {isLoadingTickets ? (
                    <div className="flex py-10 justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-forest-600" />
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-10 space-y-3">
                      <CheckCircle2 className="h-8 w-8 text-forest-600 mx-auto" />
                      <p className="text-xs text-foreground-muted">
                        Vous n&apos;avez aucun ticket de support en cours.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('faq');
                          setShowCreateForm(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-pill bg-forest-950 px-4 py-2 text-xs font-semibold text-neutral-0"
                      >
                        <PlusCircle className="h-3.5 w-3.5 text-on-inverse-marker" /> Créer un ticket
                      </button>
                    </div>
                  ) : (
                    tickets.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className="flex w-full flex-col gap-1 rounded-inner border border-border bg-background-card p-3 text-left transition-colors hover:border-forest-300 hover:bg-background-alt"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-forest-700">
                            {t.code}
                          </span>
                          <span className="rounded-pill bg-forest-100 px-2 py-0.5 text-[10px] font-semibold text-forest-800">
                            {t.statut}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {t.sujet}
                        </p>
                        <span className="text-[10px] text-foreground-muted">
                          Dernière mise à jour : {new Date(t.misAJourLe).toLocaleDateString('fr-FR')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bouton Flottant Déclencheur (Masquable avec badge X au survol) */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleDismiss}
          title="Masquer l'assistant"
          aria-label="Masquer l'assistant"
          className="absolute -top-1.5 -left-1.5 z-20 flex sm:hidden sm:group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-forest-900 border border-white/40 text-white hover:bg-red-600 transition-all shadow-md active:scale-90 cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (store.isOpen) store.closeAssistant();
            else store.openAssistant();
          }}
          className="flex h-13 w-13 items-center justify-center rounded-full bg-forest-950 text-neutral-0 shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 border border-forest-800/60 cursor-pointer"
          aria-label="Assistant Klef"
        >
          <div className="relative">
            <MessageSquare className="h-6 w-6 text-neutral-0 transition-transform group-hover:rotate-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-action opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-action" />
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}
