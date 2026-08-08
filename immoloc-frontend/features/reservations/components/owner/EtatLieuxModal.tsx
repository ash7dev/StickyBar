'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle, Camera, CheckCircle2, ImageIcon, Loader2,
  LogOut, Plus, RotateCw, Trash2, X,
} from 'lucide-react';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { PhotoCategorie } from '@/lib/nestjs/types';
import { cn } from '@/lib/utils/cn';

type ModalType = 'CHECKIN' | 'CHECKOUT';
type PhotoState = 'pending' | 'uploading' | 'done' | 'failed';

interface PhotoEntry {
  localId: string;
  file: File;
  preview: string;
  categorie: PhotoCategorie;
  state: PhotoState;
  url?: string;
  publicId?: string;
}

interface Props {
  reservationId: string;
  type: ModalType;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES: { value: PhotoCategorie; label: string }[] = [
  { value: 'ENTREE', label: 'Entrée' },
  { value: 'SALON', label: 'Salon' },
  { value: 'CHAMBRE', label: 'Chambre' },
  { value: 'CUISINE', label: 'Cuisine' },
  { value: 'SALLE_DE_BAIN', label: 'Salle d’eau' },
  { value: 'TERRASSE', label: 'Terrasse' },
  { value: 'PISCINE', label: 'Piscine' },
  { value: 'VUE', label: 'Vue' },
  { value: 'AUTRE', label: 'Autre' },
];

/* Les deux entrees de CFG etaient identiques sauf le titre : mêmes couleurs,
   memes classes de bouton, meme barre. Cinq champs dupliques pour rien. */
const CFG = {
  CHECKIN: {
    title: 'Check-in',
    subtitle: 'Photographiez l’état du logement avant l’arrivée du voyageur.',
    confirm: 'Confirmer le check-in',
    icon: CheckCircle2,
  },
  CHECKOUT: {
    title: 'Check-out',
    subtitle: 'Photographiez l’état du logement après le départ du voyageur.',
    confirm: 'Confirmer le check-out',
    icon: LogOut,
  },
} as const;

const MAX_PHOTOS = 20;
const MAX_FILE_MB = 12;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const CONCURRENCY = 3;

interface CloudinaryParams {
  uploadUrl: string; signature: string; timestamp: number; apiKey: string; folder: string;
}

/* ─── Compression ─────────────────────────────────────────────────────────── */

async function compress(file: File, maxWidth = 1920, quality = 0.82): Promise<File> {
  // Les formats HEIC ne sont pas decodables par <img> sur la plupart des
  // navigateurs : la compression echouait silencieusement et renvoyait
  // l'original de 12 Mo. On ne tente meme pas.
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file;

  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    const done = (f: File) => { URL.revokeObjectURL(url); resolve(f); };

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      // getContext('2d')! partait du principe qu'il existe toujours : il
      // renvoie null si le navigateur refuse un nouveau contexte.
      if (!ctx) { done(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => done(blob && blob.size < file.size
          ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
          : file),
        'image/jpeg', quality,
      );
    };
    img.onerror = () => done(file);
    img.src = url;
  });
}

async function uploadOne(file: File, params: CloudinaryParams) {
  const compressed = await compress(file);
  const fd = new FormData();
  fd.append('file', compressed);
  fd.append('folder', params.folder);
  fd.append('signature', params.signature);
  fd.append('timestamp', String(params.timestamp));
  fd.append('api_key', params.apiKey);

  const res = await fetch(params.uploadUrl, { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? res.statusText);
  }
  const data = await res.json() as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id };
}

/* ─── Modale ──────────────────────────────────────────────────────────────── */

