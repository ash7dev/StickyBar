import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../shared/api/api-client';
import { useRoleStore } from '../../../shared/stores/role.store';
import { useAuthStore } from '../stores/auth.store';
import { UserRole } from '../../../shared/contracts';

interface SwitchRoleResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  activeRole: UserRole;
}

export function useSwitchRole() {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeRole, setActiveRole } = useRoleStore();
  const { user, token, refreshToken, setSession } = useAuthStore();

  const switchRole = async (targetRole: UserRole): Promise<boolean> => {
    if (activeRole === targetRole) return true;

    try {
      setIsSwitching(true);
      setError(null);

      const res = await apiClient.post<SwitchRoleResponse>('/auth/switch-role', {
        role: targetRole,
      });

      const data = (res.data as any)?.data || res.data;

      if (data?.accessToken && data?.refreshToken) {
        // Stocker les nouveaux tokens d'accès/refresh (le rôle actif y est encodé)
        if (user) {
          await setSession(data.accessToken, data.refreshToken, {
            ...user,
            activeRole: data.activeRole || targetRole,
          });
        }
      }

      // Mettre à jour le store de rôle actif
      await setActiveRole(data?.activeRole || targetRole);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // Redirection selon le rôle cible
      if (targetRole === 'PROPRIETAIRE') {
        router.replace('/(owner)/dashboard' as any);
      } else if (targetRole === 'LOCATAIRE') {
        router.replace('/(tenant)' as any);
      }

      return true;
    } catch (err: any) {
      console.warn('[useSwitchRole] Erreur lors du changement de rôle :', err);
      const msg = err.response?.data?.message || 'Impossible de changer de rôle pour le moment.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return false;
    } finally {
      setIsSwitching(false);
    }
  };

  return {
    switchRole,
    isSwitching,
    error,
    activeRole,
  };
}
