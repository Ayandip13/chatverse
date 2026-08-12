import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  hydrateTheme: () => Promise<ThemeMode>;
}

const THEME_STORAGE_KEY = 'user_theme_preference';

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      console.warn('Storage setItem error:', e);
    }
  },
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: async (mode: ThemeMode) => {
    set({ theme: mode });
    await safeStorage.setItem(THEME_STORAGE_KEY, mode);
  },
  toggleTheme: async () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    await get().setTheme(nextTheme);
  },
  hydrateTheme: async () => {
    const savedTheme = await safeStorage.getItem(THEME_STORAGE_KEY);
    const initialTheme: ThemeMode = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
    set({ theme: initialTheme });
    return initialTheme;
  },
}));
