import { apiClient } from '../../../shared/api/api-client';
import { WalletData, WithdrawalRequest } from '../types/wallet.types';

export async function getMyWallet(): Promise<WalletData> {
  const res = await apiClient.get('/wallet/me');
  const data = res.data?.data || res.data;
  return {
    id: data?.id,
    soldeDisponible: Number(data?.soldeDisponible || 0),
    soldeProprietaire: Number(data?.soldeProprietaire ?? data?.soldeDisponible ?? 0),
    soldeLocataire: Number(data?.soldeLocataire || 0),
    dettePenalites: Number(data?.dettePenalites || 0),
    misAJourLe: data?.misAJourLe,
    transactions: Array.isArray(data?.transactions)
      ? data.transactions.map((t: any) => ({
          ...t,
          montant: Number(t.montant || 0),
          soldeApres: Number(t.soldeApres || 0),
        }))
      : [],
  };
}

export async function requestWithdrawal(payload: WithdrawalRequest): Promise<any> {
  const res = await apiClient.post('/wallet/withdraw', payload);
  return res.data;
}
