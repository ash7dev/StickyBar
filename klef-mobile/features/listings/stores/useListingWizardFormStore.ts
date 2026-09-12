import { create } from 'zustand';

export interface BienData {
  type: string;
  sousType: string;
  nombreChambres: number;
  nombreSallesBain: number;
  nombrePieces: number;
  capaciteMax: number;
  ville: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AnnonceData {
  titre: string;
  description: string;
  prixBase: number;
  nuitesMinimum: number;
  isInstantBooking?: boolean;
}

export interface ConditionsData {
  reglesMaison: string;
  instructionsAcces: string;
  nomReseauWifi: string;
  codeWifi: string;
  instructionsDigicode: string;
  regimeElectricite: 'INCLUS' | 'FORFAIT_RECHARGE' | 'WOYOFAL_LOCATAIRE' | 'FORFAIT' | 'COMPTEUR';
  detailsElectricite?: string;
}

export interface PhotoItem {
  uri: string;
  url?: string;
  estPrincipale: boolean;
  position: number;
  categorie?: string;
}

export interface VideoItem {
  uri: string;
  name?: string;
  duration?: number;
}

export interface TarifPersonnes {
  personnesMin: number;
  personnesMax: number;
  supplement: number;
}

export interface TarifNuits {
  nuitsMin: number;
  nuitsMax?: number | null;
  prix: number;
}

export interface ListingWizardFormState {
  currentStep: number;
  completedSteps: number[];
  draftListingId: string | null;

  bien: BienData;
  annonce: AnnonceData;
  equipements: string[];
  conditions: ConditionsData;
  tarifsPersonnes: TarifPersonnes[];
  tarifsNuits: TarifNuits[];
  photos: PhotoItem[];
  video?: VideoItem | null;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  markCompleted: (step: number) => void;
  setDraftListingId: (id: string | null) => void;

