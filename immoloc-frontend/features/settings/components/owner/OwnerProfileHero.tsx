'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ShieldCheck, Calendar, Star, Building2, Camera, Loader2, AlertTriangle } from 'lucide-react';
import { nestFetch, NEST_API } from '@/lib/nestjs';
import { createClient } from '@/lib/supabase/client';

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const AVATAR_SIZE = 300;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

interface Props {
  prenom?: string;
  nom?: string;
  email?: string;
  photoUrl?: string;
  activeListingsCount?: number;
  /** Statut KYC réel. Sans lui, aucun badge « vérifié » n'est affiché. */
  isVerified?: boolean;
  /** Note moyenne réelle. Sans elle, aucun badge de note. */
  note?: number | null;
  totalAvis?: number;
  /** ISO. Affiche « Membre depuis … » plutôt qu'un libellé vide de sens. */
  memberSince?: string | null;
  onPhotoUpdated?: (newPhotoUrl: string) => void;
}

export function OwnerProfileHero({
  prenom,
  nom,
  email,
  photoUrl: initialPhotoUrl,
  activeListingsCount = 0,
  isVerified = false,
  note = null,
  totalAvis = 0,
  memberSince = null,
  onPhotoUpdated,
}: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialPhotoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /* La photo ne se resynchronisait jamais avec la prop après un refetch. */
  useEffect(() => setPhotoUrl(initialPhotoUrl), [initialPhotoUrl]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 8_000);
    return () => clearTimeout(timer);
  }, [error]);

  const initials =
    (prenom?.[0] ?? email?.[0] ?? '?').toUpperCase() + (nom?.[0]?.toUpperCase() ?? '');
  const fullName = [prenom, nom].filter(Boolean).join(' ') || 'Propriétaire Klef';

  const memberLabel = memberSince
    ? `Membre depuis ${new Date(memberSince).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
    : null;

  /* ── Compression ─────────────────────────────────────────────────────── */

  const compressAvatar = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();

      /* `readAsDataURL` chargeait tout le fichier en mémoire sous forme de
         chaîne base64 — un tiers plus lourd que le fichier lui-même. Un
         objectURL évite la copie, et on le révoque dans tous les cas. */
      const cleanup = () => URL.revokeObjectURL(objectUrl);

      img.onload = () => {
        const ratio = Math.min(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height, 1);
        const width = Math.round(img.width * ratio);
        const height = Math.round(img.height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { cleanup(); reject(new Error('Traitement de l’image impossible.')); return; }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            blob ? resolve(blob) : reject(new Error('La conversion de l’image a échoué.'));
          },
          'image/jpeg',
          0.82,
        );
      };

      /* `img.onerror` rejetait avec un Event, pas une Error : le message
         remonté au catch était inexploitable. */
      img.onerror = () => {
        cleanup();
        reject(new Error('Ce fichier n’a pas pu être lu comme une image.'));
      };

      img.src = objectUrl;
    });
  }, []);

  /* ── Upload ──────────────────────────────────────────────────────────── */

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    /* Sans reset, resélectionner le même fichier après un échec ne déclenche
       aucun `change`. */
    e.target.value = '';
    if (!file) return;

    setError(null);

    /* `accept` n'est qu'un filtre de boîte de dialogue, pas une validation. */
    if (!ACCEPTED.includes(file.type)) {
      setError('Formats acceptés : JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Image trop lourde. Choisissez un fichier de moins de 8 Mo.');
      return;
    }

    setIsUploading(true);
    try {
      const blob = await compressAvatar(file);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session expirée. Reconnectez-vous.');

      const filePath = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        });
      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarPublicUrl = `${publicUrl}?t=${Date.now()}`;

      await nestFetch(NEST_API.USERS.ME, {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: avatarPublicUrl }),
      });

      if (!mounted.current) return;
      setPhotoUrl(avatarPublicUrl);
      onPhotoUpdated?.(avatarPublicUrl);
    } catch (err) {
      if (!mounted.current) return;
      /* `console.error` seul : l'utilisateur voyait le spinner s'arrêter
         sans jamais savoir pourquoi rien ne s'était passé. */
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Le téléversement a échoué. Réessayez dans un instant.',
      );
    } finally {
      if (mounted.current) setIsUploading(false);
    }
  }, [compressAvatar, onPhotoUpdated]);

  return (
    <section className="section-inverse relative overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-pill bg-forest-700/40 blur-3xl"
      />

      <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">

        <div className="flex min-w-0 items-center gap-5">

          {/* ── Avatar ───────────────────────────────────────────────────── */}

          <div className="relative shrink-0">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-inner border border-border-inverse bg-forest-800 font-display text-2xl font-semibold text-neutral-50 sm:h-24 sm:w-24 sm:text-3xl">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt=""
                  fill
                  sizes="96px"
                  unoptimized
                  className="object-cover"
                />
              ) : initials}

              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-forest-950/70">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-50" aria-hidden="true" />
                  <span className="sr-only">Téléversement en cours…</span>
                </div>
              )}
            </div>

            {/* ★ Seul aplat lime de la carte : la seule action cliquable. */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Modifier la photo de profil"
              className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-pill border-2 border-surface-inverse bg-action text-on-action transition-[background-color,transform] hover:bg-action-hover active:scale-[0.95] disabled:opacity-60"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              onChange={handleFileChange}
              className="sr-only"
            />
          </div>

          {/* ── Identité ─────────────────────────────────────────────────── */}

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="truncate font-display text-xl font-semibold tracking-tight text-on-inverse-display sm:text-2xl">
                {fullName}
              </h1>
              {/* Affiché uniquement si le KYC est réellement validé. */}
              {isVerified && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-gold-400/30 bg-gold-400/12 px-2.5 py-0.5 text-xs font-semibold text-gold-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Hôte vérifié
                </span>
              )}
            </div>

            {email && (
              <p className="truncate text-xs text-on-inverse-muted sm:text-sm">{email}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-on-inverse-muted">
              {memberLabel && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {memberLabel}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="tabular-nums">{activeListingsCount}</span>{' '}
                {activeListingsCount > 1 ? 'annonces' : 'annonce'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Note réelle ────────────────────────────────────────────────── */}

        {note != null && totalAvis > 0 && (
          <div className="flex shrink-0 items-center gap-2 self-start rounded-pill border border-border-inverse bg-white/5 px-4 py-2 text-xs font-semibold text-on-inverse sm:self-center">
            <Star className="h-4 w-4 fill-gold-400 text-gold-400" aria-hidden="true" />
            <span className="tabular-nums">{note.toFixed(1)}</span>
            <span className="font-normal text-on-inverse-muted tabular-nums">
              ({totalAvis} avis)
            </span>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="relative mt-4 flex items-start gap-2 rounded-inner border border-error-500/30 bg-error-500/15 p-3 text-xs leading-relaxed text-error-50"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error-500" aria-hidden="true" />
          {error}
        </p>
      )}
    </section>
  );
}