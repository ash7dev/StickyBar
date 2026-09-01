'use client';

import Link from 'next/link';
import { Plus, UserPlus, ShieldCheck } from 'lucide-react';

interface Props {
  userPrenom?: string;
  userNom?: string;
}

export function GestionnaireHeaderBanner({ userPrenom = 'Gestionnaire', userNom = '' }: Props) {
  const todayStr = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="section-inverse relative overflow-hidden rounded-card p-6 sm:p-8 shadow-lg border border-border-inverse-strong">
      {/* Halo de raccord de fond */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-forest-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-inverse-strong bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-50 backdrop-blur-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-lime-400" aria-hidden="true" />
              <span>Conciergerie Partenaire Officielle</span>
            </span>
            <span className="eyebrow text-forest-200 capitalize">
              {todayStr}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.02em] text-neutral-50">
            Bonjour, {userPrenom} {userNom} 👋
          </h1>
          <p className="text-xs sm:text-sm text-forest-200 leading-relaxed font-normal">
            Supervisez votre parc immobilier délégué, gérez les arrivées et suivez le portefeuille de vos propriétaires en temps réel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/gestionnaire/annonces/nouvelle"
            className="btn-action inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold shadow-action hover:shadow-action-hover transition-all"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Publier un bien</span>
          </Link>

          <Link
            href="/gestionnaire/annonces/nouvelle"
            className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold text-neutral-50 transition-colors hover:bg-white/20 backdrop-blur-xs cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-lime-400" aria-hidden="true" />
            <span>Nouveau propriétaire</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
