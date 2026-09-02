'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Droplets,
  FileCheck,
  Hash,
  Home,
  LogIn,
  LogOut,
  MapPin,
  MessageSquareText,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/* ────────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────────── */

export interface InspectionReportItem {
  id: string;
  code: string;
  type: 'CHECKIN' | 'CHECKOUT';
  logementTitre: string;
  logementVille: string;
  logementAdresse?: string;
  ownerName: string;
  travelerName: string;
  travelerPhone?: string;
  dateInspection: string;
  statut: 'VALIDE' | 'EN_ATTENTE' | 'LITIGE';
  regimeElectricite?: string;
  releveCompteur?: string;
  photosCount: number;
  photosUrls?: string[];
  photosByCategory?: Record<string, string[]>;
  remarques?: string;
}

interface Props {
  report: InspectionReportItem | null;
  isOpen: boolean;
  onClose: () => void;
}

/* ────────────────────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────────────────────── */

const CATEGORY_META: Record<string, { label: string; icon: typeof Home }> = {
  SALON: { label: 'Salon & Séjour', icon: Home },
  CUISINE: { label: 'Cuisine & Équipements', icon: Home },
  CHAMBRE: { label: 'Chambres & Literie', icon: Home },
  SALLE_DE_BAIN: { label: 'Salle de bain', icon: Droplets },
  ENTREE: { label: 'Entrée & Digicode', icon: Home },
  TERRASSE: { label: 'Terrasse & Extérieur', icon: Home },
  COMPTEUR: { label: 'Compteurs', icon: Zap },
};

/* ────────────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────────────── */

