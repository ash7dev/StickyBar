import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';

// ── Admin API ────────────────────────────────────────────────────────────────
// Toutes les méthodes admin centralisées. Chaque page admin importe adminApi.

export const adminApi = {
  // ─── Dashboard ──────────────────────────────────────────────────────────────
  getDashboardStats: () =>
    nestFetch<any>(NEST_API.ADMIN.DASHBOARD_STATS),

  getPendingSummary: () =>
    nestFetch<any>(NEST_API.ADMIN.PENDING_SUMMARY),

  getRevenueChart: () =>
    nestFetch<any[]>(NEST_API.ADMIN.REVENUE_CHART),

  getRecentActivity: () =>
    nestFetch<any>(NEST_API.ADMIN.RECENT_ACTIVITY),

  getGeographicStats: () =>
    nestFetch<any[]>(NEST_API.ADMIN.GEOGRAPHIC_STATS),

  getTopPerformers: () =>
    nestFetch<any[]>(NEST_API.ADMIN.TOP_PERFORMERS),

  getPendingWithdrawals: () =>
    nestFetch<any[]>(NEST_API.ADMIN.PENDING_WITHDRAWALS),

  getPendingDisputes: () =>
    nestFetch<any[]>(NEST_API.ADMIN.PENDING_DISPUTES),

  getAuditLogs: () =>
    nestFetch<any[]>(NEST_API.ADMIN.AUDIT_LOGS),

  // ─── KYC ────────────────────────────────────────────────────────────────────
  listKyc: () =>
    nestFetch<any[]>(NEST_API.ADMIN.KYC_LIST),

  getKycDetails: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.KYC_DETAILS(id)),

  verifyKyc: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.KYC_VERIFY(id), { method: 'PATCH' }),

  rejectKyc: (id: string, raison: string) =>
    nestFetch<any>(NEST_API.ADMIN.KYC_REJECT(id), {
      method: 'PATCH',
      body: JSON.stringify({ raison }),
    }),

  flagKycRenewal: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.KYC_FLAG_RENEWAL(id), { method: 'PATCH' }),

  getPendingKycList: () =>
    nestFetch<any[]>(NEST_API.ADMIN.KYC_LIST),

  // ─── Listings (Annonces) ────────────────────────────────────────────────────
  listListings: (params?: { statut?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return nestFetch<{ data: any[]; meta: { page: number; limit: number; total: number; totalPages: number } }>(
      `${NEST_API.ADMIN.LISTINGS_LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  getListingDetails: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.LISTING_DETAILS(id)),

  publishListing: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.LISTING_PUBLISH(id), { method: 'PATCH' }),

  rejectListing: (id: string, raison: string) =>
    nestFetch<any>(NEST_API.ADMIN.LISTING_REJECT(id), {
      method: 'PATCH',
      body: JSON.stringify({ raison }),
    }),

  suspendListing: (id: string, raison: string) =>
    nestFetch<any>(NEST_API.ADMIN.LISTING_SUSPEND(id), {
      method: 'PATCH',
      body: JSON.stringify({ raison }),
    }),

  unsuspendListing: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.LISTING_UNSUSPEND(id), { method: 'PATCH' }),

  setFeaturedListing: (id: string, isFeatured: boolean, dureeJours?: number) =>
    nestFetch<any>(NEST_API.ADMIN.LISTING_FEATURED(id), {
      method: 'PATCH',
      body: JSON.stringify({ isFeatured, dureeJours }),
    }),

  getPendingListingsList: () =>
    nestFetch<any[]>(`${NEST_API.ADMIN.LISTINGS_LIST}?statut=PENDING_REVIEW`),

  // ─── Disputes (Litiges) ─────────────────────────────────────────────────────
  listDisputes: (statut?: string) => {
    const qs = statut ? `?statut=${statut}` : '';
    return nestFetch<any[]>(`${NEST_API.ADMIN.DISPUTES_LIST}${qs}`);
  },

  getDisputeDetails: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.DISPUTE_DETAILS(id)),

  resolveDispute: (id: string, statut: 'FONDE' | 'NON_FONDE', decisionAdmin: string) =>
    nestFetch<any>(NEST_API.ADMIN.DISPUTE_RESOLVE(id), {
      method: 'PATCH',
      body: JSON.stringify({ statut, decisionAdmin }),
    }),

  // ─── Withdrawals (Retraits) & Finances ───────────────────────────────────────
  listWithdrawals: () =>
    nestFetch<any[]>(NEST_API.ADMIN.WITHDRAWALS_LIST),

  listWithdrawalsHistory: () =>
    nestFetch<any[]>(NEST_API.ADMIN.WITHDRAWALS_HISTORY),

  validateWithdrawal: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.WITHDRAWAL_VALIDATE(id), { method: 'PATCH' }),

  rejectWithdrawal: (id: string, raisonRejet: string) =>
    nestFetch<any>(NEST_API.ADMIN.WITHDRAWAL_REJECT(id), {
      method: 'PATCH',
      body: JSON.stringify({ raisonRejet }),
    }),

  listTransactions: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return nestFetch<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `${NEST_API.ADMIN.TRANSACTIONS_LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  getFinancialStats: (params?: { startDate?: string; endDate?: string; ville?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.ville) query.set('ville', params.ville);
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return nestFetch<any>(`${NEST_API.ADMIN.FINANCE_STATS}${qs ? `?${qs}` : ''}`);
  },

  listRefunds: (params?: { page?: number; limit?: number; statut?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.statut) query.set('statut', params.statut);
    const qs = query.toString();
    return nestFetch<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `${NEST_API.ADMIN.REFUNDS_LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  retryRefund: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.REFUND_RETRY(id), { method: 'POST' }),

  listWebhookLogs: (params?: { page?: number; limit?: number; provider?: string; isValid?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.provider) query.set('provider', params.provider);
    if (params?.isValid !== undefined) query.set('isValid', String(params.isValid));
    const qs = query.toString();
    return nestFetch<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `${NEST_API.ADMIN.WEBHOOKS_LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  adjustWalletBalance: (dto: { utilisateurId: string; montant: number; sens: 'CREDIT' | 'DEBIT'; description: string }) =>
    nestFetch<any>(NEST_API.ADMIN.WALLET_ADJUSTMENT, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // ─── Reservations ──────────────────────────────────────────────────────────
  listReservations: (params?: { statut?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return nestFetch<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `${NEST_API.ADMIN.RESERVATIONS_LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  getReservationDetails: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.RESERVATION_DETAILS(id)),

  forceCancelReservation: (id: string, raison: string, tauxRemboursementLocataire = 100) =>
    nestFetch<any>(NEST_API.ADMIN.RESERVATION_FORCE_CANCEL(id), {
      method: 'POST',
      body: JSON.stringify({ raison, tauxRemboursementLocataire }),
    }),

  // ─── Users ──────────────────────────────────────────────────────────────────
  listUsers: (params?: { search?: string; statutKyc?: string; estProprietaire?: boolean; actif?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.statutKyc) query.set('statutKyc', params.statutKyc);
    if (params?.estProprietaire !== undefined) query.set('estProprietaire', String(params.estProprietaire));
    if (params?.actif !== undefined) query.set('actif', String(params.actif));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return nestFetch<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `${NEST_API.ADMIN.USERS_LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  getUserById: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.USER_BY_ID(id)),

  blockUser: (id: string, bloquer: boolean, raison?: string) =>
    nestFetch<any>(NEST_API.ADMIN.USER_BLOCK(id), {
      method: 'PATCH',
      body: JSON.stringify({ bloquer, raison }),
    }),

  updateUserRole: (id: string, estProprietaire: boolean) =>
    nestFetch<any>(NEST_API.ADMIN.USER_ROLE(id), {
      method: 'PATCH',
      body: JSON.stringify({ estProprietaire }),
    }),

  resetUserFaults: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.USER_RESET_FAULTS(id), {
      method: 'POST',
    }),

  // ─── Support Tickets ────────────────────────────────────────────────────────
  listTickets: (params?: { statut?: string; categorie?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.statut) query.set('statut', params.statut);
    if (params?.categorie) query.set('categorie', params.categorie);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return nestFetch<any[]>(`${NEST_API.ADMIN.TICKETS_LIST}${qs ? `?${qs}` : ''}`);
  },

  getTicketDetails: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.TICKET_DETAILS(id)),

  replyToTicket: (id: string, message: string) =>
    nestFetch<any>(NEST_API.ADMIN.TICKET_REPLY(id), {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  updateTicketStatus: (id: string, statut: string, priorite?: string) =>
    nestFetch<any>(NEST_API.ADMIN.TICKET_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ statut, priorite }),
    }),

  // ─── Reviews (Avis & Notes) ────────────────────────────────────────────────
  listReviews: (params?: { page?: number; limit?: number; typeAvis?: string; search?: string; minNote?: number; maxNote?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.typeAvis) query.set('typeAvis', params.typeAvis);
    if (params?.search) query.set('search', params.search);
    if (params?.minNote) query.set('minNote', String(params.minNote));
    if (params?.maxNote) query.set('maxNote', String(params.maxNote));
    const qs = query.toString();
    return nestFetch<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `${NEST_API.ADMIN.REVIEWS_LIST}${qs ? `?${qs}` : ''}`,
    );
  },

  deleteReview: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.REVIEW_DELETE(id), { method: 'DELETE' }),

  // ─── Notifications ──────────────────────────────────────────────────────────
  broadcastNotification: (data: { titre: string; message: string; canal: string; cible: string }) =>
    nestFetch<any>(NEST_API.ADMIN.BROADCAST_NOTIFICATION, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listNotificationLogs: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return nestFetch<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `${NEST_API.ADMIN.NOTIFICATION_LOGS}${qs ? `?${qs}` : ''}`,
    );
  },

  // ─── Equipements ────────────────────────────────────────────────────────────
  listEquipements: () =>
    nestFetch<any[]>(NEST_API.ADMIN.EQUIPEMENTS_LIST),

  createEquipement: (data: { nom: string; icone?: string; categorie?: string }) =>
    nestFetch<any>(NEST_API.ADMIN.EQUIPEMENTS_CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEquipement: (id: string, data: { nom?: string; icone?: string; categorie?: string }) =>
    nestFetch<any>(NEST_API.ADMIN.EQUIPEMENT_UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteEquipement: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.EQUIPEMENT_DELETE(id), { method: 'DELETE' }),
};
