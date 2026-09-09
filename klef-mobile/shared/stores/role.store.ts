import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { UserRole } from '../contracts';

interface RoleState {
  activeRole: UserRole;
  estProprietaire: boolean;
  estGestionnaire: boolean;
  setActiveRole: (role: UserRole) => Promise<void>;
  setFlags: (flags: { estProprietaire: boolean; estGestionnaire?: boolean }) => void;
  loadRole: () => Promise<void>;
}

const SECURE_KEY_ROLE = 'klef_active_role';

export const useRoleStore = create<RoleState>((set, get) => ({
  activeRole: 'LOCATAIRE',
  estProprietaire: false,
  estGestionnaire: false,

  setActiveRole: async (role: UserRole) => {
    set({ activeRole: role });
    try {
      await SecureStore.setItemAsync(SECURE_KEY_ROLE, role);
    } catch (err) {
      console.warn('[RoleStore] Erreur d\'écriture SecureStore :', err);
    }
  },

  setFlags: (flags) => {
    set({
      estProprietaire: flags.estProprietaire,
      estGestionnaire: flags.estGestionnaire ?? false,
    });
  },

  loadRole: async () => {
    try {
      const savedRole = await SecureStore.getItemAsync(SECURE_KEY_ROLE);
      if (savedRole && ['LOCATAIRE', 'PROPRIETAIRE', 'GESTIONNAIRE', 'ADMIN'].includes(savedRole)) {
        set({ activeRole: savedRole as UserRole });
      }
    } catch (err) {
      console.warn('[RoleStore] Erreur de lecture SecureStore :', err);
    }
  },
}));
