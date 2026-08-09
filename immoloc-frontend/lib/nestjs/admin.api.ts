import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';

export interface AdminDashboardStats {
  gmv: number;
  commissions: number;
  payoutsNet: number;
  totalReservations: number;
  totalUsers: number;
  activeHosts: number;
  publishedListings: number;
  completedStays: number;
}

export interface AdminPendingSummary {
  pendingKyc: number;
  pendingListings: number;
  pendingWithdrawals: number;
  pendingDisputes: number;
  urgentTickets: number;
  totalUrgentActions: number;
}

export interface AdminRevenueMonth {
  month: string;
  volume: number;
  commission: number;
  count: number;
}

export interface AdminRecentActivity {
  recentUsers: Array<{
    id: string;
    prenom: string;
    nom: string;
    email: string;
    estProprietaire: boolean;
    statutKyc: string;
    creeLe: string;
  }>;
  recentReservations: Array<{
    id: string;
    statut: string;
    totalLocataire: number;
    creeLe: string;
    locataire: { prenom: string; nom: string };
    logement: { titre: string };
  }>;
  recentDisputes: Array<{
    id: string;
    statut: string;
    motif: string;
    creeLe: string;
    reservationId: string;
  }>;
  recentTickets: Array<{
    id: string;
    code: string;
    sujet: string;
    priorite: string;
    statut: string;
    creeLe: string;
  }>;
}

export const adminApi = {
  getDashboardStats: () =>
    nestFetch<AdminDashboardStats>(NEST_API.ADMIN.DASHBOARD_STATS),

  getPendingSummary: () =>
    nestFetch<AdminPendingSummary>(NEST_API.ADMIN.PENDING_SUMMARY),

  getRevenueChart: () =>
    nestFetch<AdminRevenueMonth[]>(NEST_API.ADMIN.REVENUE_CHART),

  getRecentActivity: () =>
    nestFetch<AdminRecentActivity>(NEST_API.ADMIN.RECENT_ACTIVITY),

  getGeographicStats: () =>
    nestFetch<Array<{ ville: string; count: number; percentage: number }>>(NEST_API.ADMIN.GEOGRAPHIC_STATS),

  getTopPerformers: () =>
    nestFetch<Array<{ id: string; nom: string; email: string; statutKyc: string; totalLogements: number }>>(NEST_API.ADMIN.TOP_PERFORMERS),

  getPendingWithdrawals: () =>
    nestFetch<Array<{ id: string; montant: number; methode: string; destinataire: string; demandeeLe: string; hoteNom: string }>>(NEST_API.ADMIN.PENDING_WITHDRAWALS),

  getPendingDisputes: () =>
    nestFetch<Array<{ id: string; reservationId: string; declarePar: string; motif: string; description: string; coutEstime: number | null; creeLe: string; logementTitre: string; locataireNom: string }>>(NEST_API.ADMIN.PENDING_DISPUTES),

  getAuditLogs: () =>
    nestFetch<Array<{ id: string; type: string; details: string; date: string; status: 'SUCCESS' | 'INFO' }>>(NEST_API.ADMIN.AUDIT_LOGS),

  getPendingKycList: () =>
    nestFetch<any[]>(`${NEST_API.ADMIN.KYC_LIST}?statut=EN_ATTENTE&limit=5`),

  listKyc: (statut?: string) =>
    nestFetch<any[]>(statut ? `${NEST_API.ADMIN.KYC_LIST}?statut=${statut}` : NEST_API.ADMIN.KYC_LIST),

  getKycDetails: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.KYC_DETAILS(id)),

  verifyKyc: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.KYC_VERIFY(id), { method: 'PATCH' }),

  rejectKyc: (id: string, reason: string) =>
    nestFetch<any>(NEST_API.ADMIN.KYC_REJECT(id), {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  flagKycRenewal: (id: string) =>
    nestFetch<any>(NEST_API.ADMIN.KYC_FLAG_RENEWAL(id), { method: 'PATCH' }),

  getPendingListingsList: () =>
    nestFetch<any[]>(`${NEST_API.ADMIN.LISTINGS_LIST}?statut=PENDING_REVIEW&limit=5`),

  getPendingWithdrawalsList: () =>
    nestFetch<any[]>(`${NEST_API.ADMIN.WITHDRAWALS_LIST}?statut=EN_ATTENTE&limit=5`),
};
