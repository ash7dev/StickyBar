import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';
import type { TerangaAccountData, TerangaQuest } from './types';

export const terangaClubApi = {
  /** Récupérer mon compte Teranga Club (solde, tier, badges, transactions) */
  getMyAccount: () =>
    nestFetch<TerangaAccountData>(NEST_API.TERANGA_CLUB.ME),

  /** Récupérer la liste des quêtes disponibles et leur état */
  getQuests: () =>
    nestFetch<TerangaQuest[]>(NEST_API.TERANGA_CLUB.QUESTS),

  /** Débloquer / Réclamer un badge de quête */
  claimQuest: (code: string) =>
    nestFetch<{
      success: boolean;
      claimed: boolean;
      alreadyClaimed?: boolean;
      bonusCoins?: number;
      libelle?: string;
      icone?: string;
      actionRequired?: 'RESERVE' | 'REVIEW' | 'EXPLORE' | 'SHARE';
      message: string;
    }>(NEST_API.TERANGA_CLUB.CLAIM_QUEST(code), {
      method: 'POST',
    }),
};
