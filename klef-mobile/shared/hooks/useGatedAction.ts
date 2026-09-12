import { useState, useCallback } from 'react';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import { StatutKyc } from '../contracts';

export type GateStep = 'profile' | 'phone' | 'kyc';
export type GateBlock = 'kyc_suspended' | null;

export interface GatedActionState {
  open: boolean;
  steps: GateStep[];
  block: GateBlock;
}

/**
 * Hook pour protèger n'importe quelle action sensible (ex: Réserver un logement).
 * Évalue en temps réel le store d'authentification pour déterminer les étapes nécessaires.
 */
export function useGatedAction(onReady: () => void) {
  const [state, setState] = useState<GatedActionState>({
    open: false,
    steps: [],
    block: null,
  });

  const trigger = useCallback(() => {
    const { user, token } = useAuthStore.getState();

    // Si pas de token ou d'utilisateur, le composant appelant doit rediriger vers login
    if (!token || !user) {
      onReady();
      return;
    }

    const steps: GateStep[] = [];
    let block: GateBlock = null;

    // 1. Profil requis (Prénom et Nom au minimum, ou profileCompleted true)
    const hasProfile =
      Boolean(user.profileCompleted) ||
      (Boolean(user.prenom) && Boolean(user.nom));

    if (!hasProfile) {
      steps.push('profile');
    }

    // 2. Téléphone vérifié (ou téléphone présent)
    if (user.phoneVerified === false || (!user.telephone && !user.phoneVerified)) {
      steps.push('phone');
    }

    // 3. KYC (Pièce d'identité)
    const statut = user.statutKyc;
    if (
      statut === 'NON_VERIFIE' ||
      statut === 'REJETE' ||
      statut === 'A_RENOUVELER'
    ) {
      steps.push('kyc');
    } else if (statut === 'SUSPENDU') {
      block = 'kyc_suspended';
    }

    const isReady = steps.length === 0 && block === null;

    if (isReady) {
      onReady();
    } else {
      setState({ open: true, steps, block });
    }
  }, [onReady]);

  const complete = useCallback(() => {
    setState({ open: false, steps: [], block: null });
    onReady();
  }, [onReady]);

  const cancel = useCallback(() => {
    setState({ open: false, steps: [], block: null });
  }, []);

  return { gateState: state, trigger, complete, cancel };
}
