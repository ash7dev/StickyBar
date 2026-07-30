'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ListingPhoto } from '@/lib/nestjs/types';

export const MAX_PHOTOS = 10;
export const MAX_FILE_MB = 8;
export const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** Nombre d'uploads simultanés. Au-delà, on sature les connexions lentes. */
const CONCURRENCY = 3;

export interface LocalPhoto extends ListingPhoto {
    uploading?: boolean;
    uploadError?: string;
    /** Blob local, à révoquer. Absent une fois la photo enregistrée. */
    previewUrl?: string;
}

interface UploadParams {
    uploadUrl: string; signature: string; timestamp: number;
    apiKey: string; cloudName: string; folder: string;
}

export function usePhotoUpload(listingId: string, initial: ListingPhoto[]) {
    const qc = useQueryClient();
    const [photos, setPhotos] = useState<LocalPhoto[]>(initial);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    /*
      Registre des blobs vivants.
  
      L'original n'appelait revokeObjectURL que dans le chemin de succes : un
      echec d'upload, ou un demontage du composant pendant l'envoi, laissait
      l'URL en memoire pour toute la duree de l'onglet. Dix photos de 4 Mo, ca
      fait 40 Mo qui ne sont jamais rendus.
    */
    const blobs = useRef(new Set<string>());

    const releaseBlob = useCallback((url?: string) => {
        if (!url) return;
        URL.revokeObjectURL(url);
        blobs.current.delete(url);
    }, []);

    useEffect(() => {
        const live = blobs.current;
        return () => { live.forEach((u) => URL.revokeObjectURL(u)); live.clear(); };
    }, []);

    /* -- Validation ------------------------------------------------------- */
    // Absente de l'original : n'importe quel fichier partait vers Cloudinary.
    const validate = useCallback((files: File[], currentCount: number) => {
        const accepted: File[] = [];
        const problems: string[] = [];
        const room = MAX_PHOTOS - currentCount;

        for (const f of files) {
            if (accepted.length >= room) {
                problems.push(`Maximum ${MAX_PHOTOS} photos : les suivantes ont été ignorées.`);
                break;
            }
            if (!ACCEPTED.includes(f.type)) {
                problems.push(`${f.name} : format non pris en charge (JPEG, PNG, WebP ou HEIC).`);
                continue;
            }
            if (f.size > MAX_FILE_MB * 1024 * 1024) {
                problems.push(`${f.name} : ${(f.size / 1024 / 1024).toFixed(1)} Mo, au-delà de ${MAX_FILE_MB} Mo.`);
                continue;
            }
            accepted.push(f);
        }
        return { accepted, problems };
    }, []);

    /* -- Upload ----------------------------------------------------------- */
    const upload = useCallback(async (
        fileList: FileList | null,
        categorie: string,
    ) => {
        if (!fileList?.length) return;
        setError(null);

        // photos.length etait lu une fois avant la boucle et ne bougeait plus :
        // les positions pouvaient se chevaucher. On lit l'etat courant.
        let currentCount = 0;
        setPhotos((prev) => { currentCount = prev.length; return prev; });

        const { accepted, problems } = validate(Array.from(fileList), currentCount);
        if (problems.length) setError(problems.join(' '));
        if (!accepted.length) return;

        setBusy(true);

        // Une seule signature pour tout le lot, au lieu d'une requete par fichier.
        let params: UploadParams;
        try {
            params = await nestFetch<UploadParams>(
                NEST_API.LISTINGS.PHOTO_UPLOAD_PARAMS(listingId), { method: 'GET' },
            );
        } catch {
            setError('Impossible de préparer l’envoi. Réessayez.');
            setBusy(false);
            return;
        }

        const noPhotoYet = currentCount === 0;

        const jobs = accepted.map((file, i) => {
            const tempId = `temp-${Date.now()}-${i}`;
            const previewUrl = URL.createObjectURL(file);
            blobs.current.add(previewUrl);

            const temp: LocalPhoto = {
                id: tempId,
                url: previewUrl,
                previewUrl,
                publicId: '',
                categorie: categorie as ListingPhoto['categorie'],
                estPrincipale: noPhotoYet && i === 0,
                position: currentCount + i,
                uploading: true,
            };
            setPhotos((prev) => [...prev, temp]);
            return { file, tempId, previewUrl, temp };
        });

        /*
          Envois paralleles bornes a trois.
    
          L'original enchainait les uploads en for...of avec await : dix photos
          partaient l'une apres l'autre. Tout paralleliser saturerait en revanche
          une connexion mobile. Trois est le compromis.
        */
        let cursor = 0;
        async function worker() {
            while (cursor < jobs.length) {
                const job = jobs[cursor++];
                try {
                    const fd = new FormData();
                    fd.append('file', job.file);
                    fd.append('folder', params.folder);
                    fd.append('signature', params.signature);
                    fd.append('timestamp', String(params.timestamp));
                    fd.append('api_key', params.apiKey);

                    const res = await fetch(params.uploadUrl, { method: 'POST', body: fd });
                    if (!res.ok) throw new Error();
                    const data = await res.json() as { secure_url: string; public_id: string };

                    const saved = await nestFetch<ListingPhoto>(NEST_API.LISTINGS.ADD_PHOTO(listingId), {
                        method: 'POST',
                        body: JSON.stringify({
                            url: data.secure_url,
                            publicId: data.public_id,
                            categorie: job.temp.categorie,
                            estPrincipale: job.temp.estPrincipale,
                            position: job.temp.position,
                        }),
                    });

                    releaseBlob(job.previewUrl);
                    setPhotos((prev) => prev.map((p) => (p.id === job.tempId ? saved : p)));
                } catch {
                    // Le blob est conserve : la vignette reste visible pour que
                    // l'utilisateur voie QUELLE photo a echoue et puisse reessayer.
                    setPhotos((prev) => prev.map((p) =>
                        p.id === job.tempId
                            ? { ...p, uploading: false, uploadError: 'Envoi échoué' }
                            : p,
                    ));
                }
            }
        }

        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
        await qc.invalidateQueries({ queryKey: ['listing-owner', listingId] });
        setBusy(false);
    }, [listingId, qc, validate, releaseBlob]);

    /* -- Suppression ------------------------------------------------------ */
    const remove = useCallback(async (photo: LocalPhoto) => {
        if (photo.uploading) return;

        // Une photo en echec n'existe pas cote serveur : on la retire localement.
        if (photo.uploadError) {
            releaseBlob(photo.previewUrl);
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            return;
        }

        try {
            await nestFetch(NEST_API.LISTINGS.REMOVE_PHOTO(listingId, photo.id), { method: 'DELETE' });

            let promote: LocalPhoto | undefined;
            setPhotos((prev) => {
                const rest = prev.filter((p) => p.id !== photo.id);
                // Supprimer la couverture laissait l'annonce SANS photo principale.
                if (photo.estPrincipale && rest.length && !rest.some((p) => p.estPrincipale)) {
                    promote = rest[0];
                    return rest.map((p, i) => (i === 0 ? { ...p, estPrincipale: true } : p));
                }
                return rest;
            });

            if (promote) {
                await nestFetch(NEST_API.LISTINGS.SET_MAIN_PHOTO(listingId, promote.id), { method: 'PATCH' });
            }
            releaseBlob(photo.previewUrl);
            await qc.invalidateQueries({ queryKey: ['listing-owner', listingId] });
        } catch {
            setError('Impossible de supprimer la photo.');
        }
    }, [listingId, qc, releaseBlob]);

    /* -- Photo principale -------------------------------------------------- */
    const setMain = useCallback(async (photo: LocalPhoto) => {
        if (photo.uploading || photo.uploadError || photo.estPrincipale) return;
        const previous = photo.id;
        setPhotos((prev) => prev.map((p) => ({ ...p, estPrincipale: p.id === previous })));
        try {
            await nestFetch(NEST_API.LISTINGS.SET_MAIN_PHOTO(listingId, photo.id), { method: 'PATCH' });
            await qc.invalidateQueries({ queryKey: ['listing-owner', listingId] });
        } catch {
            setError('Impossible de définir la photo de couverture.');
            setPhotos(initial);
        }
    }, [listingId, qc, initial]);

    return { photos, error, busy, upload, remove, setMain, setError };
}