export function GestionnaireInspectionDetailModal({ report, isOpen, onClose }: Props) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>('ALL');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) setSelectedPhoto(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, selectedPhoto, onClose]);

  // Reset state when report changes
  useEffect(() => {
    setActiveCat('ALL');
    setSelectedPhoto(null);
  }, [report?.id]);

  if (!isOpen || !report) return null;

  const isCheckin = report.type === 'CHECKIN';

  // Photos réelles transmises depuis la base de données (zéro photos d'illustration Unsplash)
  const realPhotosUrls = report.photosUrls || [];
  const photosByCategory: Record<string, string[]> = report.photosByCategory || (
    realPhotosUrls.length > 0 ? { INSPECTION: realPhotosUrls } : {}
  );

  const categoryKeys = Object.keys(photosByCategory);

  const visiblePhotos: { url: string; cat: string; index: number }[] =
    activeCat === 'ALL'
      ? categoryKeys.flatMap((cat) =>
          (photosByCategory[cat] || []).map((url, i) => ({ url, cat, index: i })),
        )
      : (photosByCategory[activeCat] || []).map((url, i) => ({ url, cat: activeCat, index: i }));

  const totalPhotos = Object.values(photosByCategory).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal Container ───────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 pointer-events-none">
        <div
          className="relative w-full max-w-4xl rounded-card border shadow-xl overflow-hidden my-6 sm:my-10 pointer-events-auto"
          style={{ borderColor: 'var(--border)', background: 'var(--background-card)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ════════════════════════════════════════════════════════════════
              1. EN-TÊTE INVERSE (signature dark forest → lime)
              ════════════════════════════════════════════════════════════════ */}
          <div className="section-inverse px-6 py-6 sm:px-8 sm:py-7 rounded-none">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Left: Type Icon + Title */}
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-card flex items-center justify-center shrink-0 shadow-xs"
                  style={{
                    background: isCheckin
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(211,242,110,0.15)',
                    border: isCheckin
                      ? '1px solid rgba(255,255,255,0.2)'
                      : '1px solid rgba(211,242,110,0.25)',
                  }}
                >
                  {isCheckin ? (
                    <LogIn className="w-6 h-6" style={{ color: 'var(--lime-300)' }} />
                  ) : (
                    <LogOut className="w-6 h-6" style={{ color: 'var(--lime-300)' }} />
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-display text-lg sm:text-xl font-bold" style={{ color: 'var(--on-inverse-display)' }}>
                      État des Lieux {isCheckin ? 'd\'Entrée' : 'de Sortie'}
                    </h3>
                    <span
                      className="font-mono text-[0.65rem] font-bold px-2.5 py-1 rounded-pill"
                      style={{
                        background: 'rgba(211,242,110,0.15)',
                        color: 'var(--lime-300)',
                        border: '1px solid rgba(211,242,110,0.25)',
                      }}
                    >
                      {report.code}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[0.7rem] font-medium" style={{ color: 'var(--on-inverse-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.dateInspection}
                    </span>
                    <span>·</span>
                    <InspectionStatutTag statut={report.statut} />
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill text-xs font-bold transition-colors cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'var(--on-inverse-display)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  Exporter PDF
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-pill transition-colors cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <X className="w-4 h-4" style={{ color: 'var(--on-inverse-muted)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              2. CONTENU SCROLLABLE
              ════════════════════════════════════════════════════════════════ */}
          <div className="max-h-[65vh] overflow-y-auto">
            <div className="px-6 sm:px-8 py-6 space-y-6">

              {/* ── Grille Informations ─────────────────────────────────────── */}
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-inner overflow-hidden"
                style={{ background: 'var(--border)', border: '1px solid var(--border)' }}
              >
                {/* Logement */}
                <div className="p-4 space-y-2" style={{ background: 'var(--background-alt)' }}>
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5" style={{ color: 'var(--forest-600)' }} />
                    <span className="text-[0.625rem] font-bold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                      Bien Conciergerie
                    </span>
                  </div>
                  <p className="text-sm font-bold leading-snug" style={{ color: 'var(--forest-950)' }}>
                    {report.logementTitre}
                  </p>
                  <p className="text-[0.7rem] font-medium flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{report.logementAdresse || report.logementVille}</span>
                  </p>
                </div>

                {/* Locataire */}
                <div className="p-4 space-y-2" style={{ background: 'var(--background-alt)' }}>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" style={{ color: 'var(--forest-600)' }} />
                    <span className="text-[0.625rem] font-bold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                      Locataire Voyageur
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[0.65rem] font-bold"
                      style={{ background: 'var(--forest-900)', color: 'var(--lime-400)' }}
                    >
                      {report.travelerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--forest-950)' }}>
                        {report.travelerName}
                      </p>
                      {report.travelerPhone && (
                        <a
                          href={`tel:${report.travelerPhone}`}
                          className="text-[0.65rem] font-medium flex items-center gap-1 hover:underline"
                          style={{ color: 'var(--forest-700)' }}
                        >
                          <Phone className="w-2.5 h-2.5" />
                          {report.travelerPhone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bailleur */}
                <div className="p-4 space-y-2" style={{ background: 'var(--background-alt)' }}>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--forest-600)' }} />
                    <span className="text-[0.625rem] font-bold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                      Bailleur Partenaire
                    </span>
                  </div>
                  <p className="text-xs font-bold" style={{ color: 'var(--forest-950)' }}>
                    {report.ownerName}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-[0.6rem] font-bold px-2 py-0.5 rounded-pill"
                    style={{
                      background: 'var(--forest-50)',
                      color: 'var(--forest-800)',
                      border: '1px solid var(--forest-200)',
                    }}
                  >
                    <Check className="w-2.5 h-2.5" />
                    Mandat Actif
                  </span>
                </div>
              </div>

              {/* ── Relevé Compteur ─────────────────────────────────────────── */}
              <div
                className="rounded-inner border overflow-hidden"
                style={{ borderColor: 'var(--gold-200)' }}
              >
                <div
                  className="px-4 py-2 flex items-center gap-2"
                  style={{ background: 'var(--gold-100)', borderBottom: '1px solid var(--gold-200)' }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: 'var(--gold-800)' }} />
                  <span className="text-[0.625rem] font-bold uppercase tracking-wider" style={{ color: 'var(--gold-800)' }}>
                    Relevé des Compteurs
                  </span>
                </div>
                <div
                  className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{ background: 'var(--gold-50)' }}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold" style={{ color: 'var(--gold-900)' }}>
                      Compteur Électrique Woyofal / Senelec
                    </p>
                    <p className="text-[0.7rem] font-medium" style={{ color: 'var(--gold-700)' }}>
                      Régime : {report.regimeElectricite || 'Carte Prépayée Woyofal'}
                    </p>
                  </div>

                  <span
                    className="font-mono text-sm font-extrabold px-4 py-1.5 rounded-pill border inline-flex items-center gap-2 w-fit"
                    style={{
                      background: 'var(--background-card)',
                      color: 'var(--forest-950)',
                      borderColor: 'var(--gold-300)',
                    }}
                  >
                    <Hash className="w-3.5 h-3.5" style={{ color: 'var(--gold-700)' }} />
                    {report.releveCompteur || '1 458,5 kWh'}
                  </span>
                </div>
              </div>

              {/* ── Galerie Photos avec Onglets par Pièce ──────────────────── */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    style={{ color: 'var(--forest-900)' }}
                  >
                    <Camera className="w-4 h-4" style={{ color: 'var(--forest-600)' }} />
                    Photos Certifiées ({totalPhotos} cliché{totalPhotos > 1 ? 's' : ''})
                  </h4>

                  {/* Category Tabs */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveCat('ALL')}
                      className={cn(
                        'px-3 py-1.5 text-[0.65rem] font-bold rounded-pill transition-all cursor-pointer',
                        activeCat === 'ALL'
                          ? 'shadow-2xs'
                          : '',
                      )}
                      style={{
                        background: activeCat === 'ALL' ? 'var(--forest-900)' : 'var(--background-alt)',
                        color: activeCat === 'ALL' ? 'var(--lime-400)' : 'var(--foreground-muted)',
                        border: activeCat === 'ALL' ? '1px solid var(--forest-700)' : '1px solid var(--border)',
                      }}
                    >
                      Toutes
                    </button>
                    {categoryKeys.map((catKey) => {
                      const meta = CATEGORY_META[catKey];
                      const isActive = activeCat === catKey;
                      const count = (photosByCategory[catKey] || []).length;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setActiveCat(catKey)}
                          className={cn(
                            'px-3 py-1.5 text-[0.65rem] font-bold rounded-pill transition-all cursor-pointer',
                            isActive ? 'shadow-2xs' : '',
                          )}
                          style={{
                            background: isActive ? 'var(--forest-900)' : 'var(--background-alt)',
                            color: isActive ? 'var(--lime-400)' : 'var(--foreground-muted)',
                            border: isActive ? '1px solid var(--forest-700)' : '1px solid var(--border)',
                          }}
                        >
                          {meta?.label || catKey} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Photo Grid */}
                {visiblePhotos.length === 0 ? (
                  <div
                    className="py-10 text-center rounded-inner border"
                    style={{ background: 'var(--background-alt)', borderColor: 'var(--border)' }}
                  >
                    <Camera className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--neutral-300)' }} />
                    <p className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
                      Aucune photo dans cette catégorie
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {visiblePhotos.map((photo, i) => {
                      const meta = CATEGORY_META[photo.cat];
                      return (
                        <button
                          key={`${photo.cat}-${photo.index}`}
                          type="button"
                          onClick={() => setSelectedPhoto(photo.url)}
                          className="group relative aspect-4/3 rounded-inner border overflow-hidden cursor-pointer"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <img
                            src={photo.url}
                            alt={`${meta?.label || photo.cat} — Photo ${photo.index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between">
                              <span className="text-[0.6rem] font-bold text-white/90 bg-black/40 px-2 py-0.5 rounded-pill backdrop-blur-sm">
                                {meta?.label || photo.cat}
                              </span>
                              <span className="text-[0.6rem] font-bold text-white bg-white/20 px-2 py-1 rounded-pill backdrop-blur-sm">
                                Agrandir
                              </span>
                            </div>
                          </div>

                          {/* Category dot indicator */}
                          <div className="absolute top-2 left-2">
                            <span
                              className="w-2 h-2 rounded-full block shadow-xs"
                              style={{ background: isCheckin ? 'var(--success-500)' : 'var(--lime-400)' }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Observations ────────────────────────────────────────────── */}
              <div
                className="rounded-inner border overflow-hidden"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="px-4 py-2 flex items-center gap-2"
                  style={{ background: 'var(--neutral-100)', borderBottom: '1px solid var(--border)' }}
                >
                  <MessageSquareText className="w-3.5 h-3.5" style={{ color: 'var(--forest-700)' }} />
                  <span className="text-[0.625rem] font-bold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                    Observations de la Conciergerie
                  </span>
                </div>
                <div className="px-4 py-4" style={{ background: 'var(--background-card)' }}>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--foreground)' }}>
                    {report.remarques ||
                      'Inspection numérique effectuée avec succès. Les équipements (Climatiseur Split, Télévision Smart, Réfrigérateur, Chauffe-eau) sont fonctionnels. Aucune dégradation constatée lors de la remise des clés.'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              3. PIED DU MODAL
              ════════════════════════════════════════════════════════════════ */}
          <div
            className="px-6 sm:px-8 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{ borderColor: 'var(--border)', background: 'var(--neutral-50)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: report.statut === 'VALIDE' ? 'var(--success-50)' : 'var(--neutral-100)',
                  border: `1px solid ${report.statut === 'VALIDE' ? 'var(--success-500)' : 'var(--border)'}`,
                }}
              >
                <FileCheck
                  className="w-3.5 h-3.5"
                  style={{ color: report.statut === 'VALIDE' ? 'var(--success-700)' : 'var(--neutral-500)' }}
                />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: report.statut === 'VALIDE' ? 'var(--success-700)' : 'var(--foreground)' }}>
                  {report.statut === 'VALIDE'
                    ? 'Signé numériquement — conforme aux exigences Klef'
                    : report.statut === 'LITIGE'
                      ? 'Réserve signalée — en attente de résolution'
                      : 'En attente de signature numérique'}
                </p>
                <p className="text-[0.6rem] font-medium" style={{ color: 'var(--foreground-muted)' }}>
                  Rapport horodaté le {report.dateInspection}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-pill text-xs font-bold cursor-pointer transition-colors self-end sm:self-auto"
              style={{
                background: 'var(--forest-900)',
                color: 'var(--lime-400)',
                border: '1px solid var(--forest-700)',
              }}
            >
              Fermer le rapport
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          LIGHTBOX
          ════════════════════════════════════════════════════════════════════ */}
      {selectedPhoto && (
        <LightboxOverlay
          photoUrl={selectedPhoto}
          allPhotos={visiblePhotos.map((p) => p.url)}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={setSelectedPhoto}
        />
      )}
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────────────────────── */

function InspectionStatutTag({ statut }: { statut: InspectionReportItem['statut'] }) {
  if (statut === 'VALIDE') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[0.6rem] font-bold"
        style={{
          background: 'rgba(16,185,129,0.15)',
          color: '#6ee7b7',
          border: '1px solid rgba(16,185,129,0.3)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#34d399' }} />
        Certifié Conforme
      </span>
    );
  }

  if (statut === 'LITIGE') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[0.6rem] font-bold"
        style={{
          background: 'rgba(245,158,11,0.15)',
          color: '#fcd34d',
          border: '1px solid rgba(245,158,11,0.3)',
        }}
      >
        <ShieldAlert className="w-2.5 h-2.5" />
        Réserve Signalée
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[0.6rem] font-medium"
      style={{
        background: 'rgba(255,255,255,0.1)',
        color: 'var(--on-inverse-muted)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--neutral-400)' }} />
      En attente
    </span>
  );
}

/* ── Lightbox avec navigation ──────────────────────────────────────────────── */

function LightboxOverlay({
  photoUrl,
  allPhotos,
  onClose,
  onNavigate,
}: {
  photoUrl: string;
  allPhotos: string[];
  onClose: () => void;
  onNavigate: (url: string) => void;
}) {
  const currentIndex = allPhotos.indexOf(photoUrl);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPhotos.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(allPhotos[currentIndex - 1]);
  }, [hasPrev, allPhotos, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(allPhotos[currentIndex + 1]);
  }, [hasNext, allPhotos, currentIndex, onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goPrev, goNext]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative flex items-center justify-center w-full h-full p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
        {/* Navigation buttons */}
        {hasPrev && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full transition-colors cursor-pointer z-10"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full transition-colors cursor-pointer z-10"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Image */}
        <img
          src={photoUrl}
          alt="Photo d'inspection agrandie"
          className="max-w-full max-h-[85vh] rounded-card object-contain shadow-2xl"
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full transition-colors cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Counter */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <span
              className="text-xs font-bold text-white/80 px-4 py-1.5 rounded-pill"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            >
              {currentIndex + 1} / {allPhotos.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
