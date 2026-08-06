'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Camera, Upload, Trash2, Star, AlertCircle, CheckCircle2, ChevronDown, Film, X,
} from 'lucide-react';
import { useListingFormStore } from '@/stores/listing-form.store';
import { type PhotoItem } from '@/schemas/listing.schema';
import { cn } from '@/lib/utils/cn';

const MIN_PHOTOS = 5;
const MAX_PHOTOS = 10;
const MAX_VIDEO_SECONDS = 90;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGES = ['image/jpeg', 'image/png', 'image/webp'];

const CAT_LABELS: Record<string, string> = {
  SALON: 'Salon', CHAMBRE: 'Chambre', CUISINE: 'Cuisine',
  SALLE_DE_BAIN: 'Salle de bain', TERRASSE: 'Terrasse',
  VUE: 'Vue', ENTREE: 'Entrée', PISCINE: 'Piscine', AUTRE: 'Autre',
};

const revoke = (url?: string) => {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
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
    <section className="card overflow-hidden p-0 shadow-sm">
      <header className="flex items-center gap-3.5 border-b border-border bg-background-alt px-6 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>
          )}
        </div>
      </header>
      <div className="space-y-6 p-6">{children}</div>
    </section>
  );
}

export function StepPhotos({ onNext, submitRef }: Props) {
  const { photos, addPhoto, removePhoto, updatePhoto, setPrincipalPhoto } = useListingFormStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const list = photos.photos;
  const isComplete = list.length >= MIN_PHOTOS;
  const remaining = MIN_PHOTOS - list.length;
  const slotsLeft = MAX_PHOTOS - list.length;

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    setFileError(null);

    const incoming = Array.from(files);
    const rejected: string[] = [];

    /* `accept="image/*"` n'est qu'un filtre de boîte de dialogue : un PDF
       glissé-déposé passait sans contrôle et produisait une vignette cassée. */
    const valid = incoming.filter((f) => {
      if (!ACCEPTED_IMAGES.includes(f.type)) { rejected.push(`${f.name} — format non pris en charge`); return false; }
      if (f.size > MAX_PHOTO_BYTES) { rejected.push(`${f.name} — dépasse 10 Mo`); return false; }
      return true;
    });

    const currentTotal = list.length;
    const accepted = valid.slice(0, MAX_PHOTOS - currentTotal);
    if (valid.length > accepted.length) {
      rejected.push(`${valid.length - accepted.length} photo(s) ignorée(s) — maximum ${MAX_PHOTOS}`);
    }

    accepted.forEach((file, i) => {
      addPhoto({
        file,
        previewUrl: URL.createObjectURL(file),
        categorie: 'AUTRE',
        estPrincipale: currentTotal === 0 && i === 0,
        position: currentTotal + i,
      });
    });

    if (rejected.length) setFileError(rejected.join(' · '));
    if (accepted.length) setHasTriedSubmit(false);
  }, [list.length, addPhoto]);

  /* Chaque objectURL non révoqué reste en mémoire jusqu'à la fermeture de
     l'onglet. Sur un formulaire où l'on essaie et retire des photos, ça
     s'accumule sans limite. */
  const handleRemove = useCallback((index: number) => {
    revoke(list[index]?.previewUrl);
    removePhoto(index);
  }, [list, removePhoto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) { setHasTriedSubmit(true); return; }
    onNext();
  };

  const principal = list.find((p) => p.estPrincipale) ?? list[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      <SectionCard
        icon={Camera}
        title="Photos du logement"
        description={`Entre ${MIN_PHOTOS} et ${MAX_PHOTOS} photos. La première visible est celle qui décide du clic.`}
      >
        {/* ── Progression ──────────────────────────────────────────────── */}

        <div
          aria-live="polite"
          className={cn(
            'flex items-center justify-between gap-4 rounded-inner border p-4',
            isComplete
              ? 'border-success-500/25 bg-success-50'
              : hasTriedSubmit
                ? 'border-error-500/25 bg-error-50'
                : 'border-border bg-background-alt',
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-inner border',
              isComplete
                ? 'border-success-500/30 bg-success-50 text-success-600'
                : hasTriedSubmit
                  ? 'border-error-500/30 bg-error-50 text-error-600'
                  : 'border-border bg-background-card text-foreground-muted',
            )}>
              {isComplete
                ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                : <Camera className="h-5 w-5" aria-hidden="true" />}
            </span>
            <div className="min-w-0">
              <p className={cn(
                'text-sm font-semibold',
                isComplete ? 'text-success-700' : hasTriedSubmit ? 'text-error-700' : 'text-foreground',
              )}>
                {isComplete
                  ? 'Minimum atteint'
                  : `Encore ${remaining} photo${remaining > 1 ? 's' : ''}`}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-foreground-muted">
                {list.length} / {MAX_PHOTOS} sélectionnées
              </p>
            </div>
          </div>

          <div aria-hidden="true" className="flex shrink-0 items-end gap-1">
            {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'w-1.5 rounded-pill transition-all duration-300',
                  i < list.length
                    ? 'h-5 bg-forest-600'
                    : i < MIN_PHOTOS
                      ? cn('h-3', hasTriedSubmit ? 'bg-error-500' : 'bg-border-hover')
                      : 'h-2 bg-border',
                )}
              />
            ))}
          </div>
        </div>

        {/* ── Couverture ───────────────────────────────────────────────── */}

        {principal && (
          <figure className="relative aspect-video w-full overflow-hidden rounded-card border border-gold-300 bg-background-alt">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={principal.previewUrl} alt="" className="h-full w-full object-cover" />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-forest-950/85 to-transparent p-3 pt-10">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-gold-400/30 bg-gold-400/15 px-2.5 py-1 text-xs font-semibold text-gold-300 backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
                Photo de couverture
              </span>
              <span className="rounded-pill border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-neutral-50 backdrop-blur-sm">
                {CAT_LABELS[principal.categorie] ?? principal.categorie}
              </span>
            </figcaption>
          </figure>
        )}

        {/* ── Grille ───────────────────────────────────────────────────── */}

        {list.length > 0 && (
          <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            {list.map((photo, index) => (
              <PhotoCard
                key={photo.previewUrl}
                photo={photo}
                index={index}
                isPrincipal={photo.estPrincipale}
                onRemove={() => handleRemove(index)}
                onSetPrincipal={() => setPrincipalPhoto(index)}
                onCategorieChange={(cat) =>
                  updatePhoto(index, { categorie: cat as PhotoItem['categorie'] })}
              />
            ))}
          </ul>
        )}

        {/* ── Dépôt ────────────────────────────────────────────────────── */}

        {slotsLeft > 0 && (
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              className={cn(
                'flex w-full flex-col items-center justify-center gap-2 rounded-field border-2 border-dashed py-8 text-center transition-colors',
                isDragging
                  ? 'border-forest-600 bg-forest-50'
                  : 'border-border bg-background-alt hover:border-forest-400 hover:bg-background-card',
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-inner border border-forest-100 bg-forest-50 text-forest-700">
                <Upload className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                {list.length === 0 ? 'Cliquez ou déposez vos photos' : 'Ajouter d’autres photos'}
              </span>
              <span className="text-xs text-foreground-muted">
                JPEG, PNG ou WebP · 10 Mo max ·{' '}
                <span className="tabular-nums">{slotsLeft}</span> emplacement
                {slotsLeft > 1 ? 's' : ''} restant{slotsLeft > 1 ? 's' : ''}
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_IMAGES.join(',')}
              multiple
              className="sr-only"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
            />
          </div>
        )}

        {/* ── Erreurs ──────────────────────────────────────────────────── */}

        {fileError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-inner border border-warning-500/25 bg-warning-50 p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-warning-700">{fileError}</p>
          </div>
        )}

        {!isComplete && hasTriedSubmit && (
          <div role="alert" className="flex items-center gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
            <p className="text-xs text-error-700">
              {list.length === 0
                ? `Ajoutez au moins ${MIN_PHOTOS} photos pour continuer.`
                : `Il manque ${remaining} photo${remaining > 1 ? 's' : ''}.`}
            </p>
          </div>
        )}
      </SectionCard>

      <VideoUploaderSection />

      <button type="submit" ref={submitRef} className="sr-only" aria-hidden="true" />
    </form>
  );
}

