'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Building2,
  MapPin,
  User,
  Star,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Bed,
  Bath,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Loader2,
  Zap,
  Clock,
  Video,
  Wifi,
  Key,
  FileText,
  Percent,
  Home,
  Compass,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { LogementCatalogItem } from './AdminLogementsTable';
import { adminApi } from '@/lib/nestjs';
import { cn } from '@/lib/utils/cn';

interface AdminLogementDetailModalProps {
  listing: LogementCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onPublish: (listing: LogementCatalogItem) => void;
  onReject: (listing: LogementCatalogItem) => void;
  onSuspend: (listing: LogementCatalogItem) => void;
  onUnsuspend: (listing: LogementCatalogItem) => void;
}

function formatPrice(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminLogementDetailModal({
  listing,
  isOpen,
  onClose,
  onPublish,
  onReject,
  onSuspend,
  onUnsuspend,
}: AdminLogementDetailModalProps) {
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    if (!listing?.id || !isOpen) {
      setDetails(null);
      setSelectedPhotoIndex(0);
      return;
    }
    setIsLoading(true);
    adminApi.getListingDetails(listing.id)
      .then((data) => setDetails(data))
      .catch(() => setDetails(null))
      .finally(() => setIsLoading(false));
  }, [listing?.id, isOpen]);

  if (!isOpen || !listing) return null;

  const data = details ?? listing;
  const prop = data.proprietaire;
  const photos: Array<{ id: string; url: string; estPrincipale?: boolean; categorie?: string }> = data.photos ?? [];
  const activePhotoUrl = photos[selectedPhotoIndex]?.url ?? photos[0]?.url;
  const equipements: Array<{ equipement: { id: string; nom: string; categorie?: string } }> = data.equipements ?? [];
  const tarifsPersonnes: Array<{ personnesMin: number; personnesMax: number; supplement: number | string }> = data.tarifsPersonnes ?? [];
  const tarifsNuits: Array<{ nuitsMin: number; nuitsMax?: number | null; prix: number | string }> = data.tarifsNuits ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-card border border-border bg-background-card p-6 shadow-2xl space-y-6">
        
        {/* En-tête principal avec badges de statut */}
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-inner bg-forest-50 border border-forest-200 text-forest-800 shadow-2xs">
              <Building2 className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold text-foreground">
                  {data.titre}
                </h2>
                {data.sousType && (
                  <span className="rounded-pill border border-border bg-background-alt px-2.5 py-0.5 text-xs font-semibold text-foreground-muted">
                    {data.sousType}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground-muted flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-forest-600 shrink-0" />
                <span>{data.adresse ? `${data.adresse}, ` : ""}{data.ville} {data.quartier ? `(${data.quartier})` : ""}</span>
                <span className="font-bold text-foreground">• {data.type}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start">
            <button type="button" onClick={onClose} className="rounded-inner p-1.5 text-foreground-muted hover:bg-background-alt hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
            <p className="text-xs text-foreground-muted">Chargement du dossier 360° du logement...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Badges de Statuts et Options */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-xs font-bold",
                data.statut === 'PUBLISHED' && "bg-forest-50 border-forest-200 text-forest-800",
                data.statut === 'PENDING_REVIEW' && "bg-warning-50 border-warning-200 text-warning-800",
                data.statut === 'SUSPENDED' && "bg-error-50 border-error-200 text-error-800",
                data.statut === 'REJECTED' && "bg-error-50 border-error-200 text-error-800",
                data.statut === 'DRAFT' && "bg-background-alt border-border text-foreground-muted",
              )}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Statut : {data.statut}
              </span>

              {data.isInstantBooking && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-forest-300 bg-forest-50 px-3 py-1 text-xs font-bold text-forest-900">
                  <Zap className="h-3.5 w-3.5 text-forest-600" /> Réservation Instantanée
                </span>
              )}

              {data.isFeatured && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-gold-300 bg-gold-50 px-3 py-1 text-xs font-bold text-gold-900">
                  <Sparkles className="h-3.5 w-3.5 text-gold-600" /> En Vedette (Sponsorisé)
                </span>
              )}

              {data.derniereMinuteActive && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
                  <Clock className="h-3.5 w-3.5 text-blue-600" /> Offre Dernière Minute Active
                </span>
              )}

              {data.nbNonConformitesAnnonce > 0 && (
                <span className="inline-flex items-center gap-1 rounded-pill border border-error-300 bg-error-50 px-3 py-1 text-xs font-bold text-error-900">
                  <AlertTriangle className="h-3.5 w-3.5 text-error-600" /> {data.nbNonConformitesAnnonce} Signalement(s)
                </span>
              )}
            </div>

            {/* 1. Galerie Photo Interactive & Média */}
            {photos.length > 0 ? (
              <div className="space-y-3">
                <div className="relative h-72 w-full overflow-hidden rounded-card border border-border bg-background-alt">
                  {activePhotoUrl && (
                    <img src={activePhotoUrl} alt={data.titre} className="h-full w-full object-cover" />
                  )}
                  {data.videoUrl && (
                    <a
                      href={data.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-pill border border-neutral-0/30 bg-forest-950/80 px-3 py-1.5 text-xs font-semibold text-neutral-0 backdrop-blur-xs hover:bg-forest-900"
                    >
                      <Video className="h-4 w-4" /> Voir la vidéo / visite virtuelle
                    </a>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {photos.map((p, idx) => (
                      <button
                        key={p.id ?? idx}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={cn(
                          "relative h-16 w-24 shrink-0 overflow-hidden rounded-inner border transition-all",
                          selectedPhotoIndex === idx ? "border-forest-600 ring-2 ring-forest-500/40" : "border-border opacity-70 hover:opacity-100",
                        )}
                      >
                        <img src={p.url} alt="" className="h-full w-full object-cover" />
                        {p.estPrincipale && (
                          <span className="absolute top-1 left-1 rounded-pill bg-forest-800/90 px-1.5 py-0.5 text-[0.5625rem] font-bold text-neutral-0">
                            Couverture
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-card border border-dashed border-border bg-background-alt p-8 text-center text-xs text-foreground-muted">
                Aucune photo ajoutée pour ce logement.
              </div>
            )}

            {/* 2. Cartes Synthétiques des Caractéristiques & Tarifs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-forest-600" /> Tarif & Acompte
                </p>
                <p className="font-display text-base font-bold text-foreground">{formatPrice(data.prixBase)} <span className="text-[0.6875rem] font-normal text-foreground-muted">/ nuit</span></p>
                <p className="text-[0.6875rem] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-pill inline-block border border-purple-200">
                  Acompte : {data.acomptePourcentage ?? 30}% ({formatPrice((Number(data.prixBase ?? 0) * (data.acomptePourcentage ?? 30)) / 100)})
                </p>
              </div>

              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                  <Home className="h-3.5 w-3.5 text-blue-600" /> Composition
                </p>
                <p className="text-xs font-bold text-foreground">
                  {data.nombrePieces ?? 1} pièces | {data.nombreChambres ?? 1} ch. | {data.nombreSallesBain ?? 1} sdb
                </p>
                <p className="text-[0.6875rem] text-foreground-muted">
                  Capacité max : <span className="font-bold text-foreground">{data.capaciteMax ?? 1} voyageurs</span> {data.surface ? `(${data.surface} m²)` : ""}
                </p>
              </div>

              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" /> Exigences Séjour
                </p>
                <p className="text-xs font-bold text-foreground">Min {data.nuitesMinimum ?? 1} nuitée(s)</p>
                <p className="text-[0.6875rem] text-foreground-muted">Âge min réservant : <span className="font-bold text-foreground">{data.ageMin ?? 18} ans</span></p>
              </div>

              <div className="rounded-inner border border-border bg-background-alt/40 p-4 space-y-1">
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-gold-500 fill-gold-400" /> Activité & Notes
                </p>
                <p className="text-xs font-bold text-foreground">{data.totalSejours ?? 0} séjour(s) réalisé(s)</p>
                <p className="text-[0.6875rem] text-foreground-muted">Note : <span className="font-bold text-foreground">{Number(data.note ?? 0).toFixed(1)} / 5</span> ({data.totalAvis ?? 0} avis)</p>
              </div>
            </div>

            {/* 3. Profil Détaillé de l'Hôte Propriétaire */}
            <div className="rounded-card border border-border bg-background-card p-4 space-y-3 shadow-2xs">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 text-purple-600" /> Propriétaire & Fiche Hôte
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Nom & Prénom :</p>
                  <p className="font-bold text-foreground">{prop?.prenom} {prop?.nom}</p>
                </div>
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Email :</p>
                  <p className="font-bold text-foreground">{prop?.email}</p>
                </div>
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Téléphone :</p>
                  <p className="font-bold text-foreground">{prop?.telephone ?? "—"}</p>
                </div>
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Statut KYC Hôte :</p>
                  <span className="inline-flex items-center gap-1 font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-pill border border-forest-200 text-[0.6875rem] mt-0.5">
                    {prop?.statutKyc ?? "NON_VERIFIE"}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Géolocalisation & Adresse */}
            <div className="rounded-card border border-border bg-background-card p-4 space-y-2">
              <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-forest-600" /> Localisation & Adresse Exacte
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Adresse physique :</p>
                  <p className="font-bold text-foreground">{data.adresse}</p>
                </div>
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Ville / Quartier :</p>
                  <p className="font-bold text-foreground">{data.ville} {data.quartier ? `(${data.quartier})` : ""}</p>
                </div>
                <div>
                  <p className="text-foreground-muted text-[0.6875rem]">Coordonnées GPS :</p>
                  <p className="font-mono text-[0.6875rem] font-semibold text-foreground">
                    {data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Tarifs Dégressifs / Suppléments par Personne */}
            {(tarifsPersonnes.length > 0 || tarifsNuits.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tarifsPersonnes.length > 0 && (
                  <div className="rounded-card border border-border bg-background-card p-4 space-y-2">
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-600" /> Suppléments par personne
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {tarifsPersonnes.map((tp, idx) => (
                        <div key={idx} className="flex justify-between border-b border-border pb-1">
                          <span className="text-foreground-muted">{tp.personnesMin} à {tp.personnesMax} personnes :</span>
                          <span className="font-bold text-foreground">+{formatPrice(Number(tp.supplement))} / nuit</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tarifsNuits.length > 0 && (
                  <div className="rounded-card border border-border bg-background-card p-4 space-y-2">
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Percent className="h-4 w-4 text-purple-600" /> Tarification Dégressive par Durée
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      {tarifsNuits.map((tn, idx) => (
                        <div key={idx} className="flex justify-between border-b border-border pb-1">
                          <span className="text-foreground-muted">Dès {tn.nuitsMin} nuit(s){tn.nuitsMax ? ` jusqu'à ${tn.nuitsMax}` : ''} :</span>
                          <span className="font-bold text-forest-800">{formatPrice(Number(tn.prix))} / nuit</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Livret d'Accueil Digital & Wi-Fi */}
            {(data.instructionsAcces || data.instructionsDigicode || data.nomReseauWifi || data.reglesMaison) && (
              <div className="rounded-card border border-border bg-background-card p-4 space-y-3">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-amber-600" /> Livret d'Accueil & Consignes d'Accès
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {data.nomReseauWifi && (
                    <div className="p-3 rounded-inner border border-border bg-background-alt/40 space-y-0.5">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <Wifi className="h-3.5 w-3.5 text-blue-600" /> Accès Wi-Fi
                      </p>
                      <p className="text-foreground-muted text-[0.6875rem]">Réseau : <span className="font-semibold text-foreground">{data.nomReseauWifi}</span></p>
                      <p className="text-foreground-muted text-[0.6875rem]">Code : <span className="font-mono font-semibold text-foreground">{data.codeWifi ?? "—"}</span></p>
                    </div>
                  )}

                  {data.instructionsDigicode && (
                    <div className="p-3 rounded-inner border border-border bg-background-alt/40 space-y-0.5">
                      <p className="font-bold text-foreground flex items-center gap-1">
                        <Key className="h-3.5 w-3.5 text-amber-600" /> Digicode / Serrure
                      </p>
                      <p className="text-foreground-muted text-[0.6875rem]">Code : <span className="font-mono font-semibold text-foreground">{data.instructionsDigicode}</span></p>
                    </div>
                  )}
                </div>

                {data.instructionsAcces && (
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-[0.6875rem]">Instructions d'arrivée :</p>
                    <p className="text-xs text-foreground-muted bg-background-alt/30 p-2.5 rounded-inner border border-border">{data.instructionsAcces}</p>
                  </div>
                )}

                {data.reglesMaison && (
                  <div className="space-y-1">
                    <p className="font-bold text-foreground text-[0.6875rem]">Règles de la maison :</p>
                    <p className="text-xs text-foreground-muted bg-background-alt/30 p-2.5 rounded-inner border border-border">{data.reglesMaison}</p>
                  </div>
                )}
              </div>
            )}

            {/* 7. Motif de Rejet / Suspension (si applicable) */}
            {data.rejectionReason && (
              <div className="rounded-card border border-error-300 bg-error-50 p-4 space-y-1">
                <p className="font-display text-xs font-bold uppercase tracking-wider text-error-900 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-error-700" /> Motif Officiel du Rejet / Suspension
                </p>
                <p className="text-xs text-error-900 leading-relaxed font-semibold">{data.rejectionReason}</p>
              </div>
            )}

            {/* 8. Équipements & Services */}
            {equipements.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Équipements & Prestations Référencées ({equipements.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {equipements.map((eq) => (
                    <span key={eq.equipement?.id ?? eq.equipement?.nom} className="rounded-pill border border-border bg-background-alt px-3 py-1 text-xs font-semibold text-foreground">
                      {eq.equipement?.nom}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions Administrateur */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="h-9 rounded-inner border border-border bg-background-card px-4 text-xs font-semibold text-foreground hover:bg-background-alt">
            Fermer le dossier
          </button>

          {data.statut === 'PENDING_REVIEW' && (
            <>
              <button
                type="button"
                onClick={() => { onClose(); onReject(listing); }}
                className="h-9 rounded-inner border border-error-200 bg-error-50 px-4 text-xs font-semibold text-error-700 hover:bg-error-100"
              >
                Rejeter l'annonce
              </button>

              <button
                type="button"
                onClick={() => { onClose(); onPublish(listing); }}
                className="h-9 rounded-inner bg-forest-700 px-5 text-xs font-semibold text-neutral-0 hover:bg-forest-800"
              >
                Valider & Publier l'annonce
              </button>
            </>
          )}

          {data.statut === 'PUBLISHED' && (
            <button
              type="button"
              onClick={() => { onClose(); onSuspend(listing); }}
              className="h-9 rounded-inner border border-error-200 bg-error-50 px-4 text-xs font-semibold text-error-700 hover:bg-error-100"
            >
              Suspendre le logement
            </button>
          )}

          {data.statut === 'SUSPENDED' && (
            <button
              type="button"
              onClick={() => { onClose(); onUnsuspend(listing); }}
              className="h-9 rounded-inner border border-forest-300 bg-forest-50 px-4 text-xs font-semibold text-forest-800 hover:bg-forest-100"
            >
              Réactiver le bien
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
