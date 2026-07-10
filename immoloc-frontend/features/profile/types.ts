export type StatutKyc =
  | 'NON_VERIFIE'
  | 'EN_ATTENTE'
  | 'VERIFIE'
  | 'REJETE'
  | 'A_RENOUVELER'
  | 'SUSPENDU';

export type UserRole = 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN';

export interface UserProfile {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  dateNaissance: string | null;
  activeRole: UserRole;
  estProprietaire: boolean;
  profileCompleted: boolean;
  phoneVerified: boolean;
  statutKyc: StatutKyc;
}

export const KYC_CONFIG: Record<StatutKyc, {
  label: string;
  description: string;
  theme: 'neutral' | 'warning' | 'success' | 'error' | 'orange';
  cta?: string;
  btnCls?: string;
}> = {
  NON_VERIFIE:  {
    label: 'Non vérifié',
    description: 'Soumettez vos documents pour débloquer toutes les fonctionnalités.',
    theme: 'orange',
    cta: 'Vérifier mon identité',
    btnCls: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200',
  },
  EN_ATTENTE:   {
    label: 'En cours de vérification',
    description: 'Vos documents sont en cours d\'examen par notre équipe.',
    theme: 'warning',
  },
  VERIFIE:      {
    label: 'Identité vérifiée',
    description: 'Votre identité a été confirmée avec succès.',
    theme: 'success',
  },
  REJETE:       {
    label: 'Dossier rejeté',
    description: 'Votre dossier n\'a pas pu être validé. Soumettez à nouveau.',
    theme: 'error',
    cta: 'Soumettre à nouveau',
  },
  A_RENOUVELER: {
    label: 'Renouvellement requis',
    description: 'Vos documents ont expiré. Mettez-les à jour pour continuer.',
    theme: 'orange',
    cta: 'Renouveler mes documents',
  },
  SUSPENDU:     {
    label: 'Compte suspendu',
    description: 'Votre accès est temporairement suspendu. Contactez le support.',
    theme: 'error',
  },
};

export const KYC_THEMES = {
  neutral: { bg: 'bg-neutral-100',  text: 'text-neutral-600',  dot: 'bg-neutral-400',  border: 'border-neutral-200',  icon: 'bg-neutral-100 text-neutral-500',  btn: 'bg-neutral-900 hover:bg-neutral-800 text-white' },
  warning: { bg: 'bg-amber-50',     text: 'text-amber-700',    dot: 'bg-amber-500',    border: 'border-amber-200',    icon: 'bg-amber-100 text-amber-600',     btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
  success: { bg: 'bg-emerald-50',   text: 'text-emerald-700',  dot: 'bg-emerald-500',  border: 'border-emerald-200',  icon: 'bg-emerald-100 text-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  error:   { bg: 'bg-rose-50',      text: 'text-rose-700',     dot: 'bg-rose-500',     border: 'border-rose-200',     icon: 'bg-rose-100 text-rose-600',       btn: 'bg-rose-500 hover:bg-rose-600 text-white' },
  orange:  { bg: 'bg-orange-50',    text: 'text-orange-700',   dot: 'bg-orange-500',   border: 'border-orange-200',   icon: 'bg-orange-100 text-orange-600',   btn: 'bg-orange-500 hover:bg-orange-600 text-white' },
};
