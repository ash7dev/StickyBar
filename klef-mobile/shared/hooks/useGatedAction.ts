import { useState, useCallback } from 'react';
import { useAuthStore } from '../../features/auth/stores/auth.store';
import type { AuthUser } from '../contracts';

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
/** Étapes manquantes pour un utilisateur donné (règles identiques à l'API). */
export function missingSteps(user: AuthUser): { steps: GateStep[]; block: GateBlock } {
  const steps: GateStep[] = [];
  let block: GateBlock = null;

  // 1. Profil requis (Prénom et Nom au minimum, ou profileCompleted true)
  //    + date de naissance : l'API refuse la réservation sans elle (âge minimum du logement)
  const hasProfile =
    (Boolean(user.profileCompleted) || (Boolean(user.prenom) && Boolean(user.nom))) && Boolean(user.dateNaissance);
  if (!hasProfile) steps.push('profile');

  // 2. Téléphone vérifié (ou téléphone présent)
  if (user.phoneVerified === false || (!user.telephone && !user.phoneVerified)) steps.push('phone');

  // 3. KYC (Pièce d'identité)
  const statut = user.statutKyc;
  if (statut === 'NON_VERIFIE' || statut === 'REJETE' || statut === 'A_RENOUVELER') steps.push('kyc');
  else if (statut === 'SUSPENDU') block = 'kyc_suspended';

  return { steps, block };
}

/**
 * Protège une action sensible (réserver, publier…).
 * Le profil local peut être en retard sur le serveur (autre appareil, site web, KYC validé
 * entre-temps) : avant d'afficher une étape manquante, on relit le profil côté serveur.
 * Une étape n'est donc jamais demandée à tort.
 */
export function useGatedAction(onReady: () => void) {
  const [state, setState] = useState<GatedActionState>({
    open: false,
    steps: [],
    block: null,
  });
  const [checking, setChecking] = useState(false);

  const trigger = useCallback(async () => {
    const { user, token, refreshUser } = useAuthStore.getState();

    // Si pas de token ou d'utilisateur, le composant appelant doit rediriger vers login
    if (!token || !user) {
      onReady();
      return;
    }

    let result = missingSteps(user);
    if (result.steps.length > 0 || result.block) {
      setChecking(true);
      const fresh = await refreshUser();
      setChecking(false);
      if (fresh) result = missingSteps(fresh);
    }

    if (result.steps.length === 0 && result.block === null) {
      onReady();
    } else {
      setState({ open: true, ...result });
    }
  }, [onReady]);

  const complete = useCallback(() => {
    setState({ open: false, steps: [], block: null });
    onReady();
  }, [onReady]);

  const cancel = useCallback(() => {
    setState({ open: false, steps: [], block: null });
  }, []);

  return { gateState: state, checking, trigger, complete, cancel };
}
