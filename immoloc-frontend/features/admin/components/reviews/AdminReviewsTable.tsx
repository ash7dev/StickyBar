'use client';

import { Star, Trash2, Eye, User, Building2, MessageSquare, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ReviewItem {
  id: string;
  typeAvis?: string;
  note: number;
  commentaire: string;
  creeLe: string;
  auteur?: {
    id: string;
    prenom: string;
    nom: string;
    avatarUrl?: string | null;
  };
  cible?: {
    id: string;
    prenom: string;
    nom: string;
    avatarUrl?: string | null;
  };
  logement?: {
    id: string;
    titre: string;
    ville: string;
  };
}

interface AdminReviewsTableProps {
  reviews: ReviewItem[];
  isLoading: boolean;
  onInspectReview: (item: ReviewItem) => void;
  onDeleteReview: (item: ReviewItem) => void;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminReviewsTable({
  reviews,
  isLoading,
  onInspectReview,
  onDeleteReview,
}: AdminReviewsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-background-card p-12 text-center space-y-2">
        <MessageSquare className="h-10 w-10 text-foreground-muted mx-auto" />
        <h3 className="font-display text-base font-bold text-foreground">Aucun avis répertorié</h3>
        <p className="text-xs text-foreground-muted">Aucune évaluation ne correspond à vos filtres de recherche.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-background-card shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-background-alt/50 font-display text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted">
          <tr>
            <th className="py-3 px-4">Évaluation & Note</th>
            <th className="py-3 px-4">Auteur</th>
            <th className="py-3 px-4">Cible / Logement</th>
            <th className="py-3 px-4">Commentaire Publié</th>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4 text-right">Modération</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reviews.map((item) => {
            const isCritical = item.note <= 2;
            const authorName = item.auteur ? `${item.auteur.prenom} ${item.auteur.nom}` : "Utilisateur anonyme";

            return (
              <tr key={item.id} className="transition-colors hover:bg-background-alt/30">
                {/* Note & Star Rating */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < item.note ? "text-gold-500 fill-gold-400" : "text-border"
                          )}
                        />
                      ))}
                      <span className="font-bold text-foreground text-xs ml-1">{item.note}/5</span>
                    </div>

                    <div>
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-error-50 border border-error-200 px-2 py-0.5 text-[0.625rem] font-bold text-error-800">
                          <AlertTriangle className="h-3 w-3 text-error-600" /> Avis Critique
                        </span>
                      ) : item.note === 5 ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-gold-50 border border-gold-300 px-2 py-0.5 text-[0.625rem] font-bold text-gold-900">
                          <CheckCircle2 className="h-3 w-3 text-gold-600" /> Excellent (5★)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-background-alt border border-border px-2 py-0.5 text-[0.625rem] font-semibold text-foreground-muted">
                          Évaluation ordinaire
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Auteur */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-100 text-forest-800 font-bold text-[0.6875rem] uppercase">
                      {authorName.slice(0, 2)}
                    </div>
                    <span className="font-bold text-foreground">{authorName}</span>
                  </div>
                </td>

                {/* Cible / Logement */}
                <td className="py-4 px-4">
                  <div className="space-y-0.5 max-w-xs">
                    {item.logement ? (
                      <p className="font-bold text-foreground flex items-center gap-1 truncate">
                        <Building2 className="h-3.5 w-3.5 text-forest-700 shrink-0" />
                        {item.logement.titre} ({item.logement.ville})
                      </p>
                    ) : item.cible ? (
                      <p className="font-bold text-foreground flex items-center gap-1 truncate">
                        <User className="h-3.5 w-3.5 text-forest-700 shrink-0" />
                        Avis sur : {item.cible.prenom} {item.cible.nom}
                      </p>
                    ) : (
                      <span className="text-foreground-muted">—</span>
                    )}
                  </div>
                </td>

                {/* Commentaire */}
                <td className="py-4 px-4">
                  <p className="text-xs text-foreground leading-relaxed max-w-md line-clamp-2 italic">
                    « {item.commentaire} »
                  </p>
                </td>

                {/* Date */}
                <td className="py-4 px-4 font-mono text-foreground-muted">
                  {formatDate(item.creeLe)}
                </td>

                {/* Actions Modération */}
                <td className="py-4 px-4 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInspectReview(item)}
                      className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-foreground-muted" /> Inspecter
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteReview(item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-inner border border-error-200 bg-error-50 px-3 text-xs font-semibold text-error-700 hover:bg-error-100 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
