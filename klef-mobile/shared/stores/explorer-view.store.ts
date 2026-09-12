import { create } from 'zustand';

interface ExplorerViewState {
  viewMode: 'list' | 'map';
  toggleViewMode: () => void;
  setViewMode: (mode: 'list' | 'map') => void;
}

export const useExplorerViewStore = create<ExplorerViewState>((set) => ({
  viewMode: 'list',
  toggleViewMode: () =>
    set((state) => ({ viewMode: state.viewMode === 'list' ? 'map' : 'list' })),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
