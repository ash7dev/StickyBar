import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';

export const dashboardApi = {
  /**
   * Stats globales propriétaire
   */
  getOwnerStats: () => 
    nestFetch<any>(NEST_API.DASHBOARD.OWNER_STATS),

  /**
   * Actions en attente
   */
  getPendingActions: () => 
    nestFetch<any>(NEST_API.DASHBOARD.PENDING_ACTIONS),

  /**
   * Activité récente
   */
  getRecentActivity: () => 
    nestFetch<any[]>(NEST_API.DASHBOARD.RECENT_ACTIVITY),

  /**
   * Agenda 48h
   */
  getUpcomingEvents: () => 
    nestFetch<any>(NEST_API.DASHBOARD.UPCOMING_EVENTS),
};
