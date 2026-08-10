'use client';

import { useState } from 'react';
import { X, Trash2, AlertTriangle, Star } from 'lucide-react';
import { ReviewItem } from './AdminReviewsTable';

interface AdminReviewDeleteModalProps {
  review: ReviewItem | null;
  isOpen: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirmDelete: (review: ReviewItem) => void;
}

export function AdminReviewDeleteModal({
  review,
  isOpen,
  isDeleting = false,
  onClose,
  onConfirmDelete,
}: AdminReviewDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !review) return null;

  const loading = isSubmitting || isDeleting;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmDelete(review);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-error-50 border border-error-200 text-error-700">
              <Trash2 className="h-5 w-5" />
            </span>
            <h3 className="font-display text-base font-bold text-foreground">Suppression de l'Avis</h3>
          </div>
          <button type="button" onClick={onClose} disabled={loading} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-inner border border-border bg-background-alt/40 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="font-bold text-foreground">Note :</span>
            <span className="font-bold text-gold-600 flex items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-gold-400" /> {review.note}/5
            </span>
          </div>
          <p className="text-foreground-muted italic leading-relaxed">« {review.commentaire} »</p>
        </div>

        <div className="rounded-inner border border-warning-200 bg-warning-50 p-3 text-xs text-warning-900 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-600 mt-0.5" />
          <span>Cette action supprimera définitivement cet avis. La note moyenne globale du logement ou du profil hôte sera automatiquement recalculée par le serveur.</span>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-3 text-xs">
          <button type="button" onClick={onClose} disabled={loading} className="h-9 rounded-inner border border-border bg-background-card px-4 font-semibold text-foreground hover:bg-background-alt disabled:opacity-50">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="h-9 rounded-inner bg-error-700 px-4 font-semibold text-neutral-0 hover:bg-error-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Suppression..." : "Confirmer la suppression"}
          </button>
        </div>
      </div>
    </div>
  );
}
