import { apiClient } from './api-client';

export type CategorieTicket =
  | 'RESERVATION'
  | 'PAIEMENT'
  | 'KYC'
  | 'LOGEMENT'
  | 'LITIGE'
  | 'AUTRE';

export type PrioriteTicket = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE';

export type StatutTicket =
  | 'OUVERT'
  | 'EN_COURS'
  | 'EN_ATTENTE_UTILISATEUR'
  | 'RESOLU'
  | 'FERME';

export interface TicketMessage {
  id: string;
  message: string;
  estAdmin: boolean;
  creeLe: string;
  auteur: {
    id: string;
    prenom: string;
    nom: string;
    avatarUrl?: string;
  };
}

export interface TicketSupport {
  id: string;
  code: string;
  sujet: string;
  categorie: CategorieTicket;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  creeLe: string;
  misAJourLe: string;
  reservationId?: string;
  logementId?: string;
  messages: TicketMessage[];
}

export interface CreateTicketDto {
  sujet: string;
  message: string;
  categorie?: CategorieTicket;
  priorite?: PrioriteTicket;
  reservationId?: string;
  logementId?: string;
}

export const supportApi = {
  /**
   * Créer un nouveau ticket de support
   */
  async createTicket(dto: CreateTicketDto): Promise<TicketSupport> {
    const res = await apiClient.post<TicketSupport>('/support/tickets', dto);
    return res.data;
  },

  /**
   * Récupérer la liste des tickets de l'utilisateur connecté
   */
  async getMyTickets(): Promise<TicketSupport[]> {
    const res = await apiClient.get<TicketSupport[]>('/support/tickets');
    return res.data || [];
  },

  /**
   * Récupérer le détail d'un ticket spécifique avec tous ses messages
   */
  async getTicketDetails(id: string): Promise<TicketSupport> {
    const res = await apiClient.get<TicketSupport>(`/support/tickets/${id}`);
    return res.data;
  },

  /**
   * Envoyer un message dans un fil de ticket existant
   */
  async addTicketMessage(id: string, message: string): Promise<TicketMessage> {
    const res = await apiClient.post<TicketMessage>(`/support/tickets/${id}/messages`, { message });
    return res.data;
  },
};