/* ─── Vignette ────────────────────────────────────────────────────────────── */

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
  const catId = useId();

  return (
    <li className={cn(
      'group relative aspect-[4/3] overflow-hidden rounded-inner border-2 bg-background-alt transition-shadow',
      isPrincipal ? 'border-gold-300 shadow-md' : 'border-border',
    )}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.previewUrl} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />

      {isPrincipal && (
        <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-pill border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-xs font-semibold text-gold-700">
          <Star className="h-3 w-3 fill-gold-400 text-gold-400" aria-hidden="true" />
          Couverture
        </span>
      )}

      {/* Les actions restent visibles sur mobile : le `group-hover` seul les
          rendait inatteignables au tactile sur la moitié des écrans. */}
      <div className="absolute inset-0 z-10 flex items-end justify-between gap-2 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-transparent p-2.5 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {!isPrincipal && (
            <button
              type="button"
              onClick={onSetPrincipal}
              className="inline-flex items-center gap-1 rounded-pill border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-semibold text-neutral-50 backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <Star className="h-3.5 w-3.5" aria-hidden="true" />
              Couverture
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowCat((v) => !v)}
            aria-expanded={showCat}
            aria-controls={catId}
            className="inline-flex items-center gap-1 rounded-pill border border-white/20 bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-neutral-50 backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            {CAT_LABELS[photo.categorie]}
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showCat && 'rotate-180')} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer la photo ${index + 1}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-error-600 text-neutral-0 transition-colors hover:bg-error-700"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {showCat && (
        <div
          id={catId}
          className="absolute inset-0 z-30 flex flex-col overflow-y-auto rounded-inner bg-forest-950/95 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-inverse-muted">
              Catégorie
            </p>
            <button
              type="button"
              onClick={() => setShowCat(false)}
              aria-label="Fermer"
              className="flex h-6 w-6 items-center justify-center rounded-pill text-on-inverse-muted hover:text-on-inverse"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1">
            {Object.entries(CAT_LABELS).map(([key, lbl]) => (
              <button
                key={key}
                type="button"
                onClick={() => { onCategorieChange(key); setShowCat(false); }}
                aria-pressed={photo.categorie === key}
                className={cn(
                  'w-full rounded-inner px-3 py-2 text-left text-xs font-semibold transition-colors',
                  photo.categorie === key
                    ? 'bg-neutral-50 text-forest-900'
                    : 'text-on-inverse-muted hover:bg-white/10',
                )}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

/* ─── Vidéo ───────────────────────────────────────────────────────────────── */

function VideoUploaderSection() {
  const { video, setVideo } = useListingFormStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => revoke(video?.previewUrl), [video?.previewUrl]);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    revoke(video?.previewUrl);

    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement('video');
    probe.preload = 'metadata';

    /* L'élément de sondage et son objectURL n'étaient nettoyés sur aucun
       chemin d'erreur : chaque tentative laissait un blob et des handlers. */
    const cleanupProbe = () => {
      probe.onloadedmetadata = null;
      probe.onerror = null;
      probe.removeAttribute('src');
      probe.load();
    };

    probe.onloadedmetadata = () => {
      const duration = probe.duration;
      cleanupProbe();

      if (Number.isFinite(duration) && duration > MAX_VIDEO_SECONDS) {
        setError(
          `Vidéo de ${Math.round(duration)} s. La durée maximale est de 1 min 30 s.`,
        );
        URL.revokeObjectURL(objectUrl);
        return;
      }

      setVideo({
        file,
        previewUrl: objectUrl,
        name: file.name,
        duration: Number.isFinite(duration) ? Math.round(duration) : undefined,
      });
    };

    probe.onerror = () => {
      cleanupProbe();
      URL.revokeObjectURL(objectUrl);
      /* On acceptait le fichier malgré l'échec de lecture : une vidéo
         illisible partait au serveur sans que sa durée ait été vérifiée. */
      setError('Ce fichier n’a pas pu être lu comme une vidéo. Essayez un MP4.');
    };

    probe.src = objectUrl;
  };

  const removeVideo = () => {
    revoke(video?.previewUrl);
    setVideo(null);
    setError(null);
  };

  return (
    <SectionCard
      icon={Film}
      title="Visite en vidéo"
      description="Optionnel · 1 min 30 maximum · le format vertical rend mieux sur mobile"
    >
      <div className="space-y-4">
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-inner border border-error-500/20 bg-error-50 p-3.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-error-700">{error}</p>
          </div>
        )}

        {video ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-inner border border-success-500/25 bg-success-50 p-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-success-700">
                    Vidéo prête{video.duration ? ` · ${video.duration} s` : ''}
                  </p>
                  <p className="mt-0.5 max-w-[220px] truncate text-xs text-foreground-muted sm:max-w-xs">
                    {video.name ?? 'Vidéo sélectionnée'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeVideo}
                className="shrink-0 rounded-pill border border-error-500/25 px-3 py-1.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
              >
                Retirer
              </button>
            </div>

            <div className="mx-auto aspect-[9/16] w-full max-w-xs overflow-hidden rounded-inner border border-border bg-background-alt">
              <video src={video.previewUrl} controls playsInline className="h-full w-full object-cover" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-3 rounded-inner border border-border bg-background-alt p-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Ajouter une vidéo</p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                MP4, MOV ou WebM · 1 min 30 maximum
              </p>
            </div>
            <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-pill border border-border bg-background-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-border-hover hover:bg-background-alt">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Choisir un fichier
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="sr-only"
                onChange={handleVideoSelect}
              />
            </label>
          </div>
        )}
      </div>
    </SectionCard>
  );
}