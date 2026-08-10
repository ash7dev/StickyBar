import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';
import type { TerangaAccountData, TerangaQuest } from './types';

export const terangaClubApi = {
  /** Récupérer mon compte Teranga Club (solde, tier, badges, transactions) */
  getMyAccount: () =>
    nestFetch<TerangaAccountData>(`${NEST_API}/teranga-club/me`),

  /** Récupérer la liste des quêtes disponibles et leur état */
  getQuests: () =>
    nestFetch<TerangaQuest[]>(`${NEST_API}/teranga-club/quests`),
};
