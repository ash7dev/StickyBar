'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Building2,
  ShieldCheck,
  Settings,
  Wallet,
} from 'lucide-react';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { GestionnaireParametresProfileCard } from '@/features/gestionnaire/components/GestionnaireParametresProfileCard';
import { GestionnaireParametresCoordonneesVirement } from '@/features/gestionnaire/components/GestionnaireParametresCoordonneesVirement';
import { GestionnaireParametresNotifications } from '@/features/gestionnaire/components/GestionnaireParametresNotifications';
import { GestionnaireParametresSecuriteKyc } from '@/features/gestionnaire/components/GestionnaireParametresSecuriteKyc';
import { cn } from '@/lib/utils/cn';

type TabKey = 'PROFIL' | 'VIREMENT' | 'NOTIFICATIONS' | 'SECURITE';

const TABS: { id: TabKey; label: string; icon: any }[] = [
  { id: 'PROFIL', label: 'Profil & Agence', icon: Building2 },
  { id: 'VIREMENT', label: 'Coordonnées & Virement', icon: Wallet },
  { id: 'NOTIFICATIONS', label: 'Alertes & Notifications', icon: Bell },
  { id: 'SECURITE', label: 'Sécurité & KYC', icon: ShieldCheck },
];

export default function GestionnaireParametresPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('PROFIL');
  const queryClient = useQueryClient();

  // Fetch real logged user profile
  const { data: user, isLoading, refetch } = useQuery<any>({
    queryKey: ['users', 'me'],
    queryFn: () => nestFetch<any>(NEST_API.USERS.ME),
  });

  return (
    <div className="space-y-8 pb-12">
      {/* ── 1. En-tête de la page ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground flex items-center gap-3">
            <Settings className="h-7 w-7 text-forest-600" aria-hidden="true" />
            <span>Paramètres Conciergerie</span>
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-medium">
            Configuration de votre agence, comptes de virement des commissions et préférences opérationnelles.
          </p>
        </div>
      </div>

      {/* ── 2. Barre d'onglets de navigation (Fond Clair & Sans Fond Sombre) ──── */}
      <div className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-neutral-100/70 p-1.5 overflow-x-auto max-w-full">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-pill transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-white text-forest-900 shadow-2xs border border-forest-200/80'
                  : 'text-foreground-muted hover:text-foreground hover:bg-neutral-200/50 border border-transparent',
              )}
            >
              <IconComponent className={cn('w-4 h-4 shrink-0', isActive ? 'text-forest-600' : 'text-foreground-muted')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Chargement Skeleton ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="rounded-card border border-border bg-background-card p-8 space-y-4 animate-pulse">
          <div className="h-6 bg-neutral-200 rounded w-1/3" />
          <div className="h-10 bg-neutral-100 rounded w-full" />
          <div className="h-10 bg-neutral-100 rounded w-full" />
        </div>
      )}

      {/* ── 4. Contenu des Onglets ──────────────────────────────────────────── */}
      {!isLoading && (
        <div className="space-y-6">
          {activeTab === 'PROFIL' && (
            <GestionnaireParametresProfileCard
              user={user}
              onProfileUpdated={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
              }}
            />
          )}

          {activeTab === 'VIREMENT' && <GestionnaireParametresCoordonneesVirement />}

          {activeTab === 'NOTIFICATIONS' && <GestionnaireParametresNotifications />}

          {activeTab === 'SECURITE' && <GestionnaireParametresSecuriteKyc user={user} />}
        </div>
      )}
    </div>
  );
}
