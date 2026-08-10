'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Check,
  Eye,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { adminApi } from '@/lib/nestjs';

export interface PendingKycItem {
  id: string;
  prenom?: string;
  nom?: string;
  email?: string;
  creeLe?: string;
  dateSoumission?: string;
  typePiece?: string;
  numeroPiece?: string;
  urlPieceRecto?: string;
  urlPieceVerso?: string;
}

export interface PendingListingItem {
  id: string;
  titre: string;
  hoteNom?: string;
  ville?: string;
  adresse?: string;
  prixParNuit?: number;
  dateSoumission?: string;
  photos?: string[];
  type?: string;
  nbChambres?: number;
}

interface AdminModerationQueueProps {
  pendingKyc?: PendingKycItem[];
  pendingListings?: PendingListingItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function AdminModerationQueue({
  pendingKyc = [],
  pendingListings = [],
  isLoading = false,
  onRefresh,
}: AdminModerationQueueProps) {
  const [activeTab, setActiveTab] = useState<'kyc' | 'listings'>('kyc');

  // Loading states per item ID
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Inspection modal state
  const [inspectKycItem, setInspectKycItem] = useState<PendingKycItem | null>(null);
  const [inspectListingItem, setInspectListingItem] = useState<PendingListingItem | null>(null);

  // Rejection modal state
  const [rejectItem, setRejectItem] = useState<{ type: 'kyc' | 'listing'; id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Direct KYC Approval
  const handleApproveKyc = async (id: string) => {
    setProcessingId(id);
    try {
      await adminApi.verifyKyc(id);
      showToast("✅ Dossier KYC validé avec succès !");
      if (onRefresh) onRefresh();
    } catch {
      showToast("❌ Erreur lors de la validation du KYC.");
    } finally {
      setProcessingId(null);
      setInspectKycItem(null);
    }
  };

  // Direct Listing Publication
  const handleApproveListing = async (id: string) => {
    setProcessingId(id);
    try {
      await adminApi.publishListing(id);
      showToast("✅ Annonce publiée et mise en ligne avec succès !");
      if (onRefresh) onRefresh();
    } catch {
      showToast("❌ Erreur lors de la publication de l'annonce.");
    } finally {
      setProcessingId(null);
      setInspectListingItem(null);
    }
  };

  // Handle Rejection
  const handleConfirmRejection = async () => {
    if (!rejectItem || !rejectReason.trim()) return;
    setProcessingId(rejectItem.id);
    try {
      if (rejectItem.type === 'kyc') {
        await adminApi.rejectKyc(rejectItem.id, rejectReason.trim());
        showToast("Dossier KYC rejeté. Motif transmis à l'utilisateur.");
      } else {
        await adminApi.rejectListing(rejectItem.id, rejectReason.trim());
        showToast("Annonce rejetée. Motif transmis au propriétaire.");
      }
      if (onRefresh) onRefresh();
    } catch {
      showToast("Erreur lors du rejet.");
    } finally {
      setProcessingId(null);
      setRejectItem(null);
      setRejectReason('');
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-card border border-border bg-background-alt p-6" />
    );
  }

  return (
    <div className="rounded-card border border-border bg-background-card p-4 shadow-2xs sm:p-6 space-y-4 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 right-4 z-50 rounded-card border border-forest-300 bg-forest-950 px-4 py-2.5 text-xs font-semibold text-neutral-0 shadow-xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
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
              'flex items-center gap-1.5 rounded-pill px-3.5 py-1 text-xs font-semibold transition-all',
              activeTab === 'kyc'
                ? 'bg-forest-700 text-neutral-0 shadow-2xs'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <User className="h-3.5 w-3.5" />
            <span>KYC ({pendingKyc.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={cn(
              'flex items-center gap-1.5 rounded-pill px-3.5 py-1 text-xs font-semibold transition-all',
              activeTab === 'listings'
                ? 'bg-forest-700 text-neutral-0 shadow-2xs'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Annonces ({pendingListings.length})</span>
          </button>
        </div>
      </div>

      {/* List items & Empty States */}
      <div className="space-y-3">
        {activeTab === 'kyc' && (
          pendingKyc.length > 0 ? (
            pendingKyc.map((item) => {
              const fullName = item.prenom || item.nom ? `${item.prenom ?? ''} ${item.nom ?? ''}`.trim() : 'Utilisateur ImmoLoc';
              const isProcessing = processingId === item.id;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-inner border border-border bg-background-alt/40 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:border-forest-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* User avatar badge */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-100 border border-forest-200 text-forest-800 font-bold text-sm uppercase">
                      {fullName.slice(0, 2)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-xs font-bold text-foreground">
                          {fullName}
                        </p>
                        <span className="rounded-pill bg-forest-50 border border-forest-200 px-2 py-0.5 text-[0.625rem] font-bold text-forest-800 uppercase">
                          {item.typePiece || 'Pièce d’identité'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[0.75rem] text-foreground-muted">
                        {item.email || 'Email non renseigné'} · <span className="font-mono">{item.dateSoumission || 'Soumission récente'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectKycItem(item)}
                      className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                      <span>Inspecter</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApproveKyc(item.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-3 text-xs font-semibold text-neutral-0 hover:bg-forest-800 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Valider</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setRejectItem({ type: 'kyc', id: item.id, name: fullName })}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-inner border border-error-200 bg-error-50 text-error-700 hover:bg-error-100 transition-colors disabled:opacity-50"
                      title="Rejeter le dossier"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt/30">
              <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="text-xs font-bold text-foreground">Toutes les vérifications KYC sont à jour !</p>
              <p className="text-[0.75rem] text-foreground-muted">Aucun dossier d'identité en attente dans la file d'attente.</p>
            </div>
          )
        )}

        {activeTab === 'listings' && (
          pendingListings.length > 0 ? (
            pendingListings.map((item) => {
              const isProcessing = processingId === item.id;
              const formattedPrice = item.prixParNuit ? `${item.prixParNuit.toLocaleString('fr-FR')} FCFA/nuit` : 'Tarif non fixé';

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-inner border border-border bg-background-alt/40 p-3.5 sm:flex-row sm:items-center sm:justify-between hover:border-forest-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Listing Thumbnail or Icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner bg-sand-100 border border-sand-300 text-sand-800 font-bold text-sm">
                      <Building2 className="h-5 w-5 text-forest-700" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-xs font-bold text-foreground max-w-xs">{item.titre}</p>
                        <span className="rounded-pill bg-sand-50 border border-sand-200 px-2 py-0.5 text-[0.625rem] font-bold text-sand-900 uppercase">
                          {item.type || 'Logement'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[0.75rem] text-foreground-muted">
                        Hôte: <span className="font-semibold text-foreground">{item.hoteNom || 'Propriétaire'}</span> · {item.ville || 'Sénégal'} · <span className="font-mono font-bold text-forest-800">{formattedPrice}</span>
                      </p>
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectListingItem(item)}
                      className="inline-flex h-8 items-center gap-1 rounded-inner border border-border bg-background-card px-2.5 text-xs font-semibold text-foreground hover:bg-background-alt transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-foreground-muted" />
                      <span>Aperçu</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApproveListing(item.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-inner bg-forest-700 px-3 text-xs font-semibold text-neutral-0 hover:bg-forest-800 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      <span>Publier</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setRejectItem({ type: 'listing', id: item.id, name: item.titre })}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-inner border border-error-200 bg-error-50 text-error-700 hover:bg-error-100 transition-colors disabled:opacity-50"
                      title="Rejeter l'annonce"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 rounded-inner border border-dashed border-border bg-background-alt/30">
              <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-forest-50 border border-forest-200 text-forest-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="text-xs font-bold text-foreground">Toutes les annonces sont modérées !</p>
              <p className="text-[0.75rem] text-foreground-muted">Aucune nouvelle annonce en attente de révision.</p>
            </div>
          )
        )}
      </div>

      {/* ─── MODAL 1 : Inspection KYC ─────────────────────────────────────────────── */}
      {inspectKycItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-forest-700" /> Inspection Dossier KYC
              </h3>
              <button
                type="button"
                onClick={() => setInspectKycItem(null)}
                className="rounded-inner p-1 text-foreground-muted hover:bg-background-alt hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-inner border border-border bg-background-alt/50 p-3">
                <div>
                  <span className="text-[0.6875rem] text-foreground-muted block">Nom complet :</span>
                  <strong className="text-foreground">{inspectKycItem.prenom} {inspectKycItem.nom}</strong>
                </div>
                <div>
                  <span className="text-[0.6875rem] text-foreground-muted block">Type de pièce :</span>
                  <strong className="text-forest-800 uppercase">{inspectKycItem.typePiece || 'CNI'}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-[0.6875rem] text-foreground-muted block">Email :</span>
                  <strong className="text-foreground">{inspectKycItem.email || 'Non spécifié'}</strong>
                </div>
              </div>

              {/* Photos CNI */}
              <div className="space-y-2">
                <p className="font-bold text-foreground text-[0.6875rem] uppercase">Documents d'Identité Téléchargés :</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-inner border border-border bg-background-alt p-2 text-center">
                    <p className="text-[0.625rem] text-foreground-muted mb-1">Recto</p>
                    {inspectKycItem.urlPieceRecto ? (
                      <img src={inspectKycItem.urlPieceRecto} alt="Recto" className="h-28 w-full object-cover rounded-inner border border-border" />
                    ) : (
                      <div className="h-28 w-full flex items-center justify-center text-[0.625rem] text-foreground-muted bg-background-card rounded-inner">Recto disponible dans /admin/kyc</div>
                    )}
                  </div>

                  <div className="rounded-inner border border-border bg-background-alt p-2 text-center">
                    <p className="text-[0.625rem] text-foreground-muted mb-1">Verso</p>
                    {inspectKycItem.urlPieceVerso ? (
                      <img src={inspectKycItem.urlPieceVerso} alt="Verso" className="h-28 w-full object-cover rounded-inner border border-border" />
                    ) : (
                      <div className="h-28 w-full flex items-center justify-center text-[0.625rem] text-foreground-muted bg-background-card rounded-inner">Verso disponible dans /admin/kyc</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Link
                href="/admin/kyc"
                className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1"
              >
                <span>Ouvrir la page KYC complète</span> <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectKycItem(null)}
                  className="h-8 rounded-inner border border-border bg-background-card px-3 text-xs font-semibold text-foreground hover:bg-background-alt"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveKyc(inspectKycItem.id)}
                  className="h-8 rounded-inner bg-forest-700 px-4 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
                >
                  Approuver Maintenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2 : Inspection Annonce ─────────────────────────────────────────── */}
      {inspectListingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5 text-forest-700" /> Aperçu Rapide de l'Annonce
              </h3>
              <button
                type="button"
                onClick={() => setInspectListingItem(null)}
                className="rounded-inner p-1 text-foreground-muted hover:bg-background-alt hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-inner border border-border bg-background-alt/50 p-3 space-y-1.5">
                <p className="font-bold text-base text-foreground">{inspectListingItem.titre}</p>
                <div className="flex items-center gap-3 text-foreground-muted text-[0.75rem]">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-forest-700" /> {inspectListingItem.ville || 'Sénégal'}</span>
                  <span className="font-mono font-bold text-forest-800">{(inspectListingItem.prixParNuit ?? 0).toLocaleString('fr-FR')} FCFA/nuit</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-foreground-muted">
                <p>Propriétaire : <strong className="text-foreground">{inspectListingItem.hoteNom || 'Hôte ImmoLoc'}</strong></p>
                <p>Type : <strong className="text-foreground uppercase">{inspectListingItem.type || 'Appartement'}</strong></p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Link
                href="/admin/annonces"
                className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1"
              >
                <span>Voir sur la page Annonces</span> <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectListingItem(null)}
                  className="h-8 rounded-inner border border-border bg-background-card px-3 text-xs font-semibold text-foreground hover:bg-background-alt"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveListing(inspectListingItem.id)}
                  className="h-8 rounded-inner bg-forest-700 px-4 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
                >
                  Publier l'Annonce
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3 : Motif de Rejet ─────────────────────────────────────────────── */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-base font-bold text-error-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Rejet du Dossier : {rejectItem.name}
              </h3>
              <button
                type="button"
                onClick={() => { setRejectItem(null); setRejectReason(''); }}
                className="rounded-inner p-1 text-foreground-muted hover:bg-background-alt hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-foreground-muted">
                Veuillez indiquer le motif précis du rejet qui sera notifié au propriétaire :
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="ex: Document CNI illisible, photos floues ou non conformes..."
                className="w-full rounded-inner border border-border bg-background-card p-2.5 text-xs text-foreground focus:border-error-600 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => { setRejectItem(null); setRejectReason(''); }}
                className="h-8 rounded-inner border border-border bg-background-card px-3 text-xs font-semibold text-foreground hover:bg-background-alt"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={handleConfirmRejection}
                className="h-8 rounded-inner bg-error-600 px-4 text-xs font-semibold text-neutral-0 hover:bg-error-700 transition-colors disabled:opacity-50"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