function EtatLieuxModal({ reservationId, type, onSuccess, onCancel }: Props) {
  const cfg = CFG[type];
  const Icon = cfg.icon;
  const { refreshIfNeeded } = useNestToken();

  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restore = useRef<HTMLElement | null>(null);
  const blobs = useRef(new Set<string>());

  const titleId = useId();
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'confirm'>('upload');
  const [error, setError] = useState('');
  const [fileWarnings, setFileWarnings] = useState<string[]>([]);

  /* Les blobs n'etaient revoques qu'au succes complet : fermer la modale ou
     echouer laissait vingt apercus en memoire. */
  useEffect(() => {
    const live = blobs.current;
    return () => { live.forEach((u) => URL.revokeObjectURL(u)); live.clear(); };
  }, []);

  /* La modale n'avait ni Escape, ni piege de focus, ni role dialog, ni verrou
     de defilement : la page defilait derriere et la tabulation en sortait. */
  useEffect(() => {
    restore.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) { onCancel(); return; }
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), select, input, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      restore.current?.focus();
    };
  }, [loading, onCancel]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const warnings: string[] = [];
    const next: PhotoEntry[] = [];

    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      for (const file of Array.from(files)) {
        if (next.length >= room) { warnings.push(`Maximum ${MAX_PHOTOS} photos.`); break; }
        // Aucune validation n'existait : un fichier de 40 Mo partait tel quel.
        if (!ACCEPTED.includes(file.type)) { warnings.push(`${file.name} : format non pris en charge.`); continue; }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          warnings.push(`${file.name} : ${(file.size / 1048576).toFixed(1)} Mo, au-delà de ${MAX_FILE_MB} Mo.`);
          continue;
        }
        const preview = URL.createObjectURL(file);
        blobs.current.add(preview);
        next.push({ localId: crypto.randomUUID(), file, preview, categorie: 'AUTRE', state: 'pending' });
      }
      return [...prev, ...next];
    });

    setFileWarnings(warnings);
  }, []);

  const removePhoto = useCallback((localId: string) => {
    setPhotos((prev) => {
      const e = prev.find((p) => p.localId === localId);
      if (e) { URL.revokeObjectURL(e.preview); blobs.current.delete(e.preview); }
      return prev.filter((p) => p.localId !== localId);
    });
  }, []);

  const setCategorie = useCallback((localId: string, categorie: PhotoCategorie) => {
    setPhotos((prev) => prev.map((p) => (p.localId === localId ? { ...p, categorie } : p)));
  }, []);

  const uploadedCount = photos.filter((p) => p.state === 'done').length;
  const failedCount = photos.filter((p) => p.state === 'failed').length;

  /*
    Reprise par photo.

    L'original enveloppait tous les uploads dans un Promise.all : un echec sur
    la photo 7 faisait remonter l'erreur alors que les six premieres etaient
    deja sur Cloudinary ET enregistrees en base. Un nouvel essai les renvoyait,
    creant des doublons dans la preuve d'etat des lieux.

    Chaque photo porte desormais son etat. Un nouvel essai ne reprend que
    celles qui ont echoue.
  */
  async function runUploads(token: string, params: CloudinaryParams) {
    const queue = photos.filter((p) => p.state === 'pending' || p.state === 'failed');
    let cursor = 0;

    async function worker() {
      while (cursor < queue.length) {
        const entry = queue[cursor++];
        setPhotos((prev) => prev.map((p) => (p.localId === entry.localId ? { ...p, state: 'uploading' } : p)));
        try {
          const { url, publicId } = await uploadOne(entry.file, params);
          await nestFetch(NEST_API.RESERVATIONS.ADD_ETAT_LIEUX(reservationId), {
            method: 'POST', token,
            body: JSON.stringify({ type, categorie: entry.categorie, url, publicId }),
          });
          setPhotos((prev) => prev.map((p) =>
            p.localId === entry.localId ? { ...p, state: 'done', url, publicId } : p));
        } catch {
          setPhotos((prev) => prev.map((p) =>
            p.localId === entry.localId ? { ...p, state: 'failed' } : p));
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
  }

  async function handleSubmit() {
    setLoading(true); setError(''); setStep('upload');
    try {
      const token = (await refreshIfNeeded()) ?? '';

      if (photos.length > 0) {
        const params = await nestFetch<CloudinaryParams>(
          NEST_API.RESERVATIONS.ETAT_LIEUX_UPLOAD_PARAMS(reservationId),
          { method: 'GET', token },
        );
        await runUploads(token, params);

        // Le composant confirmait le check-in même si des photos manquaient.
        // Sur une preuve de litige, l'hote doit decider en connaissance de
        // cause : soit reessayer, soit retirer les photos en echec.
        const stillFailed = photos.filter((p) => p.state === 'failed').length;
        if (stillFailed > 0) {
          setError(`${stillFailed} photo${stillFailed > 1 ? 's' : ''} n’a pas pu être envoyée. Réessayez ou retirez-la avant de confirmer.`);
          setLoading(false);
          return;
        }
      }

      setStep('confirm');
      const endpoint = type === 'CHECKIN'
        ? NEST_API.RESERVATIONS.CHECKIN_PROPRIO(reservationId)
        : NEST_API.RESERVATIONS.CHECKOUT_PROPRIO(reservationId);
      await nestFetch(endpoint, { method: 'POST', token });

      photos.forEach((p) => { URL.revokeObjectURL(p.preview); blobs.current.delete(p.preview); });
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
      setLoading(false);
    }
  }

  const progress = photos.length > 0
    ? Math.round((uploadedCount / photos.length) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-forest-950/70 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-card border border-white/10 bg-[linear-gradient(180deg,var(--forest-900)_0%,var(--forest-950)_100%)] text-white shadow-xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-inner bg-marker-bg text-on-inverse-marker">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id={titleId} className="font-display text-base font-semibold leading-tight text-neutral-50">
                {cfg.title}
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-forest-200">{cfg.subtitle}</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            aria-label="Fermer"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-pill text-forest-200 transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="flex items-start gap-3 rounded-inner border border-action/25 bg-action/[0.08] p-3.5">
            <Camera className="mt-0.5 h-4 w-4 shrink-0 text-on-inverse-marker" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-forest-200">
              {/* « Optionnel » sous-vendait l'enjeu : sans photo, aucune preuve
                  n'existe si le voyageur conteste l'etat du logement. */}
              Ces photos sont votre seule preuve en cas de litige. Couvrez chaque
              pièce, y compris ce qui est déjà abîmé.
            </p>
          </div>

          {photos.length === 0 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-3 rounded-card border-2 border-dashed border-white/15 py-10 transition-colors hover:border-action/40 hover:bg-white/[0.04]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-inner bg-white/[0.07] text-forest-200">
                <ImageIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-center">
                <span className="block text-sm font-semibold text-neutral-50">Ajouter des photos</span>
                <span className="mt-0.5 block text-xs text-forest-200">
                  JPEG, PNG, WebP ou HEIC · {MAX_FILE_MB} Mo max
                </span>
              </span>
            </button>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-50">
                  {photos.length} photo{photos.length > 1 ? 's' : ''}
                </p>
                {failedCount > 0 && (
                  <span className="rounded-pill bg-error-500/20 px-2.5 py-1 text-[0.6875rem] font-semibold text-error-500">
                    {failedCount} en échec
                  </span>
                )}
              </div>

              <ul className="grid grid-cols-3 gap-3">
                {photos.map((entry) => (
                  <li key={entry.localId} className="flex flex-col gap-1.5">
                    <div className={cn(
                      'group relative aspect-square overflow-hidden rounded-inner border bg-white/[0.04]',
                      entry.state === 'failed' ? 'border-error-500' : 'border-white/10',
                    )}>
                      <Image src={entry.preview} alt="" fill sizes="120px" className="object-cover" />

                      {entry.state === 'uploading' && (
                        <span className="absolute inset-0 grid place-items-center bg-forest-950/60">
                          <Loader2 className="h-5 w-5 animate-spin text-on-inverse-marker" aria-hidden="true" />
                        </span>
                      )}
                      {entry.state === 'done' && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-pill bg-success-500 text-white">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        </span>
                      )}

                      {/* L'overlay etait en opacity-0 group-hover : sur mobile,
                          impossible de supprimer une photo. */}
                      {!loading && (
                        <button
                          type="button"
                          onClick={() => removePhoto(entry.localId)}
                          aria-label="Retirer cette photo"
                          className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-pill bg-forest-950/80 text-neutral-50 backdrop-blur-sm transition-colors hover:bg-error-600"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    <select
                      value={entry.categorie}
                      onChange={(e) => setCategorie(entry.localId, e.target.value as PhotoCategorie)}
                      disabled={loading}
                      aria-label="Catégorie de la photo"
                      className="w-full rounded-inner border border-white/10 bg-white/[0.06] px-2 py-1.5 text-[0.6875rem] text-forest-200 outline-none focus:border-action/50 disabled:opacity-50"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value} className="bg-forest-950 text-white">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}

                {photos.length < MAX_PHOTOS && !loading && (
                  <li>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-inner border-2 border-dashed border-white/15 transition-colors hover:border-action/40"
                    >
                      <Plus className="h-4 w-4 text-forest-200" aria-hidden="true" />
                      <span className="text-[0.6875rem] text-forest-200">Ajouter</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            // capture="environment" ouvre l'appareil photo arriere sur mobile :
            // l'hote est sur place, il photographie plutot qu'il ne televerse.
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
          />

          {fileWarnings.length > 0 && (
            <ul role="alert" className="space-y-1 rounded-inner bg-warning-500/15 p-3.5 text-xs text-warning-500">
              {fileWarnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          )}

          {loading && photos.length > 0 && (
            <div className="space-y-2.5 rounded-inner border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-xs text-neutral-50">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-on-inverse-marker" aria-hidden="true" />
                  {/* Le compteur derivait d'une progression fixe : il affichait
                      « 3 / 10 » quel que soit l'avancement reel. */}
                  {step === 'confirm' ? 'Confirmation…' : `Envoi ${uploadedCount} / ${photos.length}`}
                </p>
                <p className="text-xs font-semibold tabular-nums text-on-inverse-marker">{progress}%</p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-pill bg-white/10">
                <div
                  className="h-full rounded-pill bg-action"
                  style={{ width: `${progress}%`, transition: 'width 320ms cubic-bezier(0.22,1,0.36,1)' }}
                />
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-inner border border-error-500/30 bg-error-500/15 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-500" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs leading-relaxed text-error-500">{error}</p>
                {failedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-pill border border-error-500/30 px-3 py-1.5 text-[0.6875rem] font-semibold text-error-500 transition-colors hover:bg-error-500/10"
                  >
                    <RotateCw className="h-3 w-3" aria-hidden="true" />
                    Réessayer les {failedCount} en échec
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-white/10 px-6 py-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2.5 rounded-pill bg-action py-3.5 text-sm font-semibold text-on-action transition-colors duration-150 hover:bg-action-hover disabled:opacity-60"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />En cours…</>
              : <><Icon className="h-4 w-4" aria-hidden="true" />{cfg.confirm}</>}
          </button>

          {/* Sans photo, la confirmation reste possible mais l'hote est
              prevenu de ce qu'il perd. */}
          {photos.length === 0 && !loading && (
            <p className="text-center text-xs text-warning-500">
              Aucune photo : vous n’aurez aucune preuve en cas de litige.
            </p>
          )}

          {!loading && (
            <button
              type="button"
              onClick={onCancel}
              className="text-center text-xs text-forest-200 transition-colors hover:text-neutral-50"
            >
              Annuler
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

export function CheckinModal(props: Omit<Props, 'type'>) {
  return <EtatLieuxModal {...props} type="CHECKIN" />;
}

export function CheckoutModal(props: Omit<Props, 'type'>) {
  return <EtatLieuxModal {...props} type="CHECKOUT" />;
}