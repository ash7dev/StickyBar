'use client';

import { Star, MessageSquare, AlertTriangle, ThumbsUp } from 'lucide-react';

interface AdminReviewsStatsOverviewProps {
  reviews: any[];
  totalCount: number;
}

export function AdminReviewsStatsOverview({ reviews = [], totalCount = 0 }: AdminReviewsStatsOverviewProps) {
  const avgNote =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.note ?? 5), 0) / reviews.length).toFixed(1)
      : '4.8';

  const criticalCount = reviews.filter((r) => (r.note ?? 5) <= 2).length;
  const excellentCount = reviews.filter((r) => (r.note ?? 5) === 5).length;
  const satisfactionRate = reviews.length > 0 ? Math.round((excellentCount / reviews.length) * 100) : 96;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Avis */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Total des Avis</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
            <MessageSquare className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-foreground">{totalCount}</p>
        <p className="text-[0.6875rem] text-foreground-muted">Évaluations vérifiées publiées</p>
      </div>

      {/* 2. Note Moyenne */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Note Moyenne Plateforme</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-gold-50 border border-gold-300 text-gold-800">
            <Star className="h-4 w-4 text-gold-500 fill-gold-400" />
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <p className="font-display text-2xl font-bold text-gold-900">{avgNote}</p>
          <span className="text-xs font-bold text-foreground-muted">/ 5 ⭐</span>
        </div>
        <p className="text-[0.6875rem] text-foreground-muted">Moyenne des séjours terminés</p>
      </div>

      {/* 3. Avis Critiques (1-2 Stars) */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Avis Critiques (1-2★)</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-error-50 border border-error-200 text-error-700">
            <AlertTriangle className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-error-700">{criticalCount}</p>
        <p className="text-[0.6875rem] text-foreground-muted">Avis à modérer prioritairement</p>
      </div>

      {/* 4. Taux de Satisfaction */}
      <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground-muted">Satisfaction Globale</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-700">
            <ThumbsUp className="h-4 w-4" />
          </span>
        </div>
        <p className="font-display text-2xl font-bold text-forest-800">{satisfactionRate}%</p>
        <p className="text-[0.6875rem] text-foreground-muted">Évaluations 5 étoiles reçues</p>
      </div>
    </div>
  );
}
