import { create } from 'zustand';

export type ExplorerViewMode = 'video' | 'map' | 'list';

interface ExplorerViewState {
  viewMode: ExplorerViewMode;
  setViewMode: (mode: ExplorerViewMode) => void;
}

/** Onglet d'Explorer : Vidéos (logements filmés) | Carte | Liste. Liste par défaut, la plus légère en données. */
export const useExplorerViewStore = create<ExplorerViewState>((set) => ({
  viewMode: 'list',
  setViewMode: (mode) => set({ viewMode: mode }),
}));
