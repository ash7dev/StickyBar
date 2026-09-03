'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { WizardStepper, WIZARD_STEPS, GESTIONNAIRE_WIZARD_STEPS } from './wizard-stepper';
import { StepProprietaire } from './steps/step-proprietaire';
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

const OWNER_STEP_TITLES = [
  'Votre logement', 'Votre annonce', 'Équipements et services',
  'Conditions et règles', 'Photos du bien', 'Récapitulatif',
];

const OWNER_STEP_SUBTITLES = [
  'Décrivez votre bien et sa localisation',
  'Rédigez votre annonce et fixez votre tarif',
  'Sélectionnez ce que vous mettez à disposition',
  'Définissez vos conditions et votre règlement intérieur',
  'Ajoutez au minimum 5 photos',
  'Vérifiez les informations puis soumettez',
];

const GESTIONNAIRE_STEP_TITLES = [
  'Propriétaire du bien', 'Votre logement', 'Votre annonce', 'Équipements et services',
  'Conditions et règles', 'Photos du bien', 'Récapitulatif',
];

const GESTIONNAIRE_STEP_SUBTITLES = [
  'Sélectionnez ou saisissez les coordonnées du propriétaire du logement',
  'Décrivez le bien et sa localisation',
  'Rédigez l’annonce et fixez le tarif',
  'Sélectionnez ce qui est mis à disposition',
  'Définissez les conditions et le règlement intérieur',
  'Ajoutez au minimum 5 photos',
  'Vérifiez les informations puis soumettez',
];

type UploadParams = {
  uploadUrl: string; signature: string; timestamp: number;
  apiKey: string; cloudName: string; folder: string;
};

interface Props {
  editMode?: boolean;
  cancelHref?: string;
  successHref?: string;
  isGestionnaire?: boolean;
  initialOwnerId?: string;
}

