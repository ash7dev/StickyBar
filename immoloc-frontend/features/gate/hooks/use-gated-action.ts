'use client';

import { useState, useCallback } from 'react';
import { useActionGate } from '@/hooks/use-action-gate';
import type { GateStep, GateBlock } from '@/hooks/use-action-gate';
import { useRoleStore } from '@/stores/role.store';

interface GatedActionState {
  open: boolean;
  steps: GateStep[];
  block: GateBlock;
}

/**
 * Branche un gate de vérification sur n'importe quel bouton.
 *
 * Usage :
 *   const { gateState, trigger, complete, cancel } = useGatedAction(handleReserver);
 *   <button onClick={trigger}>Réserver</button>
 *   {gateState.open && <ActionGateModal {...gateState} onComplete={complete} onCancel={cancel} />}
 */
export function useGatedAction(onReady: () => void) {
  const gate = useActionGate();
  const [state, setState] = useState<GatedActionState>({ open: false, steps: [], block: null });

  const trigger = useCallback(() => {
    // Ré-évaluation dynamique de l'état du store pour éviter les fermetures obsolètes (stale closure)
    // suite à une synchronisation asynchrone de session (ex: syncFromSupabaseSession).
    const { profileCompleted, phoneVerified, statutKyc, nestToken, needsOnboarding } = useRoleStore.getState();

    // Non connecté → pas de bloqueur gate (la redirection vers la page de login s'en charge)
    if (!nestToken && !needsOnboarding) {
      onReady();
      return;
    }

    const steps: GateStep[] = [];
    let block: GateBlock = null;

    if (!profileCompleted) steps.push('profile');
    if (!phoneVerified) steps.push('phone');

    // Le KYC (Pièce d'identité) est requis pour tous. Dès le dépôt (EN_ATTENTE), l'action est débloquée.
    if (statutKyc === 'NON_VERIFIE' || statutKyc === 'REJETE' || statutKyc === 'A_RENOUVELER') {
      steps.push('kyc');
    } else if (statutKyc === 'SUSPENDU') {
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
