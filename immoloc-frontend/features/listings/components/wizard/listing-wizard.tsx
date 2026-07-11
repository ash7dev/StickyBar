'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
  'Décrivez votre bien et sa localisation',
  'Rédigez votre annonce et fixez votre prix',
  'Sélectionnez ce que vous proposez aux voyageurs',
  'Définissez vos conditions de réservation',
  'Ajoutez au minimum 5 photos de qualité',
  'Vérifiez et soumettez votre annonce',
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
    draftListingId,
    setDraftListingId,
    reset,
  } = useListingFormStore();

  const submitRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

    try {
      let listingId = draftListingId;

      // Payload commun CREATE / UPDATE
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

      // ── Photos : 1 signature → uploads Cloudinary en parallèle → saves en parallèle ──
      const photosToUpload = photos.photos.filter((p) => p.file && !p.url);

      if (photosToUpload.length > 0) {
        // Une seule signature pour tous les fichiers (même folder/timestamp)
        const params = await nestFetch<{ uploadUrl: string; signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>(
          NEST_API.LISTINGS.PHOTO_UPLOAD_PARAMS(listingId),
          { method: 'GET' },
        );

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
              throw new Error(`Cloudinary: ${err?.error?.message ?? res.statusText}`);
            }
            const data = await res.json() as { secure_url: string; public_id: string };
            return { photo, url: data.secure_url, publicId: data.public_id };
          }),
        );

        // Saves en parallèle
        await Promise.all(
          cloudinaryResults.map(({ photo, url, publicId }) =>
            nestFetch(NEST_API.LISTINGS.ADD_PHOTO(listingId), {
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

      // ── Tarifs + équipements en parallèle ──────────────────────────────────
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
              // IDs pré-calculés au step 2 ; fallback fetch si le cache est vide (ex: rechargement de page)
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

      reset();
      router.push(editMode ? `/dashboard/annonces/${listingId}` : '/dashboard/annonces?submitted=1');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* ── Background Blobs for Glass Effect ──────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-accent-200/20 blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-300/10 blur-[80px]" />
      </div>

      {/* ── Sticky header (Glass) ──────────────────────────── */}
      <div className="sticky top-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-background-card/60 backdrop-blur-xl border-b border-border/20 shadow-sm" />
        <div className="relative max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/dashboard/annonces"
              className="group flex items-center gap-2 text-sm font-bold text-foreground-muted hover:text-emerald-500 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-background-card/40 flex items-center justify-center group-hover:bg-emerald-50 transition-colors border border-border/20">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
              <span className="hidden sm:inline">Quitter</span>
            </Link>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                Étape {currentStep + 1} / {WIZARD_STEPS.length}
              </span>
              <div className="h-1 w-12 bg-emerald-100 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="w-8" />
          </div>

          <div className="pb-4">
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

      {/* ── Content Area ────────────────────────────────────── */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">

        {/* Page Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-3">
            {editMode ? "Modification de l'annonce" : "Création d'annonce"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            {STEP_TITLES[currentStep]}
          </h1>
          <p className="text-base text-foreground-muted max-w-xl mx-auto leading-relaxed">
            {STEP_SUBTITLES[currentStep]}
          </p>
        </div>

        {/* Error */}
        {apiError && (
          <div className="mb-8 p-4 bg-error-500/5 backdrop-blur-md border border-error-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="w-10 h-10 rounded-full bg-error-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-error-500 text-xl font-bold">!</span>
            </div>
            <p className="text-sm text-error-600 font-semibold">{apiError}</p>
          </div>
        )}

        {/* Step Container */}
        <div className="space-y-6">
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

        {/* ── Floating Nav (Glass) ─────────────────────────── */}
        {!isConfirmation && (
          <div className="mt-12 sticky bottom-8 z-50">
            <div className="absolute inset-0 bg-background-card/70 backdrop-blur-xl border border-border shadow-xl rounded-3xl" />
            <div className="relative p-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300',
                  currentStep === 0
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-foreground-muted hover:bg-background-alt',
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="group flex items-center gap-3 px-10 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all duration-300 active:scale-95"
              >
                {currentStep === 4 ? 'Récapitulatif' : 'Continuer'}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {isConfirmation && (
          <div className="mt-12 flex justify-start">
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold text-foreground-muted bg-background-card/40 backdrop-blur-md border border-border hover:bg-background-card/60 transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Revenir aux réglages
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
