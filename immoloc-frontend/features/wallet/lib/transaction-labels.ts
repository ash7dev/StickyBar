import type { TransactionType, TransactionSens } from '@/lib/nestjs';

export interface TransactionMeta {
  label: string;
  colorClass: string;   // Tailwind text color
  bgClass: string;      // Tailwind bg color (badge)
  sign: '+' | '-';
}

const META: Record<TransactionType, TransactionMeta> = {
  CREDIT_LOCATION: {
    label: 'Séjour reçu',
    colorClass: 'text-success-600',
    bgClass: 'bg-success-50 text-success-700 border-success-100',
    sign: '+',
  },
  DEBIT_PENALITE: {
    label: 'Pénalité',
    colorClass: 'text-error-600',
    bgClass: 'bg-error-50 text-error-700 border-error-100',
    sign: '-',
  },
  DEBIT_RETRAIT: {
    label: 'Retrait',
    colorClass: 'text-neutral-500',
    bgClass: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    sign: '-',
  },
  DEBIT_DETTE: {
    label: 'Déduction dette',
    colorClass: 'text-warning-600',
    bgClass: 'bg-warning-50 text-warning-700 border-warning-100',
    sign: '-',
  },
};

export function getTransactionMeta(type: TransactionType, sens: TransactionSens): TransactionMeta {
  const base = META[type];
  // En cas de CREDIT inattendu (ex: remboursement), override signe et couleur
  if (sens === 'CREDIT' && base.sign === '-') {
    return { ...base, sign: '+', colorClass: 'text-success-600' };
  }
  return base;
}

export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-SN', {
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}
