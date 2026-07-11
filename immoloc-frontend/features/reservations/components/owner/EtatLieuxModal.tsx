'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  X, Plus, CheckCircle2, LogOut, Trash2,
  Camera, Loader2, AlertTriangle, ImageIcon,
} from 'lucide-react';
import { useNestToken } from '@/features/auth/hooks/use-nest-token';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { PhotoCategorie } from '@/lib/nestjs/types';
import { cn } from '@/lib/utils/cn';

/* ─── Types ───────────────────────────────────────────────────────────────── */

type ModalType = 'CHECKIN' | 'CHECKOUT';

interface PhotoEntry {
  localId: string;
  file: File;
  preview: string;
  categorie: PhotoCategorie;
}

interface Props {
  reservationId: string;
  type: ModalType;
  onSuccess: () => void;
  onCancel: () => void;
}

/* ─── Config ──────────────────────────────────────────────────────────────── */

const CATEGORIES: { value: PhotoCategorie; label: string }[] = [
  { value: 'ENTREE',        label: 'Entrée'        },
  { value: 'SALON',         label: 'Salon'          },
  { value: 'CHAMBRE',       label: 'Chambre'        },
  { value: 'CUISINE',       label: 'Cuisine'        },
  { value: 'SALLE_DE_BAIN', label: 'Salle de bain'  },
  { value: 'TERRASSE',      label: 'Terrasse'       },
  { value: 'PISCINE',       label: 'Piscine'        },
  { value: 'VUE',           label: 'Vue'            },
  { value: 'AUTRE',         label: 'Autre'          },
];

const CFG = {
  CHECKIN: {
    title:        'Check-in propriétaire',
    subtitle:     'Photographiez l\'état du logement avant l\'arrivée du locataire.',
    confirmLabel: 'Confirmer le check-in',
    icon:         CheckCircle2,
    iconBg:       'bg-emerald-50 border-emerald-100',
    iconColor:    'text-emerald-600',
    btn:          'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
    bar:          'bg-emerald-500',
    dot:          'bg-emerald-500',
  },
  CHECKOUT: {
    title:        'Check-out propriétaire',
    subtitle:     'Photographiez l\'état du logement après le départ du locataire.',
    confirmLabel: 'Confirmer le check-out',
    icon:         LogOut,
    iconBg:       'bg-emerald-50 border-emerald-100',
    iconColor:    'text-emerald-600',
    btn:          'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
    bar:          'bg-emerald-500',
    dot:          'bg-emerald-500',
  },
} as const;

/* ─── Types signature Cloudinary ──────────────────────────────────────────── */

interface CloudinaryParams {
  uploadUrl: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  folder: string;
}

/* ─── Compression client-side (Canvas) ───────────────────────────────────── */

function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

/* ─── Upload direct Cloudinary ────────────────────────────────────────────── */

