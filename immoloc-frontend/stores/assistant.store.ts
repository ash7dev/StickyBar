import { create } from 'zustand';

interface OpenAssistantOptions {
  tab?: 'faq' | 'tickets';
  subject?: string;
  category?: string;
  reservationId?: string;
  logementId?: string;
  message?: string;
}

interface AssistantStore {
  isOpen: boolean;
  activeTab: 'faq' | 'tickets';
  initialSubject: string;
  initialCategory: string;
  initialReservationId?: string;
  initialLogementId?: string;
  initialMessage: string;
  showCreateForm: boolean;

  openAssistant: (options?: OpenAssistantOptions) => void;
  closeAssistant: () => void;
  setTab: (tab: 'faq' | 'tickets') => void;
}

export const useAssistantStore = create<AssistantStore>((set) => ({
  isOpen: false,
  activeTab: 'faq',
  initialSubject: '',
  initialCategory: 'RESERVATION',
  initialReservationId: undefined,
  initialLogementId: undefined,
  initialMessage: '',
  showCreateForm: false,

  openAssistant: (options) =>
    set({
      isOpen: true,
      activeTab: options?.tab || 'faq',
      initialSubject: options?.subject || '',
      initialCategory: options?.category || 'RESERVATION',
      initialReservationId: options?.reservationId,
      initialLogementId: options?.logementId,
      initialMessage: options?.message || '',
      showCreateForm: Boolean(options?.subject || options?.category || options?.message),
    }),

  closeAssistant: () =>
    set({
      isOpen: false,
    }),

  setTab: (tab) =>
    set({
      activeTab: tab,
    }),
}));
