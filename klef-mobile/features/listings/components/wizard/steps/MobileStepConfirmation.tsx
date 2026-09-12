import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  Home,
  Zap,
  CircleDollarSign,
  Camera,
  MapPin,
  Sparkles,
  ShieldCheck,
  Moon,
  Film,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadows, typography } from '../../../../../shared/theme/tokens';
import { useListingWizardFormStore } from '../../../stores/useListingWizardFormStore';
import { apiClient } from '../../../../../shared/api/api-client';

const MARKUP = 1.07;

const TYPE_LABELS: Record<string, string> = {
  APPARTEMENT: 'Appartement',
  VILLA: 'Villa',
  CHAMBRE: 'Chambre',
  AUTRES: 'Autres',
};

const fcfa = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));

function SummaryRow({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIconCircle}>
        <Icon size={16} color={colors.forest[800]} />
      </View>
      <View style={styles.summaryTextStack}>
        <Text style={styles.summaryLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.summaryValue} numberOfLines={1}>
          {value}
        </Text>
        {hint && <Text style={styles.summaryHint}>{hint}</Text>}
      </View>
    </View>
  );
}

function uploadMediaToCloudinary(
  uploadUrl: string,
  uri: string,
  filename: string,
  mimeType: string,
  params: { folder: string; signature: string; timestamp: number; apiKey: string; transformation?: string },
  onProgress?: (percent: number) => void
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    if (!uri || typeof uri !== 'string') {
      return reject(new Error("L'URI du fichier média est invalide."));
    }

    const formData = new FormData();

    if (Platform.OS === 'web') {
      if (uri.startsWith('data:')) {
        const arr = uri.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const fileObj = typeof File !== 'undefined' ? new File([blob], filename, { type: mime }) : blob;
        formData.append('file', fileObj as any);
      } else if (uri.startsWith('blob:')) {
        fetch(uri)
          .then((res) => res.blob())
          .then((blob) => {
            const fileObj = typeof File !== 'undefined' ? new File([blob], filename, { type: mimeType || blob.type || 'image/jpeg' }) : blob;
            formData.append('file', fileObj as any);
            sendXHR();
          })
          .catch((err) => {
            reject(new Error(`Impossible de lire le fichier web : ${err.message}`));
          });
        return;
      } else {
        formData.append('file', { uri, name: filename, type: mimeType } as any);
      }
    } else {
      let cleanUri = uri;
      if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://') && !cleanUri.startsWith('http')) {
        cleanUri = `file://${cleanUri}`;
      }
      formData.append('file', {
        uri: cleanUri,
        name: filename || 'media.jpg',
        type: mimeType || 'image/jpeg',
      } as any);
    }

    function sendXHR() {
      formData.append('folder', params.folder);
      formData.append('signature', params.signature);
      formData.append('timestamp', String(params.timestamp));
      formData.append('api_key', params.apiKey);
      if (params.transformation) {
        formData.append('transformation', params.transformation);
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.secure_url) {
              resolve({ secure_url: res.secure_url, public_id: res.public_id });
            } else {
              reject(new Error(res.error?.message || 'Réponse Cloudinary non conforme.'));
            }
          } catch {
            reject(new Error('Réponse illisible du service Cloudinary.'));
          }
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error?.message || `Erreur Cloudinary (HTTP ${xhr.status})`));
          } catch {
            reject(new Error(`Transfert Cloudinary échoué (HTTP ${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Connexion réseau interrompue pendant l’envoi vers Cloudinary.'));
      xhr.ontimeout = () => reject(new Error('Délai dépassé pendant l’envoi vers Cloudinary.'));
      xhr.timeout = 180000;

      xhr.send(formData);
    }

    if (Platform.OS !== 'web' || (!uri.startsWith('blob:') && !uri.startsWith('data:'))) {
      sendXHR();
    }
  });
}

export function MobileStepConfirmation() {
  const router = useRouter();
  const {
    bien,
    annonce,
    equipements,
    conditions,
    photos,
    video,
    tarifsPersonnes,
    tarifsNuits,
    draftListingId,
    setDraftListingId,
    updatePhoto,
    reset,
  } = useListingWizardFormStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('Préparation…');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const principalPhoto = photos.find((p) => p.estPrincipale) ?? photos[0];
  const prixBase = Number(annonce.prixBase) || 0;
  const prixPublic = Math.round(prixBase * MARKUP);
  const nbEquip = equipements.length;
  const nbPhotos = photos.length;
  const nuits = annonce.nuitesMinimum ?? 1;

  const handleFinalSubmit = async () => {
    if (photos.length < 1) {
      Alert.alert(
        'Photo requise',
        'Veuillez ajouter au moins 1 photo de couverture pour continuer.'
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsSubmitting(true);
    setSubmitError(null);
    setProgressPercent(5);
    setProgressStatus('Création de l’annonce sur Klef…');

    try {
      let listingId = draftListingId;

      // 1. Validation du type selon enum TypeLogement Prisma
      const VALID_TYPES = ['APPARTEMENT', 'STUDIO', 'VILLA', 'CHAMBRE', 'DUPLEX', 'PENTHOUSE'];
      const rawType = (bien.type || '').toUpperCase();
      let safeType = VALID_TYPES.includes(rawType) ? rawType : 'APPARTEMENT';
      if (rawType === 'AUTRES') {
        const stLower = (bien.sousType || '').toLowerCase();
        if (stLower.includes('duplex')) safeType = 'DUPLEX';
        else if (stLower.includes('penthouse')) safeType = 'PENTHOUSE';
        else if (stLower.includes('studio')) safeType = 'STUDIO';
        else safeType = 'APPARTEMENT';
      }

      // 2. Validation du sousType
      const safeSousType = bien.sousType && bien.sousType.trim().length > 0 ? bien.sousType.trim() : undefined;

      // 3. Mapping des équipements sélectionnés vers les UUIDs backend
      let equipementIds: string[] | undefined = undefined;
      try {
        const equipRes = await apiClient.get('/listings/equipements');
        const allEquips: Array<{ id: string; nom: string }> = equipRes.data?.data || equipRes.data || [];
        if (Array.isArray(allEquips) && allEquips.length > 0 && Array.isArray(equipements) && equipements.length > 0) {
          const matchedIds = allEquips
            .filter((eq) =>
              equipements.some((selName) => {
                const s1 = selName.toLowerCase().trim();
                const s2 = eq.nom.toLowerCase().trim();
                return s1 === s2 || s1.includes(s2) || s2.includes(s1);
              })
            )
            .map((eq) => eq.id);
          if (matchedIds.length > 0) {
            equipementIds = matchedIds;
          }
        }
      } catch (e) {
        console.warn('[MobileStepConfirmation] Échec de la récupération des équipements :', e);
      }

      // 4. Payload strict conforme à CreateLogementDto
      const payload: Record<string, any> = {
        titre: (annonce.titre && annonce.titre.trim()) || `${safeType} à ${bien.ville || 'Dakar'}`,
        description: (annonce.description && annonce.description.trim()) || `Superbe ${safeType} situé à ${bien.ville || 'Dakar'}`,
        type: safeType,
        ...(safeSousType && { sousType: safeSousType }),
        nombreChambres: Math.max(0, Number(bien.nombreChambres) || 1),
        nombreSallesBain: Math.max(0, Number(bien.nombreSallesBain) || 1),
        nombrePieces: Math.max(1, Number(bien.nombrePieces) || 1),
        capaciteMax: Math.max(1, Math.min(50, Number(bien.capaciteMax) || 1)),
        personnesBase: Math.max(1, Math.min(50, Number(bien.capaciteMax) || 1)),
        ville: (bien.ville && bien.ville.trim()) || 'Dakar',
        adresse: (bien.adresse && bien.adresse.trim()) || 'Dakar',
        prixBase: Math.max(0, Number(annonce.prixBase) || 45000),
        nuitesMinimum: Math.max(1, Number(annonce.nuitesMinimum) || 1),
        ...(typeof bien.latitude === 'number' && !isNaN(bien.latitude) && { latitude: bien.latitude }),
        ...(typeof bien.longitude === 'number' && !isNaN(bien.longitude) && { longitude: bien.longitude }),
        ...(conditions.reglesMaison?.trim() && { reglesMaison: conditions.reglesMaison.trim() }),
        ...(conditions.instructionsAcces?.trim() && { instructionsAcces: conditions.instructionsAcces.trim() }),
        ...(conditions.nomReseauWifi?.trim() && { nomReseauWifi: conditions.nomReseauWifi.trim() }),
        ...(conditions.codeWifi?.trim() && { codeWifi: conditions.codeWifi.trim() }),
        ...(conditions.instructionsDigicode?.trim() && { instructionsDigicode: conditions.instructionsDigicode.trim() }),
        ...(conditions.regimeElectricite?.trim() && { regimeElectricite: conditions.regimeElectricite.trim() }),
        ...(conditions.detailsElectricite?.trim() && { detailsElectricite: conditions.detailsElectricite.trim() }),
        ...(equipementIds && equipementIds.length > 0 && { equipementIds }),
      };

      if (!listingId) {
        const createdRes = await apiClient.post('/listings', payload);
        listingId = createdRes.data?.data?.id || createdRes.data?.id;
        if (listingId) {
          setDraftListingId(listingId);
        }
      } else {
        await apiClient.patch(`/listings/${listingId}`, payload);
      }

      if (!listingId) {
        throw new Error("Impossible d'initialiser l'annonce sur le serveur.");
      }

      // 5. Transferts et enregistrements secondaires EN PARALLÈLE pour une vitesse maximale
      setProgressPercent(15);
      setProgressStatus(`Transfert simultané des photos, vidéos et données…`);

      const secondaryTasks: Promise<any>[] = [];

      // A. Tâche Photos (Upload parallèle Cloudinary + enregistrement BDD)
      const photosTask = (async () => {
        const photoParamsRes = await apiClient.get(`/listings/${listingId}/photos/upload-params`);
        const photoParams = photoParamsRes.data?.data || photoParamsRes.data;
        const VALID_CATS = ['SALON', 'CHAMBRE', 'CUISINE', 'SALLE_DE_BAIN', 'TERRASSE', 'VUE', 'ENTREE', 'PISCINE', 'AUTRE'];

        let completedCount = 0;
        const individualProgress: number[] = new Array(photos.length).fill(0);

        const updatePhotoProgress = () => {
          const avgPct = individualProgress.reduce((a, b) => a + b, 0) / photos.length;
          const currentPct = 15 + Math.round((avgPct / 100) * 70);
          setProgressPercent(Math.min(90, currentPct));
          setProgressStatus(`Transfert photos en parallèle : ${completedCount}/${photos.length} (${Math.round(avgPct)}%)`);
        };

        const uploadSinglePhoto = async (photo: typeof photos[0], i: number) => {
          let finalUrl = photo.url;
          let publicId = (photo as any).publicId;

          if (!finalUrl && photo.uri) {
            const filename = photo.uri.split('/').pop() || `photo_${i}_${Date.now()}.jpg`;
            const match = /\.(\w+)$/.exec(filename);
            const mimeType = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';

            const uploaded = await uploadMediaToCloudinary(
              photoParams.uploadUrl,
              photo.uri,
              filename,
              mimeType,
              photoParams,
              (pct) => {
                individualProgress[i] = pct;
                updatePhotoProgress();
              }
            );

            finalUrl = uploaded.secure_url;
            publicId = uploaded.public_id;
          }

          individualProgress[i] = 100;

          if (finalUrl && !photo.url) {
            const rawCat = (photo.categorie || 'AUTRE').toUpperCase();
            const safeCat = VALID_CATS.includes(rawCat) ? rawCat : 'AUTRE';

            await apiClient.post(`/listings/${listingId}/photos`, {
              url: finalUrl,
              publicId: publicId || `photo_${Date.now()}_${i}`,
              categorie: safeCat,
              estPrincipale: photo.estPrincipale,
              position: photo.position ?? i,
            });

            updatePhoto(i, { url: finalUrl });
          }

          completedCount++;
          updatePhotoProgress();
        };

        await Promise.all(photos.map((photo, i) => uploadSinglePhoto(photo, i)));
      })();

      secondaryTasks.push(photosTask);

      // B. Tâche Vidéo (si présente, en parallèle des photos)
      if (video?.uri && !video.uri.startsWith('http')) {
        const videoTask = (async () => {
          const videoParamsRes = await apiClient.get(`/listings/${listingId}/video/upload-params`);
          const videoParams = videoParamsRes.data?.data || videoParamsRes.data;

          const vFilename = video.name || video.uri.split('/').pop() || `video_${Date.now()}.mp4`;
          const vMatch = /\.(\w+)$/.exec(vFilename);
          const vMimeType = vMatch ? `video/${vMatch[1]}` : 'video/mp4';

          const vUploaded = await uploadMediaToCloudinary(
            videoParams.uploadUrl,
            video.uri,
            vFilename,
            vMimeType,
            videoParams,
            (pct) => {
              setProgressStatus(`Envoi vidéo de visite en parallèle (${pct}%)…`);
            }
          );

          await apiClient.patch(`/listings/${listingId}`, {
            videoUrl: vUploaded.secure_url,
            videoPublicId: vUploaded.public_id,
          });
        })();

        secondaryTasks.push(videoTask);
      }

      // C. Tâche Tarifs Personnes (en parallèle)
      if (Array.isArray(tarifsPersonnes) && tarifsPersonnes.length > 0) {
        secondaryTasks.push(apiClient.post(`/listings/${listingId}/tarifs-personnes`, { tarifs: tarifsPersonnes }));
      }

      // D. Tâche Tarifs Nuits (en parallèle)
      if (Array.isArray(tarifsNuits) && tarifsNuits.length > 0) {
        secondaryTasks.push(apiClient.post(`/listings/${listingId}/tarifs-nuits`, { tarifs: tarifsNuits }));
      }

      // E. Tâche Équipements (en parallèle)
      if (equipementIds && equipementIds.length > 0) {
        secondaryTasks.push(apiClient.put(`/listings/${listingId}/equipements`, { equipementIds }));
      }

      // Attendre la fin de l'ensemble des téléversements et sauvegardes simultanés
      await Promise.all(secondaryTasks);

      // 6. Soumission finale pour validation (DRAFT -> PENDING_REVIEW)
      setProgressPercent(95);
      setProgressStatus('Soumission finale à l’équipe de modération Klef…');

      await apiClient.patch(`/listings/${listingId}/submit`);

      setProgressPercent(100);
      setProgressStatus('Annonce transmise avec succès ! 🎉');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      setTimeout(() => {
        setIsSubmitting(false);
        reset();
        router.replace('/(owner)/listings' as any);
      }, 1000);
    } catch (err: any) {
      console.warn('[MobileStepConfirmation] Erreur lors de la soumission :', err);

      let errorMsg = 'Une erreur est survenue lors de l’envoi de votre annonce.';

      if (err?.response?.data) {
        const data = err.response.data;
        if (Array.isArray(data.details) && data.details.length > 0) {
          errorMsg = data.details.join('\n• ');
        } else if (Array.isArray(data.message) && data.message.length > 0) {
          errorMsg = data.message.join('\n• ');
        } else if (typeof data.message === 'string') {
          errorMsg = data.message;
        }
      } else if (err?.message) {
        errorMsg = err.message;
      }

      setSubmitError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Summary Card Container ──────────────────────────────────── */}
      <View style={styles.card}>
        {/* Cover Hero Preview */}
        {principalPhoto ? (
          <View style={styles.heroPreview}>
            <Image source={{ uri: principalPhoto.uri }} style={styles.heroImage} />
            <View style={styles.heroOverlay} />

            <View style={styles.apercuBadge}>
              <Sparkles size={13} color={colors.neutral[0]} />
              <Text style={styles.apercuBadgeText}>Aperçu</Text>
            </View>

            <View style={styles.heroBottomContent}>
              <View style={styles.heroTagsRow}>
                <View style={styles.typeTag}>
                  <Text style={styles.typeTagText}>
                    {bien.sousType ?? TYPE_LABELS[bien.type ?? ''] ?? 'Logement'}
                  </Text>
                </View>
                {bien.ville ? (
                  <View style={styles.cityTag}>
                    <MapPin size={11} color="rgba(255, 255, 255, 0.9)" />
                    <Text style={styles.cityTagText}>{bien.ville}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.heroTitle} numberOfLines={2}>
                {annonce.titre || `${bien.type} à ${bien.ville}`}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyHero}>
            <Camera size={32} color={colors.neutral[400]} />
            <Text style={styles.emptyHeroText}>Aucune photo de couverture</Text>
          </View>
        )}

        {/* 2-Column Summary Table Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <SummaryRow
                icon={CircleDollarSign}
                label="Votre prix"
                value={`${fcfa(prixBase)} FCFA / nuit`}
                hint={`Affiché ${fcfa(prixPublic)} FCFA aux voyageurs`}
              />
            </View>
            <View style={styles.gridCol}>
              <SummaryRow
                icon={Home}
                label="Capacité"
                value={`${bien.capaciteMax ?? '—'} personnes`}
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <SummaryRow
                icon={Camera}
                label="Photos"
                value={`${nbPhotos} photo${nbPhotos > 1 ? 's' : ''}`}
              />
            </View>
            <View style={styles.gridCol}>
              <SummaryRow
                icon={Film}
                label="Visite vidéo"
                value={video?.uri ? 'Ajoutée' : 'Aucune'}
              />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <SummaryRow
                icon={Zap}
                label="Équipements"
                value={`${nbEquip} sélectionné${nbEquip > 1 ? 's' : ''}`}
              />
            </View>
            <View style={styles.gridCol}>
              <SummaryRow
                icon={Moon}
                label="Séjour minimum"
                value={`${nuits} nuit${nuits > 1 ? 's' : ''}`}
              />
            </View>
          </View>

          <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
            <View style={styles.gridColFull}>
              <SummaryRow
                icon={ShieldCheck}
                label="Statut"
                value="En attente de validation"
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── Validation Notice Banner ────────────────────────────────── */}
      <View style={styles.validationNotice}>
        <View style={styles.noticeIconCircle}>
          <ShieldCheck size={20} color={colors.lime[400]} />
        </View>
        <View style={styles.noticeTextStack}>
          <Text style={styles.noticeTag}>VALIDATION</Text>
          <Text style={styles.noticeDesc}>
            Votre annonce est transmise à l’équipe Klef. Elle est révisée et activée sous 24 h ouvrées. Vous serez notifié dès sa mise en ligne.
          </Text>
        </View>
      </View>

      {/* Error Alert Box */}
      {submitError && (
        <View style={styles.errorBox}>
          <AlertTriangle size={18} color={colors.error[500]} />
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      )}

      {/* ── Final Submit Button ─────────────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleFinalSubmit}
        disabled={isSubmitting}
        style={styles.submitBtn}
      >
        <CheckCircle2 size={20} color={colors.forest[950]} strokeWidth={2.5} />
        <Text style={styles.submitBtnText}>
          {isSubmitting ? 'Soumission en cours…' : 'Soumettre pour validation'}
        </Text>
      </TouchableOpacity>

      {/* ── Submission Progress Overlay Modal ───────────────────────── */}
      <Modal visible={isSubmitting} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.loaderIconCircle}>
              {progressPercent === 100 ? (
                <CheckCircle2 size={32} color={colors.lime[400]} />
              ) : (
                <ActivityIndicator size="large" color={colors.lime[400]} />
              )}
            </View>

            <Text style={styles.modalTitle}>Création de votre bien</Text>
            <Text style={styles.modalStatus}>{progressStatus}</Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>

            <Text style={styles.modalWarning}>
              Ne fermez pas l’application pendant le transfert des médias.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },

  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    ...shadows.xs,
  },

  // Cover Hero Preview
  heroPreview: {
    height: 190,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.neutral[900],
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 25, 18, 0.55)',
  },
  apercuBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  apercuBadgeText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 11,
    color: colors.neutral[0],
  },
  heroBottomContent: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    gap: 4,
  },
  heroTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },
  typeTagText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 10.5,
    color: colors.neutral[0],
  },
  cityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityTagText: {
    fontFamily: typography.fontBodySemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.90)',
  },
  heroTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.neutral[0],
    lineHeight: 22,
  },

  emptyHero: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.neutral[100],
  },
  emptyHeroText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.neutral[500],
  },

  // 2-Column Summary Grid Table
  gridContainer: {
    padding: 14,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    paddingVertical: 10,
  },
  gridCol: {
    flex: 1,
    paddingRight: 6,
  },
  gridColFull: {
    flex: 1,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  summaryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.inner,
    backgroundColor: colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextStack: {
    flex: 1,
    gap: 1,
  },
  summaryLabel: {
    fontFamily: typography.fontBodyBold,
    fontSize: 9.5,
    color: colors.neutral[500],
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12.5,
    color: colors.forest[950],
  },
  summaryHint: {
    fontFamily: typography.fontBody,
    fontSize: 10.5,
    color: colors.neutral[500],
  },

  // Validation Notice Banner
  validationNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.forest[950],
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.forest[800],
    ...shadows.xs,
  },
  noticeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.inner,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTextStack: {
    flex: 1,
    gap: 3,
  },
  noticeTag: {
    fontFamily: typography.fontBodyBold,
    fontSize: 10,
    color: colors.lime[400],
    letterSpacing: 0.8,
  },
  noticeDesc: {
    fontFamily: typography.fontBody,
    fontSize: 11.5,
    color: colors.forest[200],
    lineHeight: 16,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.error[50],
    padding: 12,
    borderRadius: radius.inner,
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  errorText: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.error[700],
    flex: 1,
  },

  // Final Submit Button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.lime[400],
    paddingVertical: 15,
    borderRadius: radius.pill,
    ...shadows.action,
  },
  submitBtnText: {
    fontFamily: typography.fontBodyBold,
    fontSize: 14.5,
    color: colors.forest[950],
  },

  // Modal Progress Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 25, 18, 0.80)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.forest[950],
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.forest[800],
    ...shadows.float,
  },
  loaderIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(211, 242, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 18,
    color: colors.neutral[0],
  },
  modalStatus: {
    fontFamily: typography.fontBody,
    fontSize: 12.5,
    color: colors.forest[200],
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.lime[400],
    borderRadius: radius.pill,
  },
  progressPercent: {
    fontFamily: typography.fontBodyBold,
    fontSize: 12,
    color: colors.lime[400],
  },
  modalWarning: {
    fontFamily: typography.fontBody,
    fontSize: 11,
    color: colors.forest[300],
    textAlign: 'center',
    marginTop: 4,
  },
});
