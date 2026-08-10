'use client';

import { Star, X, User, Building2, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ReviewItem } from './AdminReviewsTable';

interface AdminReviewDetailModalProps {
  review: ReviewItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleteRequest: (review: ReviewItem) => void;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function AdminReviewDetailModal({
  review,
  isOpen,
  onClose,
  onDeleteRequest,
}: AdminReviewDetailModalProps) {
  if (!isOpen || !review) return null;

  const isCritical = review.note <= 2;
  const authorName = review.auteur ? `${review.auteur.prenom} ${review.auteur.nom}` : "Utilisateur anonyme";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-bold text-foreground">Détail de l'Avis Modéré</h3>
            {isCritical && (
              <span className="rounded-pill bg-error-50 border border-error-200 px-2 py-0.5 text-[0.625rem] font-bold text-error-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Critique
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-inner p-1 text-foreground-muted hover:bg-background-alt hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Note & Star Rating */}
        <div className="rounded-inner border border-border bg-background-alt/50 p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-5 w-5",
                    i < review.note ? "text-gold-500 fill-gold-400" : "text-border"
                  )}
                />
              ))}
            </div>
            <p className="text-xs font-bold text-foreground">{review.note} sur 5 étoiles</p>
          </div>

          <div className="text-right font-mono text-xs text-foreground-muted">
            <p className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-forest-700" /> {formatDate(review.creeLe)}</p>
          </div>
        </div>

        {/* Comment Content */}
        <div className="space-y-1.5">
          <label className="font-bold text-foreground uppercase tracking-wider text-[0.6875rem]">Commentaire Intégral :</label>
          <div className="rounded-inner border border-border bg-background-card p-4 text-xs font-medium text-foreground leading-relaxed italic">
            « {review.commentaire} »
          </div>
        </div>

        {/* Auteur & Cible */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-inner border border-border bg-background-alt p-3 space-y-1">
            <span className="text-[0.6875rem] text-foreground-muted font-bold block uppercase">Rédigé par :</span>
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <User className="h-4 w-4 text-forest-700" />
              {authorName}
            </p>
          </div>

          <div className="rounded-inner border border-border bg-background-alt p-3 space-y-1">
            <span className="text-[0.6875rem] text-foreground-muted font-bold block uppercase">Concerne :</span>
            {review.logement ? (
              <p className="font-bold text-foreground flex items-center gap-1.5 truncate">
                <Building2 className="h-4 w-4 text-forest-700 shrink-0" />
                {review.logement.titre}
              </p>
            ) : review.cible ? (
              <p className="font-bold text-foreground flex items-center gap-1.5 truncate">
                <User className="h-4 w-4 text-forest-700 shrink-0" />
                {review.cible.prenom} {review.cible.nom}
              </p>
            ) : (
              <span className="text-foreground-muted">—</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt"
          >
            Fermer
          </button>

          <button
            type="button"
            onClick={() => { onClose(); onDeleteRequest(review); }}
            className="inline-flex h-9 items-center gap-1.5 rounded-inner bg-error-600 px-4 text-xs font-semibold text-neutral-0 hover:bg-error-700 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Supprimer cet avis
          </button>
        </div>
      </div>
    </div>
  );
}
