'use client';

import { TerangaClubHeader } from '@/features/teranga-club/components/TerangaClubHeader';
import { TerangaTierProgressCard } from '@/features/teranga-club/components/TerangaTierProgressCard';
import { TerangaPerksGrid } from '@/features/teranga-club/components/TerangaPerksGrid';
import { TerangaSimulatorCard } from '@/features/teranga-club/components/TerangaSimulatorCard';
import { TerangaTiersComparison } from '@/features/teranga-club/components/TerangaTiersComparison';
import { TerangaQuestsCard } from '@/features/teranga-club/components/TerangaQuestsCard';
import { TerangaReferralCard } from '@/features/teranga-club/components/TerangaReferralCard';
import { TerangaHistoryCard } from '@/features/teranga-club/components/TerangaHistoryCard';
import { useTerangaClub } from '@/features/teranga-club/hooks/use-teranga-club';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TerangaClubPage() {
  const { data, quests, isLoading, isAuthenticated, refetch } = useTerangaClub();

  return (
    <main className="bg-canvas min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Fil d'Ariane / Retour */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l’accueil</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <span className="font-semibold text-foreground">Klef Teranga Club</span>
            <span>•</span>
            <span className="font-bold text-forest-700 dark:text-lime-300">1 Coin = 1 FCFA</span>
          </div>
        </div>

        {/* 1. Header principal (Hero déconnecté / Dashboard personnalisé connecté) */}
        <TerangaClubHeader data={data} isAuthenticated={isAuthenticated} isLoading={isLoading} />

        {/* 2. Suivi personnalisé pas à pas de la qualification */}
        <TerangaTierProgressCard data={data} isAuthenticated={isAuthenticated} />

        {/* 3. Les 3 piliers du programme de fidélité */}
        <TerangaPerksGrid data={data} isAuthenticated={isAuthenticated} />

        {/* 4. Simulateur d'économies interactif en FCFA */}
        <TerangaSimulatorCard cashbackPct={data?.cashbackPct ?? 1.5} />

        {/* 5. Tableau comparatif des 3 Grades (Bronze, Silver, Gold) */}
        <TerangaTiersComparison data={data} />

        {/* 6. Quêtes interactives & Badges de la communauté */}
        <TerangaQuestsCard
          quests={quests}
          isAuthenticated={isAuthenticated}
          onClaimSuccess={refetch}
          userId={data?.id}
        />

        {/* 6.5. Super Parrain Teranga — Programme de parrainage */}
        <TerangaReferralCard
          isAuthenticated={isAuthenticated}
          codeParrainageFallback={data?.codeParrainage}
        />

        {/* 7. Historique des transactions */}
        <TerangaHistoryCard transactions={data?.transactions || []} />
      </div>
    </main>
  );
}
