'use client';

import { useState, useCallback } from 'react';
import { useActionGate } from '@/hooks/use-action-gate';
import type { GateStep, GateBlock } from '@/hooks/use-action-gate';

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
    if (gate.isReady) {
      onReady();
    } else {
      setState({ open: true, steps: gate.steps, block: gate.block });
    }
  }, [gate, onReady]);

  const complete = useCallback(() => {
    setState({ open: false, steps: [], block: null });
    onReady();
  }, [onReady]);

  const cancel = useCallback(() => {
    setState({ open: false, steps: [], block: null });
  }, []);

  return { gateState: state, trigger, complete, cancel };
}
