'use client';

import { useRoleStore } from '@/stores/role.store';

export type GateStep = 'profile' | 'phone' | 'kyc' | 'selfie';
export type GateBlock = 'kyc_suspended' | null;

export interface ActionGateState {
  steps: GateStep[];
  block: GateBlock;
  isReady: boolean;
}

export function useActionGate(): ActionGateState {
  const { profileCompleted, phoneVerified, statutKyc, nestToken, needsOnboarding, selfieFaceDetected } = useRoleStore();

  // Non connecté → pas de gate (la redirection login s'en charge)
  if (!nestToken && !needsOnboarding) return { steps: [], block: null, isReady: true };

  const steps: GateStep[] = [];
  let block: GateBlock = null;

  if (!profileCompleted) steps.push('profile');
  if (!phoneVerified) steps.push('phone');

  if (statutKyc === 'NON_VERIFIE' || statutKyc === 'REJETE' || statutKyc === 'A_RENOUVELER') {
    steps.push('kyc');
  } else if (statutKyc === 'SUSPENDU') {
    block = 'kyc_suspended';
  }

  // ── SELFIE DÉSACTIVÉ ──
  // L'étape selfie est temporairement masquée (mode simulation uniquement)
  // if (statutKyc === 'EN_ATTENTE' && !selfieFaceDetected) {
  //   steps.push('selfie');
  // }

  const isReady = steps.length === 0 && block === null;

  return { steps, block, isReady };
}
