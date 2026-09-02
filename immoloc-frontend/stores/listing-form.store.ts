import { create } from 'zustand';
import type {
  StepBienInput,
  StepAnnonceInput,
  StepEquipementsInput,
  StepConditionsInput,
  StepPhotosInput,
  TarifPersonnes,
  TarifNuits,
  PhotoItem,
} from '@/schemas/listing.schema';
import type { ListingDetail } from '@/lib/nestjs/types';

// ── Step definitions ─────────────────────────────────────────────────────────

export const STEPS = [
  { id: 'bien', label: 'Le bien', icon: 'home' },
  { id: 'annonce', label: 'Votre annonce', icon: 'pen' },
  { id: 'equipements', label: 'Équipements', icon: 'equipements' },
  { id: 'conditions', label: 'Conditions', icon: 'rules' },
  { id: 'photos', label: 'Photos', icon: 'photos' },
  { id: 'confirmation', label: 'Récapitulatif', icon: 'check' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

export interface VideoItem {
  url?: string;
  file?: File;
  previewUrl: string;
  name?: string;
  duration?: number;
}

export interface ProprietaireInfo {
  mode: 'EXISTING' | 'NEW';
  existingUserId?: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  email?: string;
}

// ── Store shape ──────────────────────────────────────────────────────────────

interface ListingFormState {
  currentStep: number;
  completedSteps: Set<number>;

  // Draft listing ID created at submission — needed for photo upload
  draftListingId: string | null;

  // Step data
  proprietaire: ProprietaireInfo;
  bien: Partial<StepBienInput>;
  annonce: Partial<StepAnnonceInput>;
  equipements: StepEquipementsInput;
  equipementIds: string[];           // UUIDs résolus au step 2, prêts pour la soumission
  conditions: Partial<StepConditionsInput>;
  tarifsPersonnes: TarifPersonnes[];
  tarifsNuits: TarifNuits[];
  photos: StepPhotosInput;
  video: VideoItem | null;

  // Actions — navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  markCompleted: (step: number) => void;

  // Actions — draft
  setDraftListingId: (id: string) => void;

  // Actions — data
  setProprietaire: (data: Partial<ProprietaireInfo>) => void;
  setBien: (data: Partial<StepBienInput>) => void;
  setAnnonce: (data: Partial<StepAnnonceInput>) => void;
  setEquipements: (data: StepEquipementsInput) => void;
  setEquipementIds: (ids: string[]) => void;
  toggleEquipement: (name: string) => void;
  setConditions: (data: Partial<StepConditionsInput>) => void;
  addTarifPersonnes: (tarif: TarifPersonnes) => void;
  removeTarifPersonnes: (index: number) => void;
  addTarifNuits: (tarif: TarifNuits) => void;
  removeTarifNuits: (index: number) => void;
  setPhotos: (photos: PhotoItem[]) => void;
  addPhoto: (photo: PhotoItem) => void;
  removePhoto: (index: number) => void;
  updatePhoto: (index: number, patch: Partial<PhotoItem>) => void;
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  setPrincipalPhoto: (index: number) => void;
  setVideo: (video: VideoItem | null) => void;

  // Hydrate from existing listing (for edit mode)
  hydrate: (listing: ListingDetail) => void;

  // Reset
  reset: () => void;
}

// ── Default values ───────────────────────────────────────────────────────────

const DEFAULT_PHOTOS: StepPhotosInput = {
  photos: [],
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useListingFormStore = create<ListingFormState>((set, get) => ({
  currentStep: 0,
  completedSteps: new Set(),
  draftListingId: null,

  proprietaire: { mode: 'EXISTING' },
  bien: {},
  annonce: {},
  equipements: { equipements: [] },
  equipementIds: [],
  conditions: {},
  tarifsPersonnes: [],
  tarifsNuits: [],
  photos: DEFAULT_PHOTOS,
  video: null,

  // Navigation
  setStep: (step) => set({ currentStep: Math.max(0, Math.min(step, 6)) }),
  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 6) set({ currentStep: currentStep + 1 });
  },
  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) set({ currentStep: currentStep - 1 });
  },
  markCompleted: (step) => {
    const { completedSteps } = get();
    const newSet = new Set(completedSteps);
    newSet.add(step);
    set({ completedSteps: newSet });
  },

  // Actions — data
  setProprietaire: (data) =>
    set((state) => ({ proprietaire: { ...state.proprietaire, ...data } })),

  // Draft
  setDraftListingId: (id) => set({ draftListingId: id }),

  // Bien
  setBien: (data) => set((s) => ({ bien: { ...s.bien, ...data } })),

  // Annonce
  setAnnonce: (data) => set((s) => ({ annonce: { ...s.annonce, ...data } })),

  // Equipements
  setEquipements: (data) => set({ equipements: data }),
  setEquipementIds: (ids) => set({ equipementIds: ids }),
  toggleEquipement: (name) =>
    set((s) => {
      const current = s.equipements.equipements;
      const exists = current.includes(name);
      return {
        equipements: {
          equipements: exists ? current.filter((e) => e !== name) : [...current, name],
        },
      };
    }),

  // Conditions
  setConditions: (data) => set((s) => ({ conditions: { ...s.conditions, ...data } })),

  // Tarifs personnes
  addTarifPersonnes: (tarif) =>
    set((s) => ({ tarifsPersonnes: [...s.tarifsPersonnes, tarif] })),
  removeTarifPersonnes: (index) =>
    set((s) => ({ tarifsPersonnes: s.tarifsPersonnes.filter((_, i) => i !== index) })),

  // Tarifs nuits
  addTarifNuits: (tarif) =>
    set((s) => ({ tarifsNuits: [...s.tarifsNuits, tarif] })),
  removeTarifNuits: (index) =>
    set((s) => ({ tarifsNuits: s.tarifsNuits.filter((_, i) => i !== index) })),

  // Photos
  setPhotos: (photos) => set({ photos: { photos } }),
  addPhoto: (photo) => set((s) => ({ photos: { photos: [...s.photos.photos, photo] } })),
  removePhoto: (index) =>
    set((s) => ({
      photos: {
        photos: s.photos.photos
          .filter((_, i) => i !== index)
          .map((p, i) => ({ ...p, position: i })),
      },
    })),
  updatePhoto: (index, patch) =>
    set((s) => ({
      photos: {
        photos: s.photos.photos.map((p, i) => (i === index ? { ...p, ...patch } : p)),
      },
    })),
  reorderPhotos: (fromIndex, toIndex) =>
    set((s) => {
      const items = [...s.photos.photos];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { photos: { photos: items.map((p, i) => ({ ...p, position: i })) } };
    }),
  setPrincipalPhoto: (index) =>
    set((s) => ({
      photos: {
        photos: s.photos.photos.map((p, i) => ({ ...p, estPrincipale: i === index })),
      },
    })),
  setVideo: (video) => set({ video }),

  // Hydrate store from an existing listing (edit mode)
  hydrate: (listing) =>
    set({
      currentStep: 0,
      completedSteps: new Set([0, 1, 2, 3, 4]),
      draftListingId: listing.id,
      bien: {
        type: listing.type,
        sousType: listing.sousType ?? '',
        nombreChambres: listing.nombreChambres,
        nombreSallesBain: listing.nombreSallesBain,
        nombrePieces: listing.nombrePieces,
        capaciteMax: listing.capaciteMax,
        ville: listing.ville,
        adresse: listing.adresse,
      },
      annonce: {
        titre: listing.titre,
        description: listing.description,
        prixBase: listing.prixBase,
        nuitesMinimum: listing.nuitesMinimum,
      },
      equipements: { equipements: listing.equipements.map((e) => e.nom) },
      equipementIds: listing.equipements.map((e) => e.id),
      conditions: {
        reglesMaison: listing.reglesMaison ?? undefined,
        instructionsAcces: listing.instructionsAcces ?? undefined,
        nomReseauWifi: listing.nomReseauWifi ?? undefined,
        codeWifi: listing.codeWifi ?? undefined,
        instructionsDigicode: listing.instructionsDigicode ?? undefined,
        regimeElectricite: (listing.regimeElectricite as any) ?? 'INCLUS',
        detailsElectricite: listing.detailsElectricite ?? undefined,
      },
      tarifsPersonnes: listing.tarifsPersonnes.map((t) => ({
        personnesMin: t.personnesMin,
        personnesMax: t.personnesMax,
        supplement: t.supplement,
      })),
      tarifsNuits: listing.tarifsNuits.map((t) => ({
        nuitsMin: t.nuitsMin,
        nuitsMax: t.nuitsMax,
        prix: t.prix,
      })),
      photos: {
        photos: listing.photos.map((p) => ({
          previewUrl: p.url,
          url: p.url,
          publicId: p.publicId,
          categorie: p.categorie,
          estPrincipale: p.estPrincipale,
          position: p.position,
        })),
      },
      video: listing.videoUrl ? { url: listing.videoUrl, previewUrl: listing.videoUrl } : null,
    }),

  // Reset
  reset: () =>
    set({
      currentStep: 0,
      completedSteps: new Set(),
      draftListingId: null,
      proprietaire: { mode: 'EXISTING' },
      bien: {},
      annonce: {},
      equipements: { equipements: [] },
      equipementIds: [],
      conditions: {},
      tarifsPersonnes: [],
      tarifsNuits: [],
      photos: DEFAULT_PHOTOS,
      video: null,
    }),
}));
