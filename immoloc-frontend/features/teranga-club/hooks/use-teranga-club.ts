'use client';

import { useEffect, useState } from 'react';
import { terangaClubApi, type TerangaAccountData, type TerangaQuest } from '@/lib/nestjs';
import { useRoleStore, isTokenExpired } from '@/stores/role.store';

export function useTerangaClub() {
  const hasHydrated = useRoleStore((state) => state.hasHydrated);
  const nestToken = useRoleStore((state) => state.nestToken);
  const tokenExpiresAt = useRoleStore((state) => state.tokenExpiresAt);

  // Authentifié uniquement si le store Zustand est réhydraté et que le token Nest est valide
  const isAuthenticated = hasHydrated && !!nestToken && !isTokenExpired(tokenExpiresAt);

  const [data, setData] = useState<TerangaAccountData | null>(null);
  const [quests, setQuests] = useState<TerangaQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [questsRes, accountRes] = await Promise.allSettled([
        terangaClubApi.getQuests(),
        isAuthenticated ? terangaClubApi.getMyAccount() : Promise.resolve(null),
      ]);

      if (questsRes.status === 'fulfilled') {
        setQuests(questsRes.value);
      }
      if (accountRes.status === 'fulfilled' && accountRes.value) {
        setData(accountRes.value);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasHydrated) return;
    loadData();
  }, [hasHydrated, isAuthenticated, nestToken]);

  return {
    data,
    quests,
    isLoading: !hasHydrated || isLoading,
    isAuthenticated,
    refetch: loadData,
  };
}
