'use client';

import { useRef, useCallback, useState } from 'react';
import {
  Camera, Upload, X, Star, AlertCircle, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { useListingFormStore } from '@/stores/listing-form.store';
import { CATEGORIE_PHOTO, type PhotoItem } from '@/schemas/listing.schema';
import { cn } from '@/lib/utils/cn';

const CAT_LABELS: Record<string, string> = {
  SALON: 'Salon', CHAMBRE: 'Chambre', CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Salle de bain', TERRASSE: 'Terrasse',
  VUE: 'Vue', ENTREE: 'Entrée', PISCINE: 'Piscine', AUTRE: 'Autre',
};

interface Props {
  onNext: () => void;
  submitRef: React.RefObject<HTMLButtonElement | null>;
}

/* ── SectionCard ──────────────────────────────────────────────────────────── */

function SectionCard({
  icon: Icon, title, description,
  accent = 'bg-sky-500', headerBg = 'bg-sky-50',
  iconBg = 'bg-sky-100', iconColor = 'text-sky-600',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  accent?: string;
  headerBg?: string;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
      <div className={cn('h-[3px] w-full rounded-t-2xl', accent)} />
      <div className={cn('flex items-center gap-3.5 px-5 py-4 border-b border-neutral-100', headerBg)}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        <div>
          <p className="font-bold text-neutral-900 text-[15px] tracking-tight">{title}</p>
          {description && <p className="text-[12px] text-neutral-400 mt-0.5 font-medium">{description}</p>}
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export function StepPhotos({ onNext, submitRef }: Props) {
  const { photos, addPhoto, removePhoto, updatePhoto, setPrincipalPhoto } = useListingFormStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const list = photos.photos;
  const isComplete = list.length >= 5;
  const remaining  = 5 - list.length;

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const currentTotal = list.length;
    const canAdd = 10 - currentTotal;
    Array.from(files).slice(0, canAdd).forEach((file, i) => {
      addPhoto({
        file,
        previewUrl: URL.createObjectURL(file),
        categorie: 'AUTRE',
        estPrincipale: currentTotal === 0 && i === 0,
        position: currentTotal + i,
      });
    });
    setHasTriedSubmit(false);
  }, [list.length, addPhoto]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) { setHasTriedSubmit(true); return; }
    onNext();
  }

  const principal = list.find((p) => p.estPrincipale) ?? list[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <SectionCard
        icon={Camera}
        title={`Photos (${list.length}/10)`}
        description="Minimum 5 photos de qualité pour continuer"
      >
        {/* ── Status bar ── */}
        <div className={cn(
          'flex items-center justify-between p-4 rounded-2xl border transition-all duration-300',
          isComplete
            ? 'bg-emerald-50 border-emerald-200'
            : hasTriedSubmit
              ? 'bg-red-50 border-red-200'
              : 'bg-neutral-50 border-neutral-200',
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              isComplete ? 'bg-emerald-500 text-white' : hasTriedSubmit ? 'bg-red-500 text-white' : 'bg-white border border-neutral-200 text-neutral-400',
            )}>
              {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <p className={cn('text-sm font-black', isComplete ? 'text-emerald-800' : hasTriedSubmit ? 'text-red-700' : 'text-neutral-700')}>
                {isComplete ? 'Critère minimum atteint !' : `Ajoutez encore ${remaining} photo${remaining > 1 ? 's' : ''}`}
              </p>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{list.length} / 10 photos ajoutées</p>
            </div>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={cn(
                'rounded-full transition-all duration-500',
                i < list.length
                  ? 'w-1.5 h-5 bg-emerald-500'
                  : i < 5 ? (hasTriedSubmit ? 'w-1.5 h-3 bg-red-200' : 'w-1.5 h-3 bg-neutral-200') : 'w-1.5 h-2 bg-neutral-100'
              )} />
            ))}
          </div>
        </div>

        {/* ── Hero photo (première/principale) ── */}
        {list.length > 0 && principal && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
            <img src={principal.previewUrl} alt="Photo principale" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Photo de couverture
              </span>
              <span className="text-[10px] font-semibold text-white/70 bg-black/30 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {CAT_LABELS[principal.categorie] ?? principal.categorie}
              </span>
            </div>
          </div>
        )}

        {/* ── Grille photos ── */}
        {list.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {list.map((photo, index) => (
              <PhotoCard
                key={photo.previewUrl}
                photo={photo}
                index={index}
                isPrincipal={photo.estPrincipale}
                onRemove={() => removePhoto(index)}
                onSetPrincipal={() => setPrincipalPhoto(index)}
                onCategorieChange={(cat) => updatePhoto(index, { categorie: cat as PhotoItem['categorie'] })}
              />
            ))}
          </div>
        )}

        {/* ── Drop zone ── */}
        {list.length < 10 && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="group flex items-center justify-center gap-3 py-5 rounded-2xl border-2 border-dashed border-sky-200 hover:border-sky-400 bg-sky-50/50 hover:bg-sky-50 cursor-pointer transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-700">
                {list.length === 0 ? 'Cliquez ou glissez vos photos' : 'Ajouter des photos'}
              </p>
              <p className="text-[11px] text-sky-500/70 font-medium mt-0.5">
                {10 - list.length} emplacement{10 - list.length > 1 ? 's' : ''} restant{10 - list.length > 1 ? 's' : ''}
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
          </div>
        )}

        {/* Validation error */}
        {!isComplete && (hasTriedSubmit || list.length > 0) && (
          <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600 font-bold">
              {list.length === 0 ? 'Veuillez ajouter au moins 5 photos' : `Il manque encore ${remaining} photo${remaining > 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </SectionCard>

      <button type="submit" ref={submitRef} className="sr-only" aria-hidden="true" />
    </form>
  );
}

/* ── Photo Card ───────────────────────────────────────────────────────────── */

function PhotoCard({
  photo, index, isPrincipal, onRemove, onSetPrincipal, onCategorieChange,
}: {
  photo: PhotoItem;
  index: number;
  isPrincipal: boolean;
  onRemove: () => void;
  onSetPrincipal: () => void;
  onCategorieChange: (cat: string) => void;
}) {
  const [showCat, setShowCat] = useState(false);

  return (
    <div className={cn(
      'group relative aspect-square rounded-xl overflow-hidden bg-neutral-100 border-2 transition-all duration-200',
      isPrincipal ? 'border-amber-400 shadow-md shadow-amber-400/20' : 'border-transparent',
    )}>
      <img src={photo.previewUrl} alt={`Photo ${index + 1}`}
        className="w-full h-full object-cover transition-all duration-200 group-active:brightness-75" />

      {/* Badge principale */}
      {isPrincipal && (
        <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow">
          <Star className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      {/* Actions overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity bg-black/40 flex flex-col items-center justify-center gap-1.5 p-1">
        {!isPrincipal && (
          <button type="button" onClick={onSetPrincipal}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-400/90 text-white text-[10px] font-bold active:scale-95 transition-transform">
            <Star className="w-3 h-3 fill-white" />
            Principale
          </button>
        )}
        <button type="button" onClick={() => setShowCat((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/20 text-white text-[10px] font-bold active:scale-95 transition-transform">
          <ChevronDown className="w-3 h-3" />
          Catégorie
        </button>
        <button type="button" onClick={onRemove}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/90 text-white text-[10px] font-bold active:scale-95 transition-transform">
          <X className="w-3 h-3" />
          Supprimer
        </button>
      </div>

      {/* Category picker (inline) */}
      {showCat && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col overflow-y-auto rounded-xl z-10">
          {Object.entries(CAT_LABELS).map(([key, lbl]) => (
            <button key={key} type="button"
              onClick={() => { onCategorieChange(key); setShowCat(false); }}
              className={cn(
                'w-full py-2 px-3 text-[10px] font-bold text-left transition-colors',
                photo.categorie === key ? 'bg-white/20 text-amber-300' : 'text-white/80 hover:bg-white/10',
              )}>
              {lbl}
            </button>
          ))}
        </div>
      )}

      {/* Static category badge */}
      {!showCat && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5 opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white text-[9px] font-semibold">
            <div className="w-1 h-1 rounded-full bg-sky-400" />
            {CAT_LABELS[photo.categorie]}
          </div>
        </div>
      )}
    </div>
  );
}
