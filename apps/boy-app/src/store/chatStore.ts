import { create } from 'zustand';

interface ChatUIState {
  activeChatId: string | null;
  typingUsers: Record<string, boolean>; // chatId -> boolean
  setActiveChatId: (id: string | null) => void;
  setTyping: (chatId: string, isTyping: boolean) => void;
  clearTyping: () => void;
}

export const useChatStore = create<ChatUIState>((set) => ({
  activeChatId: null,
  typingUsers: {},
  
  setActiveChatId: (id) => set({ activeChatId: id }),
  
  setTyping: (chatId, isTyping) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [chatId]: isTyping
    }
  })),

  clearTyping: () => set({ typingUsers: {} }),
}));
