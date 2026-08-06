'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { WizardStepper, WIZARD_STEPS } from './wizard-stepper';
import { StepBien } from './steps/step-bien';
import { StepAnnonce } from './steps/step-annonce';
import { StepEquipements } from './steps/step-equipements';
import { StepConditions } from './steps/step-conditions';
import { StepPhotos } from './steps/step-photos';
import { StepConfirmation } from './steps/step-confirmation';
import { useListingFormStore } from '@/stores/listing-form.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { cn } from '@/lib/utils/cn';

const STEP_TITLES = [
  'Votre logement',
  'Votre annonce',
  'Équipements & services',
  'Conditions & règles',
  'Photos du bien',
  'Récapitulatif',
];

const STEP_SUBTITLES = [
  'Décrivez votre bien et sa localisation au Sénégal',
  'Rédigez votre annonce et fixez votre tarif de base',
  'Sélectionnez ce que vous mettez à disposition des voyageurs',
  'Définissez vos conditions et règles intérieures',
  'Ajoutez au minimum 5 photos de qualité',
  'Vérifiez l\'ensemble des informations puis soumettez votre annonce',
];

interface ListingWizardProps {
  editMode?: boolean;
}

export function ListingWizard({ editMode = false }: ListingWizardProps) {
  const router = useRouter();
  const {
    currentStep,
    completedSteps,
    setStep,
    nextStep,
    prevStep,
    markCompleted,
    bien,
    annonce,
    equipements,
    equipementIds,
    conditions,
    tarifsPersonnes,
    tarifsNuits,
    photos,
    video,
    draftListingId,
    setDraftListingId,
    reset,
  } = useListingFormStore();

  const submitRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [submitProgress, setSubmitProgress] = useState<{
    percent: number;
    title: string;
    details: string;
  }>({
    percent: 0,
    title: 'Création de l\'annonce',
    details: 'Initialisation…',
  });

  const isConfirmation = currentStep === 5;

  function handleStepValidated() {
    markCompleted(currentStep);
    nextStep();
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePrev() {
    prevStep();
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNext() {
    if (isConfirmation) return;
    submitRef.current?.click();
  }

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    setApiError(null);
    setSubmitProgress({
      percent: 5,
      title: "Création du logement",
      details: "Enregistrement des informations de l'annonce…",
    });

    try {
      let listingId = draftListingId;

      const listingPayload = {
        titre: annonce.titre,
        description: annonce.description,
        type: bien.type,
        sousType: bien.sousType || undefined,
        nombreChambres: bien.nombreChambres,
        nombreSallesBain: bien.nombreSallesBain,
        nombrePieces: bien.nombrePieces,
        capaciteMax: bien.capaciteMax,
        personnesBase: bien.capaciteMax,
        ville: bien.ville,
        adresse: bien.adresse,
        prixBase: annonce.prixBase,
        nuitesMinimum: annonce.nuitesMinimum ?? 1,
        reglesMaison: conditions.reglesMaison || null,
      };

      if (!listingId) {
        const created = await nestFetch<{ id: string }>(NEST_API.LISTINGS.CREATE, {
          method: 'POST',
          body: JSON.stringify({ ...listingPayload, equipementIds: [] }),
        });

        listingId = created.id;
        setDraftListingId(listingId);
      } else {
        await nestFetch(NEST_API.LISTINGS.UPDATE(listingId), {
          method: 'PATCH',
          body: JSON.stringify(listingPayload),
        });
      }

      // Photos Cloudinary
      const photosToUpload = photos.photos.filter((p) => p.file && !p.url);

      if (photosToUpload.length > 0) {
        setSubmitProgress({
          percent: 15,
          title: "Téléversement des photos",
          details: `Préparation de l'envoi de ${photosToUpload.length} photo${photosToUpload.length > 1 ? 's' : ''} sur Cloudinary…`,
        });

        const params = await nestFetch<{ uploadUrl: string; signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>(
          NEST_API.LISTINGS.PHOTO_UPLOAD_PARAMS(listingId),
          { method: 'GET' },
        );

        let photosDone = 0;
        const totalPhotos = photosToUpload.length;

        const cloudinaryResults = await Promise.all(
          photosToUpload.map(async (photo) => {
            const formData = new FormData();
            formData.append('file', photo.file!);
            formData.append('folder', params.folder);
            formData.append('signature', params.signature);
            formData.append('timestamp', String(params.timestamp));
            formData.append('api_key', params.apiKey);

            const res = await fetch(params.uploadUrl, { method: 'POST', body: formData });
            if (!res.ok) {
              const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
              throw new Error(`Cloudinary Photo: ${err?.error?.message ?? res.statusText}`);
            }
            const data = await res.json() as { secure_url: string; public_id: string };

            photosDone++;
            const pct = 15 + Math.round((photosDone / totalPhotos) * (video?.file ? 35 : 70));
            setSubmitProgress({
              percent: pct,
              title: "Téléversement des photos",
              details: `Photo ${photosDone} sur ${totalPhotos} téléversée avec succès`,
            });

            return { photo, url: data.secure_url, publicId: data.public_id };
          }),
        );

        await Promise.all(
          cloudinaryResults.map(({ photo, url, publicId }) =>
            nestFetch(NEST_API.LISTINGS.ADD_PHOTO(listingId!), {
              method: 'POST',
              body: JSON.stringify({
                url,
                publicId,
                categorie: photo.categorie,
                estPrincipale: photo.estPrincipale,
                position: photo.position,
              }),
            }),
          ),
        );
      }

      // Vidéo Cloudinary (suivi par XMLHttpRequest pour progression Mo/s en temps réel)
      if (video?.file) {
        setSubmitProgress({
          percent: 50,
          title: "Téléversement de la vidéo HD",
          details: "Obtention des paramètres d'envoi Cloudinary…",
        });

        const videoParams = await nestFetch<{ uploadUrl: string; signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>(
          NEST_API.LISTINGS.VIDEO_UPLOAD_PARAMS(listingId),
          { method: 'GET' },
        );

        const videoFormData = new FormData();
        videoFormData.append('file', video.file);
        videoFormData.append('folder', videoParams.folder);
        videoFormData.append('signature', videoParams.signature);
        videoFormData.append('timestamp', String(videoParams.timestamp));
        videoFormData.append('api_key', videoParams.apiKey);

        const videoData = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', videoParams.uploadUrl);

          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const videoPct = Math.round((evt.loaded / evt.total) * 100);
              const loadedMb = (evt.loaded / (1024 * 1024)).toFixed(1);
              const totalMb = (evt.total / (1024 * 1024)).toFixed(1);
              const overallPct = 50 + Math.round((evt.loaded / evt.total) * 40);
              setSubmitProgress({
                percent: overallPct,
                title: "Téléversement de la vidéo HD",
                details: `Vidéo : ${videoPct}% · ${loadedMb} Mo / ${totalMb} Mo`,
              });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error('Erreur de lecture de la réponse vidéo.'));
              }
            } else {
              reject(new Error('Échec du téléversement vidéo.'));
            }
          };

          xhr.onerror = () => reject(new Error('Erreur réseau lors du téléversement de la vidéo.'));
          xhr.send(videoFormData);
        });

        setSubmitProgress({
          percent: 90,
          title: "Finalisation de la vidéo",
          details: "Mise à jour de l'annonce avec la vidéo HD…",
        });

        await nestFetch(NEST_API.LISTINGS.UPDATE(listingId), {
          method: 'PATCH',
          body: JSON.stringify({
            videoUrl: videoData.secure_url,
            videoPublicId: videoData.public_id,
          }),
        });
      }

      setSubmitProgress({
        percent: 95,
        title: "Finalisation de l'annonce",
        details: "Enregistrement des tarifs, règles et équipements…",
      });

      // Tarifs + Équipements
      await Promise.all([
        tarifsPersonnes.length > 0
          ? nestFetch(NEST_API.LISTINGS.SET_TARIFS_PERSONNES(listingId), {
              method: 'POST',
              body: JSON.stringify({ tarifs: tarifsPersonnes }),
            })
          : null,

        tarifsNuits.length > 0
          ? nestFetch(NEST_API.LISTINGS.SET_TARIFS_NUITS(listingId), {
              method: 'POST',
              body: JSON.stringify({ tarifs: tarifsNuits }),
            })
          : null,

        equipements.equipements.length > 0
          ? (
              equipementIds.length > 0
                ? Promise.resolve(equipementIds)
                : nestFetch<{ id: string; nom: string }[]>(NEST_API.LISTINGS.LIST_EQUIPEMENTS, { method: 'GET' })
                    .then((all) => all.filter((e) => equipements.equipements.includes(e.nom)).map((e) => e.id))
            ).then((ids) =>
              ids.length > 0
                ? nestFetch(NEST_API.LISTINGS.SET_EQUIPEMENTS(listingId), {
                    method: 'PUT',
                    body: JSON.stringify({ equipementIds: ids }),
                  })
                : null,
            )
          : null,
      ]);

      if (!editMode) {
        await nestFetch(NEST_API.LISTINGS.SUBMIT(listingId), { method: 'PATCH' });
      }

      setSubmitProgress({
        percent: 100,
        title: "Annonce créée avec succès !",
        details: "Redirection vers votre tableau de bord…",
      });

      reset();
      router.push(editMode ? `/dashboard/annonces/${listingId}` : '/dashboard/annonces?submitted=1');
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : 'Une erreur est survenue';
      if (
        rawMsg === 'Load failed' ||
        rawMsg.includes('Failed to fetch') ||
        rawMsg.includes('NetworkError') ||
        rawMsg.includes('Network request failed')
      ) {
        setApiError(
          'Connexion au serveur impossible (serveur backend indisponible ou en réveil). Veuillez ré-essayer dans quelques secondes.',
        );
      } else {
        setApiError(rawMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-16">

      {/* Sticky header (Glass ImmoLoc v2) */}
      <div className="sticky top-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-background-card/85 backdrop-blur-xl border-b border-border/80 shadow-xs" />
        <div className="relative max-w-3xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link
              href="/dashboard/annonces"
              className="btn-ghost text-xs px-3 sm:px-3.5 py-1.5 rounded-pill flex items-center gap-1.5 sm:gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground-muted" />
              <span className="text-xs font-semibold">Quitter</span>
            </Link>

            <div className="flex flex-col items-center">
              <span className="eyebrow text-forest-600 font-bold text-[9px] sm:text-[10px]">
                Étape {currentStep + 1} / {WIZARD_STEPS.length}
              </span>
              <div className="h-1.5 w-12 sm:w-16 bg-background-alt border border-border rounded-pill mt-0.5 sm:mt-1 overflow-hidden">
                <div
                  className="h-full bg-forest-600 transition-all duration-500 rounded-pill"
                  style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="w-12 sm:w-16" />
          </div>

          <div className="pb-3 sm:pb-4">
            <WizardStepper
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={(s) => {
                if (s < currentStep || completedSteps.has(s)) setStep(s);
              }}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-3xl mx-auto px-3.5 sm:px-4 py-6 sm:py-10">

        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-10">
          <p className="eyebrow text-forest-600 font-bold tracking-[0.2em] mb-1.5 sm:mb-2 text-[10px] sm:text-xs">
            {editMode ? "Modification d'annonce" : "Création d'annonce"}
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground tracking-tight mb-1.5 sm:mb-2">
            {STEP_TITLES[currentStep]}
          </h1>
          <p className="text-xs sm:text-base text-foreground-muted max-w-xl mx-auto font-medium leading-relaxed">
            {STEP_SUBTITLES[currentStep]}
          </p>
        </div>

        {/* Erreur API */}
        {apiError && (
          <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 bg-error-50 border border-error-500/30 rounded-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-error-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-error-600" />
              </div>
              <p className="text-xs text-error-600 font-semibold leading-normal">{apiError}</p>
            </div>
            {isConfirmation && (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="btn-ghost text-xs px-3 py-1.5 rounded-pill text-error-700 hover:bg-error-100 shrink-0 font-bold border-error-300"
              >
                Réessayer
              </button>
            )}
          </div>
        )}

        {/* Dynamic Step Component */}
        <div className="space-y-5 sm:space-y-6">
          {currentStep === 0 && <StepBien onNext={handleStepValidated} submitRef={submitRef} />}
          {currentStep === 1 && <StepAnnonce onNext={handleStepValidated} submitRef={submitRef} />}
          {currentStep === 2 && <StepEquipements onNext={handleStepValidated} submitRef={submitRef} />}
          {currentStep === 3 && <StepConditions onNext={handleStepValidated} submitRef={submitRef} />}
          {currentStep === 4 && <StepPhotos onNext={handleStepValidated} submitRef={submitRef} />}
          {currentStep === 5 && (
            <StepConfirmation
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmitting}
              submitRef={submitRef}
            />
          )}
        </div>

        {/* Floating Nav Bar (Glass Responsive) */}
        {!isConfirmation && (
          <div className="mt-8 sm:mt-10 sticky bottom-4 sm:bottom-6 z-40">
            <div className="card p-2.5 sm:p-3 bg-background-card/90 backdrop-blur-xl border border-border shadow-2xl rounded-card flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={cn(
                  'btn-ghost text-xs px-3.5 sm:px-5 py-2.5 rounded-pill font-semibold cursor-pointer shrink-0',
                  currentStep === 0 && 'opacity-40 cursor-not-allowed',
                )}
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Précédent</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="btn-action text-xs px-5 sm:px-8 py-2.5 sm:py-3 font-bold flex items-center gap-2 cursor-pointer shadow-action"
              >
                <span>{currentStep === 4 ? 'Vérifier l\'annonce' : 'Continuer'}</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {isConfirmation && (
          <div className="mt-8 sm:mt-10 flex justify-start">
            <button
              type="button"
              onClick={handlePrev}
              className="btn-ghost text-xs px-4 sm:px-5 py-2.5 rounded-pill font-semibold flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Modifier les informations</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal de progression de téléversement Cloudinary */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md space-y-5 rounded-card border border-white/10 bg-forest-950 p-6 text-white shadow-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill bg-lime-400/15 text-lime-400 border border-lime-400/30">
              {submitProgress.percent === 100 ? (
                <CheckCircle2 className="h-8 w-8 text-lime-400" />
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold tracking-tight text-white">
                {submitProgress.title}
              </h3>
              <p className="text-xs text-forest-200 font-medium">
                {submitProgress.details}
              </p>
            </div>

            {/* Barre de progression */}
            <div className="space-y-1.5">
              <div className="h-3 w-full overflow-hidden rounded-full bg-forest-900 border border-forest-800 p-0.5">
                <div
                  className="h-full rounded-full bg-lime-400 transition-all duration-300 ease-out"
                  style={{ width: `${submitProgress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-forest-300">
                <span>Progression du transfert</span>
                <span className="tabular-nums font-mono text-xs text-lime-400">{submitProgress.percent}%</span>
              </div>
            </div>

            <p className="text-[11px] text-forest-300/80 border-t border-white/10 pt-3">
              ⚡ Envoi direct vers Cloudinary. Veuillez ne pas fermer cette page pendant le transfert.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
