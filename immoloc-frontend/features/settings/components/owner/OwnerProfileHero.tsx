'use client';

import { useState, useRef } from 'react';
import { ShieldCheck, Calendar, Star, Building2, Camera, Loader2 } from 'lucide-react';
import { nestFetch, NEST_API } from '@/lib/nestjs';
import { createClient } from '@/lib/supabase/client';

interface Props {
  prenom?: string;
  nom?: string;
  email?: string;
  photoUrl?: string;
  activeListingsCount?: number;
  onPhotoUpdated?: (newPhotoUrl: string) => void;
}

export function OwnerProfileHero({
  prenom,
  nom,
  email,
  photoUrl: initialPhotoUrl,
  activeListingsCount = 0,
  onPhotoUpdated,
}: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(initialPhotoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = prenom && nom
    ? `${prenom[0]}${nom[0]}`.toUpperCase()
    : (email?.[0]?.toUpperCase() ?? 'HÔ');

  const fullName = prenom && nom ? `${prenom} ${nom}` : (prenom || 'Propriétaire Klef');

  /**
   * Compresse l'image en JPEG 300x300 et retourne un Blob (~20KB)
   */
  const compressAvatarToBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context not available'));
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            },
            'image/jpeg',
            0.82,
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Compresser l'image en 300x300 JPEG (~20KB)
      const blob = await compressAvatarToBlob(file);

      // 2. Upload sur Supabase Storage (bucket "avatars")
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true, // Écraser l'avatar existant
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // 3. Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Ajouter un cache-buster pour forcer le rafraîchissement
      const avatarPublicUrl = `${publicUrl}?t=${Date.now()}`;

      // 4. Mettre à jour l'URL dans PostgreSQL via NestJS (PAS de base64 !)
      await nestFetch(NEST_API.USERS.ME, {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: avatarPublicUrl }),
      });

      setPhotoUrl(avatarPublicUrl);
      onPhotoUpdated?.(avatarPublicUrl);
    } catch (err) {
      console.error('Erreur téléversement photo profil:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="section-inverse relative overflow-hidden p-6 sm:p-8 shadow-xl transition-all duration-300">
      {/* Halos de fond */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-forest-700/30 rounded-full blur-[70px] pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-lime-400/10 rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Hôte avec Bouton d'upload Caméra */}
          <div className="relative shrink-0 group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-inner bg-forest-950 border-2 border-lime-400/40 text-lime-300 font-display font-extrabold text-2xl sm:text-3xl flex items-center justify-center overflow-hidden shadow-lg relative">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Bouton d'action Téléverser Photo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Modifier la photo de profil"
              title="Ajouter ou modifier ma photo de profil"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-lime-400 hover:bg-lime-300 border-2 border-forest-950 text-forest-950 flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-forest-950" />
            </button>

            {/* File Input Masqué */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-on-inverse-display tracking-tight truncate">
                {fullName}
              </h2>
              <span className="badge-verified shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                Hôte Vérifié
              </span>
            </div>

            <p className="text-xs sm:text-sm text-on-inverse-muted truncate">{email}</p>

            <div className="flex items-center gap-4 text-xs text-on-inverse-muted pt-1 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-lime-400" />
                Membre Klef
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-lime-400" />
                {activeListingsCount} {activeListingsCount > 1 ? 'annonces' : 'annonce'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-pill bg-forest-800/80 border border-border-inverse text-xs font-semibold text-lime-300 shadow-2xs">
            <Star className="w-4 h-4 text-gold-400 fill-gold-400" />
            <span>Hôte d'Élite 5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
