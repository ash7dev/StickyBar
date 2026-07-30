'use client';

import { useState, useRef } from 'react';
import { ShieldCheck, Calendar, Star, Building2, Camera, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { nestFetch, NEST_API } from '@/lib/nestjs';

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Instant preview using FileReader
      const reader = new FileReader();
      reader.onload = async () => {
        const previewDataUrl = reader.result as string;
        setPhotoUrl(previewDataUrl);

        // 2. Update Supabase user metadata avatar_url
        const supabase = createClient();
        await supabase.auth.updateUser({
          data: { avatar_url: previewDataUrl, photoUrl: previewDataUrl },
        });

        // 3. Update NestJS backend PostgreSQL Utilisateur avatarUrl
        try {
          await nestFetch(NEST_API.USERS.ME, {
            method: 'PATCH',
            body: JSON.stringify({ avatarUrl: previewDataUrl }),
          });
        } catch (e) {
          console.warn('Erreur mise à jour avatar API NestJS:', e);
        }

        if (onPhotoUpdated) {
          onPhotoUpdated(previewDataUrl);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erreur téléversement photo profil:', err);
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