export function ListingWizard({
  editMode = false,
  cancelHref = '/dashboard/annonces',
  successHref = '/dashboard/annonces?submitted=1',
  isGestionnaire: isGestionnaireProp,
  initialOwnerId,
}: Props) {
  const router = useRouter();
  const store = useListingFormStore();
  const {
    currentStep, completedSteps, setStep, nextStep, prevStep, markCompleted,
    proprietaire, bien, annonce, equipements, equipementIds, conditions,
    tarifsPersonnes, tarifsNuits, photos, video,
    draftListingId, setDraftListingId, updatePhoto, reset, setProprietaire,
  } = store;

  const isGestionnaire = isGestionnaireProp ?? cancelHref.includes('/gestionnaire');
  const wizardSteps = isGestionnaire ? GESTIONNAIRE_WIZARD_STEPS : WIZARD_STEPS;
  const stepTitles = isGestionnaire ? GESTIONNAIRE_STEP_TITLES : OWNER_STEP_TITLES;
  const stepSubtitles = isGestionnaire ? GESTIONNAIRE_STEP_SUBTITLES : OWNER_STEP_SUBTITLES;

  const submitRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ percent: 0, title: '', details: '' });
  const isConfirmation = currentStep === wizardSteps.length - 1;

  // Pré-sélection automatique du propriétaire et saut du Step 0 si initialOwnerId est fourni
  useEffect(() => {
    if (!initialOwnerId || !isGestionnaire || editMode) return;

    nestFetch<Array<{ id: string; prenom: string; nom: string; telephone: string }>>(
      NEST_API.GESTIONNAIRE.PROPRIETAIRES_ALL,
    )
      .then((owners) => {
        const found = owners.find((o) => o.id === initialOwnerId);
        if (found) {
          setProprietaire({
            mode: 'EXISTING',
            telephone: found.telephone,
            nom: found.nom,
            prenom: found.prenom,
          });
          markCompleted(0);
          setStep(1); // Saut automatique du Step 0 vers le Step 1 (Votre Logement) !
        }
      })
      .catch(() => {});
  }, [initialOwnerId, isGestionnaire, editMode, setProprietaire, markCompleted, setStep]);

  /* Un rafraîchissement ou une fermeture pendant le transfert perd les
     fichiers déjà envoyés et laisse une annonce incomplète. */
  useEffect(() => {
    if (!isSubmitting) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isSubmitting]);

  useEffect(() => {
    // Remonter immédiatement en haut de page à chaque changement d'étape
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentStep]);

  const handleStepValidated = useCallback(() => {
    markCompleted(currentStep);
    nextStep();
    setApiError(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentStep, markCompleted, nextStep]);

  const handlePrev = useCallback(() => {
    prevStep();
    setApiError(null);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [prevStep]);

  const handleNext = useCallback(() => {
    if (isConfirmation) return;
    submitRef.current?.click();
  }, [isConfirmation]);

  const handleFinalSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setApiError(null);
    setProgress({ percent: 5, title: 'Création de l’annonce', details: 'Enregistrement des informations…' });

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
        instructionsAcces: conditions.instructionsAcces || null,
        nomReseauWifi: conditions.nomReseauWifi || null,
        codeWifi: conditions.codeWifi || null,
        instructionsDigicode: conditions.instructionsDigicode || null,
        regimeElectricite: conditions.regimeElectricite || 'INCLUS',
        detailsElectricite: conditions.detailsElectricite || null,
        ...(isGestionnaire && proprietaire
          ? proprietaire.mode === 'EXISTING'
            ? { managedOwnerPhone: proprietaire.telephone }
            : {
                managedOwnerPhone: proprietaire.telephone,
                managedOwnerNom: proprietaire.nom,
                managedOwnerPrenom: proprietaire.prenom,
              }
          : {}),
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

      /* ── Photos ────────────────────────────────────────────────────────
         Séquentiel et marqué au fur et à mesure. */

      const pending = photos.photos
        .map((p, index) => ({ p, index }))
        .filter(({ p }) => p.file && !p.url);

      if (pending.length > 0) {
        setProgress({
          percent: 15,
          title: 'Envoi des photos',
          details: `${pending.length} photo${pending.length > 1 ? 's' : ''} à transférer`,
        });

        const params = await nestFetch<UploadParams>(
          NEST_API.LISTINGS.PHOTO_UPLOAD_PARAMS(listingId), { method: 'GET' },
        );

        const budget = video?.file ? 35 : 70;

        for (let i = 0; i < pending.length; i++) {
          const { p, index } = pending[i];

          const formData = new FormData();
          formData.append('file', p.file!);
          formData.append('folder', params.folder);
          formData.append('signature', params.signature);
          formData.append('timestamp', String(params.timestamp));
          formData.append('api_key', params.apiKey);

          const res = await fetch(params.uploadUrl, { method: 'POST', body: formData });
          if (!res.ok) {
            const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
            throw new Error(`Photo ${i + 1} : ${err?.error?.message ?? res.statusText}`);
          }
          const data = await res.json() as { secure_url: string; public_id: string };

          await nestFetch(NEST_API.LISTINGS.ADD_PHOTO(listingId!), {
            method: 'POST',
            body: JSON.stringify({
              url: data.secure_url,
              publicId: data.public_id,
              categorie: p.categorie,
              estPrincipale: p.estPrincipale,
              position: p.position,
            }),
          });

          /* Marquée comme envoyée : un réessai ne la reprendra pas. */
          updatePhoto(index, { url: data.secure_url });

          setProgress({
            percent: 15 + Math.round(((i + 1) / pending.length) * budget),
            title: 'Envoi des photos',
            details: `${i + 1} sur ${pending.length}`,
          });
        }
      }

      /* ── Vidéo ─────────────────────────────────────────────────────── */

      if (video?.file && !video.url) {
        setProgress({ percent: 50, title: 'Envoi de la vidéo', details: 'Préparation…' });

        const vParams = await nestFetch<UploadParams>(
          NEST_API.LISTINGS.VIDEO_UPLOAD_PARAMS(listingId), { method: 'GET' },
        );

        const fd = new FormData();
        fd.append('file', video.file);
        fd.append('folder', vParams.folder);
        fd.append('signature', vParams.signature);
        fd.append('timestamp', String(vParams.timestamp));
        fd.append('api_key', vParams.apiKey);

        const videoData = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', vParams.uploadUrl);

          xhr.upload.onprogress = (evt) => {
            if (!evt.lengthComputable) return;
            const ratio = evt.loaded / evt.total;
            setProgress({
              percent: 50 + Math.round(ratio * 40),
              title: 'Envoi de la vidéo',
              details: `${(evt.loaded / 1048576).toFixed(1)} Mo sur ${(evt.total / 1048576).toFixed(1)} Mo`,
            });
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(JSON.parse(xhr.responseText)); }
              catch { reject(new Error('Réponse illisible du service vidéo.')); }
            } else {
              reject(new Error('L’envoi de la vidéo a échoué.'));
            }
          };
          xhr.onerror = () => reject(new Error('Connexion interrompue pendant l’envoi de la vidéo.'));
          xhr.onabort = () => reject(new Error('Envoi de la vidéo annulé.'));
          xhr.ontimeout = () => reject(new Error('Délai dépassé pendant l’envoi de la vidéo.'));
          xhr.send(fd);
        });

        setProgress({ percent: 90, title: 'Finalisation', details: 'Association de la vidéo…' });

        await nestFetch(NEST_API.LISTINGS.UPDATE(listingId), {
          method: 'PATCH',
          body: JSON.stringify({
            videoUrl: videoData.secure_url,
            videoPublicId: videoData.public_id,
          }),
        });
      }

      /* ── Tarifs et équipements ─────────────────────────────────────── */

      setProgress({ percent: 95, title: 'Finalisation', details: 'Tarifs et équipements…' });

      if (tarifsPersonnes.length > 0) {
        await nestFetch(NEST_API.LISTINGS.SET_TARIFS_PERSONNES(listingId), {
          method: 'POST', body: JSON.stringify({ tarifs: tarifsPersonnes }),
        });
      }
      if (tarifsNuits.length > 0) {
        await nestFetch(NEST_API.LISTINGS.SET_TARIFS_NUITS(listingId), {
          method: 'POST', body: JSON.stringify({ tarifs: tarifsNuits }),
        });
      }
      if (equipements.equipements.length > 0) {
        const ids = equipementIds.length > 0
          ? equipementIds
          : (await nestFetch<{ id: string; nom: string }[]>(
            NEST_API.LISTINGS.LIST_EQUIPEMENTS, { method: 'GET' },
          )).filter((e) => equipements.equipements.includes(e.nom)).map((e) => e.id);

        if (ids.length > 0) {
          await nestFetch(NEST_API.LISTINGS.SET_EQUIPEMENTS(listingId), {
            method: 'PUT', body: JSON.stringify({ equipementIds: ids }),
          });
        }
      }

      if (!editMode) {
        await nestFetch(NEST_API.LISTINGS.SUBMIT(listingId), { method: 'PATCH' });
      }

      setProgress({ percent: 100, title: 'Annonce envoyée', details: 'Redirection…' });
      const editRedirectHref = cancelHref.endsWith('/annonces')
        ? `${cancelHref}/${listingId}`
        : `/dashboard/annonces/${listingId}`;
      reset();
      router.push(editMode ? editRedirectHref : successHref);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Une erreur est survenue.';
      const isNetwork = /Load failed|Failed to fetch|NetworkError|Network request failed/i.test(raw);
      setApiError(
        isNetwork
          ? 'Connexion au serveur impossible. Réessayez dans quelques secondes — les éléments déjà envoyés seront conservés.'
          : raw,
      );
      setIsSubmitting(false);
    }
  }, [
    draftListingId, annonce, bien, conditions, photos.photos, video,
    tarifsPersonnes, tarifsNuits, equipements, equipementIds,
    editMode, setDraftListingId, updatePhoto, reset, router, successHref, cancelHref, isGestionnaire, proprietaire,
  ]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-16">

      {/* ── En-tête ──────────────────────────────────────────────────────── */}

      <div className="sticky top-0 z-40 border-b border-border bg-background-card/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between gap-3 sm:h-16">
            <Link
              href={cancelHref}
              className="btn-ghost flex items-center gap-2 px-3.5 py-1.5 text-sm"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Quitter
            </Link>

            <div className="flex flex-col items-center">
              <span className="eyebrow text-foreground-muted">
                Étape {currentStep + 1} / {wizardSteps.length}
              </span>
              <div
                role="progressbar"
                aria-valuenow={currentStep + 1}
                aria-valuemin={1}
                aria-valuemax={wizardSteps.length}
                className="mt-1 h-1.5 w-16 overflow-hidden rounded-pill bg-background-alt"
              >
                <div
                  className="h-full rounded-pill bg-forest-600 transition-[width] duration-500"
                  style={{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="w-16" aria-hidden="true" />
          </div>

          <div className="pb-3 sm:pb-4">
            <WizardStepper
              currentStep={currentStep}
              completedSteps={completedSteps}
              steps={wizardSteps}
              onStepClick={(s) => { if (s < currentStep || completedSteps.has(s)) setStep(s); }}
            />
          </div>
        </div>
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}

      <div className="mx-auto max-w-3xl px-3.5 py-6 sm:px-4 sm:py-10">

        <div className="mb-6 text-center sm:mb-10">
          <p className="eyebrow mb-2 text-foreground-muted">
            {editMode ? 'Modification d’annonce' : 'Création d’annonce'}
          </p>
          <h1 className="mb-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {stepTitles[currentStep]}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-foreground-muted sm:text-base">
            {stepSubtitles[currentStep]}
          </p>
        </div>

        {apiError && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-3 rounded-inner border border-error-500/20 bg-error-50 p-4 sm:mb-8"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border border-error-500/25 bg-background-card">
                <AlertTriangle className="h-4 w-4 text-error-600" aria-hidden="true" />
              </span>
              <p className="text-xs leading-relaxed text-error-700">{apiError}</p>
            </div>
            {isConfirmation && (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="shrink-0 rounded-pill border border-error-500/25 px-3 py-1.5 text-xs font-semibold text-error-700 transition-colors hover:bg-error-50"
              >
                Réessayer
              </button>
            )}
          </div>
        )}

        <div className="space-y-5 sm:space-y-6">
          {isGestionnaire ? (
            <>
              {currentStep === 0 && <StepProprietaire onNext={handleStepValidated} submitRef={submitRef} />}
              {currentStep === 1 && <StepBien onNext={handleStepValidated} submitRef={submitRef} />}
              {currentStep === 2 && <StepAnnonce onNext={handleStepValidated} submitRef={submitRef} />}
              {currentStep === 3 && <StepEquipements onNext={handleStepValidated} submitRef={submitRef} />}
              {currentStep === 4 && <StepConditions onNext={handleStepValidated} submitRef={submitRef} />}
              {currentStep === 5 && <StepPhotos onNext={handleStepValidated} submitRef={submitRef} />}
              {currentStep === 6 && (
                <StepConfirmation
                  onSubmit={handleFinalSubmit}
                  isSubmitting={isSubmitting}
                  submitRef={submitRef}
                />
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {!isConfirmation ? (
          <div className="sticky bottom-4 z-30 mt-8 sm:bottom-6 sm:mt-10">
            <div className="flex items-center justify-between gap-2 rounded-card border border-border bg-background-card/95 p-2.5 shadow-lg backdrop-blur-xl sm:p-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="btn-ghost shrink-0 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Précédent
              </button>

              <button type="button" onClick={handleNext} className="btn-action px-6 py-3 text-sm sm:px-8">
                {currentStep === wizardSteps.length - 2 ? 'Vérifier l’annonce' : 'Continuer'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 sm:mt-10">
            <button type="button" onClick={handlePrev} className="btn-ghost px-5 py-2.5 text-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Modifier les informations
            </button>
          </div>
        )}
      </div>

      {/* ── Progression ──────────────────────────────────────────────────── */}

      {isSubmitting && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-forest-950/80 p-4 backdrop-blur-md">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={progress.title}
            className="section-inverse w-full max-w-md space-y-5 p-6 text-center"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-pill border border-border-inverse bg-white/5">
              {progress.percent === 100 ? (
                <CheckCircle2 className="h-8 w-8 text-on-inverse-marker" aria-hidden="true" />
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-on-inverse-muted" aria-hidden="true" />
              )}
            </span>

            <div className="space-y-1">
              <h2 className="font-display text-xl font-semibold tracking-tight text-on-inverse-display">
                {progress.title}
              </h2>
              <p aria-live="polite" className="text-xs text-on-inverse-muted">
                {progress.details}
              </p>
            </div>

            <div className="space-y-1.5">
              <div
                role="progressbar"
                aria-valuenow={progress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2.5 w-full overflow-hidden rounded-pill bg-white/10"
              >
                <div
                  className="h-full rounded-pill bg-action transition-[width] duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-on-inverse-muted">
                <span>Transfert en cours</span>
                <span className="font-semibold tabular-nums text-on-inverse">
                  {progress.percent} %
                </span>
              </div>
            </div>

            <p className="border-t border-border-inverse pt-3 text-xs text-on-inverse-muted">
              Ne fermez pas cette page pendant le transfert.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}