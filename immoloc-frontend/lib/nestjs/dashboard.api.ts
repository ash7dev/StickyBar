import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';
import { tokenManager } from './token-manager';
import type {
  CreateOwnerBlockPayload,
  OwnerCalendarBlockEvent,
  OwnerCalendarResponse,
  OwnerOverviewResponse,
  OwnerRevenueResponse,
  OwnerStatementResponse,
  OwnerTransactionsResponse,
  RevenuePeriod,
  TransactionType,
} from './types';

export const dashboardApi = {
  /**
   * Accueil hôte : revenus, occupation, performance par bien, versements, réputation, conseils
   */
  getOwnerOverview: () => nestFetch<OwnerOverviewResponse>(NEST_API.DASHBOARD.OVERVIEW),

  /**
   * Calendrier multi-logements sur une période (`to` exclu, 93 jours max)
   */
  getOwnerCalendar: (params: { from: string; to: string; logementIds?: string[] }) => {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.logementIds?.length) query.set('logementIds', params.logementIds.join(','));
    return nestFetch<OwnerCalendarResponse>(`${NEST_API.DASHBOARD.CALENDAR}?${query}`);
  },

  /**
   * Bloque une période sur un ou plusieurs logements (tout ou rien, 409 si conflit)
   */
  createCalendarBlocks: (payload: CreateOwnerBlockPayload) =>
    nestFetch<OwnerCalendarBlockEvent[]>(NEST_API.DASHBOARD.CALENDAR_BLOCKS, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteCalendarBlock: (blockId: string) =>
    nestFetch<{ id: string }>(NEST_API.DASHBOARD.CALENDAR_BLOCK(blockId), { method: 'DELETE' }),

  /** Page Revenus : période, historique 12 mois, par bien, wallet, versements */
  getOwnerRevenue: (period: RevenuePeriod) =>
    nestFetch<OwnerRevenueResponse>(`${NEST_API.DASHBOARD.REVENUE}?period=${period}`),

  /** Relevé mensuel (`month` = `YYYY-MM`) */
  getOwnerStatement: (month: string) =>
    nestFetch<OwnerStatementResponse>(`${NEST_API.DASHBOARD.REVENUE_STATEMENT}?month=${month}`),

  /** Historique du wallet, paginé par curseur */
  getOwnerTransactions: (params: { cursor?: string | null; type?: TransactionType | null; limit?: number }) => {
    const query = new URLSearchParams({ limit: String(params.limit ?? 20) });
    if (params.cursor) query.set('cursor', params.cursor);
    if (params.type) query.set('type', params.type);
    return nestFetch<OwnerTransactionsResponse>(`${NEST_API.DASHBOARD.REVENUE_TRANSACTIONS}?${query}`);
  },

  /**
   * Télécharge le relevé CSV. nestFetch lit du JSON : on passe ici par fetch
   * avec le même jeton pour récupérer le fichier brut.
   */
  downloadOwnerStatementCsv: async (month: string) => {
    const token = await tokenManager.getValidToken();
    const res = await fetch(`${NEST_API.DASHBOARD.REVENUE_STATEMENT_CSV}?month=${month}`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Active-Role': 'PROPRIETAIRE' },
    });
    if (!res.ok) throw new Error('Impossible de télécharger le relevé');
    const url = URL.createObjectURL(await res.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = `klef-releve-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
