'use client';

import { useRef, useCallback, useState } from 'react';
import {
  Camera, Upload, Trash2, Star, AlertCircle, CheckCircle2, ChevronDown,
} from 'lucide-react';
import { useListingFormStore } from '@/stores/listing-form.store';
import { type PhotoItem } from '@/schemas/listing.schema';
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

function SectionCard({
  icon: Icon, title, description, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-0 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3.5 px-6 py-4.5 border-b border-border/80 bg-background-alt">
        <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shrink-0 shadow-xs">
          <Icon className="w-5 h-5 text-lime-400" />
        </div>
        <div>
          <p className="font-display text-base font-bold text-foreground tracking-tight">{title}</p>
          {description && <p className="text-xs text-foreground-muted mt-0.5 font-medium">{description}</p>}
        </div>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

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
    <form onSubmit={handleSubmit} className="space-y-6">

      <SectionCard
        icon={Camera}
        title={`Galerie Photos (${list.length}/10)`}
        description="Veuillez importer au minimum 5 photos de haute qualité de votre logement"
      >
        {/* Status bar */}
        <div className={cn(
          'flex items-center justify-between p-4 rounded-inner border transition-all duration-300',
          isComplete
            ? 'bg-forest-950/5 border-forest-600/30'
            : hasTriedSubmit
              ? 'bg-error-50 border-error-500/30'
              : 'bg-background-alt border-border',
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-inner flex items-center justify-center transition-all',
              isComplete ? 'bg-forest-600 text-lime-300' : hasTriedSubmit ? 'bg-error-600 text-white' : 'bg-background-card border border-border text-foreground-muted',
            )}>
              {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
            </div>
            <div>
              <p className={cn('text-xs font-bold', isComplete ? 'text-forest-600 font-extrabold' : hasTriedSubmit ? 'text-error-600 font-extrabold' : 'text-foreground')}>
                {isComplete ? 'Minimum de 5 photos atteint !' : `Encore ${remaining} photo${remaining > 1 ? 's' : ''} requise${remaining > 1 ? 's' : ''}`}
              </p>
              <p className="text-[11px] text-foreground-muted font-semibold mt-0.5">{list.length} / 10 photos sélectionnées</p>
            </div>
          </div>
          {/* Dots */}
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={cn(
                'rounded-pill transition-all duration-500',
                i < list.length
                  ? 'w-1.5 h-5 bg-forest-600'
                  : i < 5 ? (hasTriedSubmit ? 'w-1.5 h-3 bg-error-400' : 'w-1.5 h-3 bg-border') : 'w-1.5 h-2 bg-border/40'
              )} />
            ))}
          </div>
        </div>

        {/* Hero Cover Photo */}
        {list.length > 0 && principal && (
          <div className="relative w-full aspect-16/10 sm:aspect-video rounded-inner overflow-hidden border-2 border-gold-400 bg-background-alt shadow-md">
            <img src={principal.previewUrl} alt="Photo principale" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3">
              <div className="badge-verified shadow-md">
                <Star className="w-3.5 h-3.5 text-gold-600 fill-gold-600" />
                <span className="font-bold">Photo de couverture</span>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-xs font-bold text-lime-300 bg-forest-950/90 px-3 py-1.5 rounded-pill backdrop-blur-sm border border-forest-800">
                {CAT_LABELS[principal.categorie] ?? principal.categorie}
              </span>
            </div>
          </div>
        )}

        {/* Grid Photos */}
        {list.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
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

        {/* Drop zone */}
        {list.length < 10 && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-8 rounded-field border-2 border-dashed border-border bg-background-alt hover:border-forest-600 hover:bg-background-card cursor-pointer transition-all text-center"
          >
            <div className="w-10 h-10 rounded-inner bg-forest-950 border border-forest-800 text-lime-400 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">
                {list.length === 0 ? 'Cliquez ou glissez vos photos ici' : 'Ajouter d\'autres photos'}
              </p>
              <p className="text-[11px] text-foreground-muted font-medium mt-0.5">
                Format JPG ou PNG ({10 - list.length} restante{10 - list.length > 1 ? 's' : ''})
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        )}

        {/* Validation Error */}
        {!isComplete && (hasTriedSubmit || list.length > 0) && (
          <div className="flex items-center gap-2.5 p-3.5 bg-error-50 border border-error-500/30 rounded-inner">
            <AlertCircle className="w-4 h-4 text-error-600 shrink-0" />
            <p className="text-xs text-error-600 font-bold">
              {list.length === 0 ? 'Veuillez ajouter au moins 5 photos' : `Il manque encore ${remaining} photo${remaining > 1 ? 's' : ''}`}
            </p>
          </div>
        )}
      </SectionCard>

      <button type="submit" ref={submitRef} className="sr-only" aria-hidden="true" />
    </form>
  );
}

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
      'group relative aspect-16/10 sm:aspect-4/3 rounded-inner overflow-hidden border-2 bg-background-alt transition-all shadow-xs flex flex-col justify-end',
      isPrincipal ? 'border-gold-400 ring-2 ring-gold-400/20 shadow-md' : 'border-border',
    )}>
      <img src={photo.previewUrl} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />

      {isPrincipal && (
        <div className="absolute top-2.5 left-2.5 badge-verified shadow-md z-10">
          <Star className="w-3.5 h-3.5 text-gold-600 fill-gold-600" />
          <span className="font-bold">Couverture</span>
        </div>
      )}

      {/* Action bar overlay (persistent sur mobile, hover sur desktop) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5 z-10 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isPrincipal && (
            <button
              type="button"
              onClick={onSetPrincipal}
              className="px-3 py-1.5 rounded-pill bg-lime-400 text-forest-950 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Star className="w-3.5 h-3.5 fill-forest-950 text-forest-950" />
              <span>Couverture</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCat((v) => !v)}
            className="px-2.5 py-1.5 rounded-pill bg-forest-950/90 text-lime-300 text-xs font-semibold flex items-center gap-1 border border-forest-800 cursor-pointer"
          >
            <span>{CAT_LABELS[photo.categorie]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-lime-400" />
          </button>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="w-8 h-8 rounded-full bg-error-600 text-white hover:bg-error-700 cursor-pointer shadow-md flex items-center justify-center shrink-0 active:scale-95 transition-transform ml-auto"
          title="Supprimer la photo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showCat && (
        <div className="absolute inset-0 bg-forest-950/95 p-3 flex flex-col overflow-y-auto z-30 rounded-inner space-y-1">
          <p className="eyebrow text-lime-300 mb-1 text-[10px]">Catégorie de la photo</p>
          {Object.entries(CAT_LABELS).map(([key, lbl]) => (
            <button
              key={key}
              type="button"
              onClick={() => { onCategorieChange(key); setShowCat(false); }}
              className={cn(
                'w-full py-2 px-3 text-xs font-semibold text-left rounded-inner transition-colors cursor-pointer',
                photo.categorie === key ? 'bg-forest-800 text-lime-300 font-bold' : 'text-on-inverse-muted hover:bg-forest-900',
              )}
            >
              {lbl}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