async function uploadToCloudinary(
  file: File,
  params: CloudinaryParams,
): Promise<{ url: string; publicId: string }> {
  const compressed = await compressImage(file);

  const fd = new FormData();
  fd.append('file',      compressed);
  fd.append('folder',    params.folder);
  fd.append('signature', params.signature);
  fd.append('timestamp', String(params.timestamp));
  fd.append('api_key',   params.apiKey);

  const res = await fetch(params.uploadUrl, { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Cloudinary : ${err?.error?.message ?? res.statusText}`);
  }
  const data = await res.json() as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id };
}

/* ─── Modal ───────────────────────────────────────────────────────────────── */

function EtatLieuxModal({ reservationId, type, onSuccess, onCancel }: Props) {
  const cfg = CFG[type];
  const Icon = cfg.icon;
  const { refreshIfNeeded } = useNestToken();

  const fileInputRef                = useRef<HTMLInputElement>(null);
  const [photos, setPhotos]         = useState<PhotoEntry[]>([]);
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [error, setError]           = useState('');

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const entries: PhotoEntry[] = Array.from(files).map((file) => ({
      localId:   crypto.randomUUID(),
      file,
      preview:   URL.createObjectURL(file),
      categorie: 'AUTRE' as PhotoCategorie,
    }));
    setPhotos((prev) => [...prev, ...entries]);
  }, []);

  const removePhoto = useCallback((localId: string) => {
    setPhotos((prev) => {
      const entry = prev.find((p) => p.localId === localId);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((p) => p.localId !== localId);
    });
  }, []);

  const changeCategorie = useCallback((localId: string, categorie: PhotoCategorie) => {
    setPhotos((prev) => prev.map((p) => p.localId === localId ? { ...p, categorie } : p));
  }, []);

  async function handleSubmit() {
    setLoading(true); setError(''); setProgress(0);
    try {
      const token = (await refreshIfNeeded()) ?? '';

      /* 1 — Une seule signature pour tous les fichiers */
      const params = await nestFetch<CloudinaryParams>(
        NEST_API.RESERVATIONS.ETAT_LIEUX_UPLOAD_PARAMS(reservationId),
        { method: 'GET', token },
      );
      setProgress(10);

      /* 2 — Upload parallèle direct vers Cloudinary */
      const uploaded = await Promise.all(
        photos.map((entry) => uploadToCloudinary(entry.file, params).then((result) => ({ ...entry, ...result }))),
      );
      setProgress(70);

      /* 3 — Enregistrement parallèle côté backend */
      await Promise.all(
        uploaded.map((entry) =>
          nestFetch(NEST_API.RESERVATIONS.ADD_ETAT_LIEUX(reservationId), {
            method: 'POST',
            token,
            body: JSON.stringify({ type, categorie: entry.categorie, url: entry.url, publicId: entry.publicId }),
          }),
        ),
      );
      setProgress(90);

      /* 4 — Confirmation check-in / check-out propriétaire */
      const endpoint = type === 'CHECKIN'
        ? NEST_API.RESERVATIONS.CHECKIN_PROPRIO(reservationId)
        : NEST_API.RESERVATIONS.CHECKOUT_PROPRIO(reservationId);

      await nestFetch(endpoint, { method: 'POST', token });
      setProgress(100);
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      onSuccess();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-black/10 flex flex-col max-h-[90dvh] overflow-hidden">

        {/* ── En-tête ── */}
        <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0',
              cfg.iconBg,
            )}>
              <Icon className={cn('w-5 h-5', cfg.iconColor)} />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900 leading-tight">{cfg.title}</h2>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{cfg.subtitle}</p>
            </div>
          </div>
          {!loading && (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border shrink-0" />

        {/* ── Corps scrollable ── */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">

          {/* Section photos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-neutral-800">Photos état des lieux</p>
                <p className="text-xs text-neutral-400 mt-0.5">Optionnel — recommandé en cas de litige</p>
              </div>
              {photos.length > 0 && (
                <span className="text-[10px] font-black text-neutral-400 bg-neutral-100 border border-border px-2.5 py-1 rounded-full">
                  {photos.length} / ∞
                </span>
              )}
            </div>

            {/* Grille */}
            <div className="grid grid-cols-3 gap-3">
              {photos.map((entry) => (
                <div key={entry.localId} className="flex flex-col gap-1.5">
                  {/* Thumbnail */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-100 border border-border group">
                    <Image
                      src={entry.preview}
                      alt={entry.categorie}
                      fill
                      className="object-cover"
                    />
                    {/* Overlay remove */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removePhoto(entry.localId)}
                        className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-50 hover:border-rose-200 shadow-sm"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      </button>
                    </div>
                  </div>
                  {/* Catégorie */}
                  <select
                    value={entry.categorie}
                    onChange={(e) => changeCategorie(entry.localId, e.target.value as PhotoCategorie)}
                    className="w-full text-[10px] font-bold text-neutral-600 bg-neutral-50 border border-border rounded-lg px-2 py-1.5 outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Bouton ajouter */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-border hover:border-emerald-300 bg-neutral-50 hover:bg-emerald-50 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-border group-hover:border-emerald-200 group-hover:bg-emerald-50 flex items-center justify-center transition-all duration-200 mb-1.5 shadow-sm">
                  <Plus className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <span className="text-[10px] font-bold text-neutral-400 group-hover:text-emerald-500 transition-colors">
                  Ajouter
                </span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Empty state photos */}
          {photos.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-10 rounded-2xl border-2 border-dashed border-border hover:border-emerald-300 bg-neutral-50 hover:bg-emerald-50 transition-all duration-200 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-border group-hover:border-emerald-200 flex items-center justify-center shadow-sm transition-colors">
                <ImageIcon className="w-5 h-5 text-neutral-300 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-neutral-500 group-hover:text-emerald-600 transition-colors">
                  Ajouter des photos
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">JPG, PNG, WebP · Plusieurs fichiers acceptés</p>
              </div>
            </button>
          )}

          {/* Barre de progression */}
          {loading && (
            <div className="space-y-2.5 bg-neutral-50 border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin" />
                  <p className="text-xs font-bold text-neutral-600">
                    {progress < 88 && photos.length > 0
                      ? `Upload des photos… (${Math.ceil(progress / (88 / Math.max(photos.length, 1)))} / ${photos.length})`
                      : 'Confirmation en cours…'}
                  </p>
                </div>
                <p className="text-xs font-black text-neutral-400 tabular-nums">{progress}%</p>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', cfg.bar)}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-rose-700 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Note */}
          <div className="flex items-start gap-3 bg-neutral-50 border border-border rounded-2xl p-4">
            <Camera className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-400 leading-relaxed">
              Les photos constituent une preuve en cas de litige. Couvrez toutes les pièces pour une protection optimale des deux parties.
            </p>
          </div>

        </div>

        {/* ── Pied de page ── */}
        <div className="px-7 pb-7 pt-5 border-t border-border shrink-0 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 py-3.5 text-white text-sm font-black rounded-2xl shadow-lg transition-all duration-200 disabled:opacity-60 active:scale-[0.98]',
              cfg.btn,
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                En cours…
              </>
            ) : (
              <>
                <Icon className="w-4 h-4" />
                {cfg.confirmLabel}
              </>
            )}
          </button>

          {!loading && (
            <button
              onClick={onCancel}
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 transition-colors text-center"
            >
              Annuler
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Exports nommés ──────────────────────────────────────────────────────── */

export function CheckinModal(props: Omit<Props, 'type'>) {
  return <EtatLieuxModal {...props} type="CHECKIN" />;
}

export function CheckoutModal(props: Omit<Props, 'type'>) {
  return <EtatLieuxModal {...props} type="CHECKOUT" />;
}
