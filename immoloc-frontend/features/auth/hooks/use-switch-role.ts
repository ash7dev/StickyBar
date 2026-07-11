'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';

interface SwitchRoleResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  activeRole: 'LOCATAIRE' | 'PROPRIETAIRE' | 'ADMIN';
}

export function useSwitchRole() {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const { activeRole, setRole, estProprietaire, setSession, userId, hasAnnonce } = useRoleStore();

  const switchRole = async (targetRole: 'LOCATAIRE' | 'PROPRIETAIRE') => {
    if (!estProprietaire && targetRole === 'PROPRIETAIRE') {
      router.push('/become-host');
      return;
    }

    if (activeRole === targetRole) return;

    setIsSwitching(true);
    const previousRole = activeRole;

    // ── Optimistic Update ───────────────────────────────────────────────────
    setRole(targetRole);

    try {
      const result = await nestFetch<SwitchRoleResponse>(NEST_API.AUTH.SWITCH_ROLE, {
        method: 'POST',
        body: JSON.stringify({ role: targetRole }),
      });

      // Stocker les nouveaux tokens (le rôle est maintenant intégré dans le JWT)
      const currentStore = useRoleStore.getState();
      setSession({
        token: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        role: result.activeRole,
        estProprietaire: estProprietaire,
        userId: userId!,
        hasAnnonce: hasAnnonce,
        // Préserver les données gate/KYC existantes
        profileCompleted: currentStore.profileCompleted,
        phoneVerified: currentStore.phoneVerified,
        statutKyc: currentStore.statutKyc,
        dateNaissance: currentStore.dateNaissance,
        selfieFaceDetected: currentStore.selfieFaceDetected,
        selfieMatchScore: currentStore.selfieMatchScore,
      });

      // ── Redirection selon le rôle ──────────────────────────────────────────
      if (targetRole === 'PROPRIETAIRE') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
      
      router.refresh();
    } catch (error) {
      console.error('[useSwitchRole] Failed to switch role:', error);
      // ── Rollback en cas d'erreur ───────────────────────────────────────────
      setRole(previousRole);
      throw error;
    } finally {
      setIsSwitching(false);
    }
  };

  return {
    switchRole,
    isSwitching,
    activeRole,
  };
}
