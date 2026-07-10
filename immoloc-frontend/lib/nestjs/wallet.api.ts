import { nestFetch } from './api-client';
import { NEST_API } from './endpoints';
import type { WalletData, WithdrawalPayload, RetraitResponse } from './types';

export const walletApi = {
  getMe: () =>
    nestFetch<WalletData>(NEST_API.WALLET.ME),

  withdraw: (payload: WithdrawalPayload) =>
    nestFetch<RetraitResponse>(NEST_API.WALLET.WITHDRAW, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
