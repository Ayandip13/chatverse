import { create } from 'zustand';

interface ChatUIState {
  activeChatId: string | null;
  typingUsers: Record<string, boolean>; // chatId -> boolean
  adTimerStartedAt: number | null;
  setActiveChatId: (id: string | null) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
  clearTyping: () => void;
  startAdTimerIfNeeded: () => void;
  resetAdTimer: () => void;
}

export const useChatStore = create<ChatUIState>((set, get) => ({
  activeChatId: null,
  typingUsers: {},
  adTimerStartedAt: null,
  
  setActiveChatId: (id) => set({ activeChatId: id }),
  
  setTyping: (chatId, isTyping) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [chatId]: isTyping
    }
  })),

  clearTyping: () => set({ typingUsers: {} }),

  startAdTimerIfNeeded: () => {
    if (get().adTimerStartedAt === null) {
      set({ adTimerStartedAt: Date.now() });
    }
  },

  resetAdTimer: () => set({ adTimerStartedAt: null }),
}));