  updateBien: (data: Partial<BienData>) => void;
  updateAnnonce: (data: Partial<AnnonceData>) => void;
  toggleEquipement: (name: string) => void;
  updateConditions: (data: Partial<ConditionsData>) => void;
  addTarifPersonnes: (tarif: TarifPersonnes) => void;
  removeTarifPersonnes: (index: number) => void;
  addTarifNuits: (tarif: TarifNuits) => void;
  removeTarifNuits: (index: number) => void;
  addPhoto: (photo: { uri: string; categorie?: string }) => void;
  removePhoto: (index: number) => void;
  updatePhoto: (index: number, data: Partial<PhotoItem>) => void;
  setMainPhoto: (index: number) => void;
  setVideo: (video: VideoItem | null) => void;
  hydrateFromListing: (listing: any) => void;
  reset: () => void;
}

const DEFAULT_BIEN: BienData = {
  type: 'APPARTEMENT',
  sousType: 'Standard',
  nombreChambres: 2,
  nombreSallesBain: 2,
  nombrePieces: 3,
  capaciteMax: 4,
  ville: 'Dakar',
  adresse: '',
  latitude: null,
  longitude: null,
};

const DEFAULT_ANNONCE: AnnonceData = {
  titre: '',
  description: '',
  prixBase: 45000,
  nuitesMinimum: 1,
  isInstantBooking: true,
};

const DEFAULT_CONDITIONS: ConditionsData = {
  reglesMaison: 'Fêtes non autorisées. Respect du calme après 22h.',
  instructionsAcces: 'Accueil physique par l’hôte ou l’agent Klef.',
  nomReseauWifi: '',
  codeWifi: '',
  instructionsDigicode: '',
  regimeElectricite: 'INCLUS',
};

export const useListingWizardFormStore = create<ListingWizardFormState>((set, get) => ({
  currentStep: 0,
  completedSteps: [],
  draftListingId: null,

  bien: DEFAULT_BIEN,
  annonce: DEFAULT_ANNONCE,
  equipements: ['Climatisation', 'Wifi', 'Cuisine équipée', 'Sécurité 24/7'],
  conditions: DEFAULT_CONDITIONS,
  tarifsPersonnes: [],
  tarifsNuits: [],
  photos: [],

  setStep: (step: number) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    set({ currentStep: Math.min(5, currentStep + 1) });
  },

  prevStep: () => {
    const { currentStep } = get();
    set({ currentStep: Math.max(0, currentStep - 1) });
  },

  markCompleted: (step: number) => {
    const { completedSteps } = get();
    if (!completedSteps.includes(step)) {
      set({ completedSteps: [...completedSteps, step] });
    }
  },

  setDraftListingId: (id: string | null) => set({ draftListingId: id }),

  updateBien: (data) =>
    set((state) => ({ bien: { ...state.bien, ...data } })),

  updateAnnonce: (data) =>
    set((state) => ({ annonce: { ...state.annonce, ...data } })),

  toggleEquipement: (name: string) =>
    set((state) => {
      const exists = state.equipements.includes(name);
      return {
        equipements: exists
          ? state.equipements.filter((e) => e !== name)
          : [...state.equipements, name],
      };
    }),

  updateConditions: (data) =>
    set((state) => ({ conditions: { ...state.conditions, ...data } })),

  addTarifPersonnes: (tarif) =>
    set((state) => ({ tarifsPersonnes: [...state.tarifsPersonnes, tarif] })),

  removeTarifPersonnes: (index) =>
    set((state) => ({
      tarifsPersonnes: state.tarifsPersonnes.filter((_, i) => i !== index),
    })),

  addTarifNuits: (tarif) =>
    set((state) => ({ tarifsNuits: [...state.tarifsNuits, tarif] })),

  removeTarifNuits: (index) =>
    set((state) => ({
      tarifsNuits: state.tarifsNuits.filter((_, i) => i !== index),
    })),

  addPhoto: (item) =>
    set((state) => {
      const isFirst = state.photos.length === 0;
      const newPhoto: PhotoItem = {
        uri: item.uri,
        estPrincipale: isFirst,
        position: state.photos.length,
        categorie: item.categorie ?? 'AUTRE',
      };
      return { photos: [...state.photos, newPhoto] };
    }),

  removePhoto: (index) =>
    set((state) => {
      const newPhotos = state.photos.filter((_, i) => i !== index);
      // S'assurer qu'au moins une photo reste principale s'il reste des photos
      if (newPhotos.length > 0 && !newPhotos.some((p) => p.estPrincipale)) {
        newPhotos[0].estPrincipale = true;
      }
      return { photos: newPhotos };
    }),

  updatePhoto: (index, data) =>
    set((state) => ({
      photos: state.photos.map((p, i) => (i === index ? { ...p, ...data } : p)),
    })),

  setMainPhoto: (index) =>
    set((state) => ({
      photos: state.photos.map((p, i) => ({
        ...p,
        estPrincipale: i === index,
      })),
    })),

  setVideo: (video) => set({ video }),

  hydrateFromListing: (listing: any) => {
    if (!listing) return;

    const bien: BienData = {
      type: listing.typeLogement || listing.type || 'APPARTEMENT',
      sousType: listing.sousType || 'Standard',
      nombreChambres: listing.nombreChambres ?? 1,
      nombreSallesBain: listing.nombreSallesBain ?? 1,
      nombrePieces: listing.nombrePieces ?? 1,
      capaciteMax: listing.capaciteMax ?? 1,
      ville: listing.ville || 'Dakar',
      adresse: listing.adresse || '',
      latitude: listing.latitude ?? null,
      longitude: listing.longitude ?? null,
    };

    const annonce: AnnonceData = {
      titre: listing.titre || '',
      description: listing.description || '',
      prixBase: listing.prixBase ?? listing.prixNuit ?? 0,
      nuitesMinimum: listing.nuitesMinimum ?? 1,
      isInstantBooking: listing.isInstantBooking ?? true,
    };

    const equipements: string[] = Array.isArray(listing.equipements)
      ? listing.equipements.map((e: any) => (typeof e === 'string' ? e : e.nom || e.id))
      : [];

    const conditions: ConditionsData = {
      reglesMaison: listing.reglesMaison || '',
      instructionsAcces: listing.instructionsAcces || '',
      nomReseauWifi: listing.nomReseauWifi || '',
      codeWifi: listing.codeWifi || '',
      instructionsDigicode: listing.instructionsDigicode || '',
      regimeElectricite: listing.regimeElectricite || 'INCLUS',
      detailsElectricite: listing.detailsElectricite || '',
    };

    const tarifsPersonnes: TarifPersonnes[] = Array.isArray(listing.tarifsPersonnes)
      ? listing.tarifsPersonnes.map((t: any) => ({
          personnesMin: t.personnesMin,
          personnesMax: t.personnesMax,
          supplement: t.supplement,
        }))
      : [];

    const tarifsNuits: TarifNuits[] = Array.isArray(listing.tarifsNuits)
      ? listing.tarifsNuits.map((t: any) => ({
          nuitsMin: t.nuitsMin,
          nuitsMax: t.nuitsMax ?? null,
          prix: t.prix,
        }))
      : [];

    const photos: PhotoItem[] = Array.isArray(listing.photos)
      ? listing.photos.map((p: any, idx: number) => {
          const url = typeof p === 'string' ? p : p.url || '';
          return {
            uri: url,
            url,
            estPrincipale: typeof p === 'object' ? !!p.estPrincipale : idx === 0,
            position: typeof p === 'object' ? p.position ?? idx : idx,
            categorie: typeof p === 'object' ? p.categorie || 'AUTRE' : 'AUTRE',
          };
        })
      : [];

    const video: VideoItem | null = listing.videoUrl
      ? { uri: listing.videoUrl, name: 'Vidéo de présentation' }
      : null;

    set({
      draftListingId: listing.id,
      bien,
      annonce,
      equipements,
      conditions,
      tarifsPersonnes,
      tarifsNuits,
      photos,
      video,
      completedSteps: [0, 1, 2, 3, 4, 5],
    });
  },

  reset: () =>
    set({
      currentStep: 0,
      completedSteps: [],
      draftListingId: null,
      bien: DEFAULT_BIEN,
      annonce: DEFAULT_ANNONCE,
      equipements: ['Climatisation', 'Wifi', 'Cuisine équipée', 'Sécurité 24/7'],
      conditions: DEFAULT_CONDITIONS,
      tarifsPersonnes: [],
      tarifsNuits: [],
      photos: [],
      video: null,
    }),
}));
