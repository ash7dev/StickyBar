'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Building2, Check, ArrowRight, Eye, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface PendingKycItem {
  id: string;
  prenom?: string;
  nom?: string;
  email?: string;
  creeLe?: string;
  dateSoumission?: string;
  typePiece?: string;
}

export interface PendingListingItem {
  id: string;
  titre: string;
  hoteNom?: string;
  ville?: string;
  prixParNuit?: number;
  dateSoumission?: string;
}

interface AdminModerationQueueProps {
  pendingKyc?: PendingKycItem[];
  pendingListings?: PendingListingItem[];
  isLoading?: boolean;
}

export function AdminModerationQueue({
  pendingKyc = [],
  pendingListings = [],
  isLoading = false,
}: AdminModerationQueueProps) {
  const [activeTab, setActiveTab] = useState<'kyc' | 'listings'>('kyc');

  if (isLoading) {
    return (
      <div className="h-52 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-xs sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-purple-50 border border-purple-200 text-purple-800">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              File d'Attente de Modération Rapide
            </h2>
            <p className="text-xs text-foreground-muted">
              Approbation directe des dossiers d'identité KYC et des nouvelles annonces
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center rounded-pill border border-border bg-background-alt p-1">
          <button
            type="button"
            onClick={() => setActiveTab('kyc')}
            className={cn(
              'flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold transition-colors',
              activeTab === 'kyc' ? 'bg-background-card text-purple-800 shadow-2xs' : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <User className="h-3.5 w-3.5" />
            <span>KYC ({pendingKyc.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={cn(
              'flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold transition-colors',
              activeTab === 'listings' ? 'bg-background-card text-forest-800 shadow-2xs' : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Annonces ({pendingListings.length})</span>
          </button>
        </div>
      </div>

      {/* List items & Empty States */}
      <div className="space-y-2.5">
        {activeTab === 'kyc' && (
          pendingKyc.length > 0 ? (
            pendingKyc.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-inner border border-border bg-background-alt/50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {item.prenom || item.nom ? `${item.prenom ?? ''} ${item.nom ?? ''}`.trim() : 'Utilisateur'}
                    </p>
                    <span className="rounded-pill bg-purple-50 border border-purple-200 px-2 py-0.5 text-[0.625rem] font-bold text-purple-800 uppercase">
                      {item.typePiece || 'Pièce d’identité'}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.75rem] text-foreground-muted">
                    {item.email || 'Email non spécifié'} · {item.dateSoumission || 'Soumission récente'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/kyc`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-inner border border-border bg-background-card px-3 text-[0.75rem] font-semibold text-foreground hover:bg-background-alt"
                  >
                    <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                    <span>Inspecter</span>
                  </Link>
                  <Link
                    href={`/admin/kyc`}
                    className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-3 text-[0.75rem] font-semibold text-neutral-0 hover:bg-forest-800"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Valider</span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt/30">
              <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-foreground">Toutes les vérifications KYC sont à jour !</p>
              <p className="text-[0.75rem] text-foreground-muted">Aucun dossier d'identité en attente dans la file.</p>
            </div>
          )
        )}

        {activeTab === 'listings' && (
          pendingListings.length > 0 ? (
            pendingListings.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-inner border border-border bg-background-alt/50 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-semibold text-foreground">{item.titre}</p>
                  </div>
                  <p className="mt-0.5 truncate text-[0.75rem] text-foreground-muted">
                    Hôte: {item.hoteNom || 'Propriétaire'} · {item.ville || 'Sénégal'} · <span className="font-semibold text-foreground">{(item.prixParNuit ?? 0).toLocaleString('fr-FR')} FCFA/nuit</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/annonces`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-inner border border-border bg-background-card px-3 text-[0.75rem] font-semibold text-foreground hover:bg-background-alt"
                  >
                    <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                    <span>Aperçu</span>
                  </Link>
                  <Link
                    href={`/admin/annonces`}
                    className="inline-flex h-8 items-center gap-1 rounded-inner bg-action px-3 text-[0.75rem] font-semibold text-on-action hover:bg-action-hover"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Publier</span>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt/30">
              <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="text-xs font-semibold text-foreground">Toutes les annonces sont modérées !</p>
              <p className="text-[0.75rem] text-foreground-muted">Aucune nouvelle annonce en attente de révision.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
