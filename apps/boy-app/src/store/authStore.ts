import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  walletBalance?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOffline: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  logout: () => Promise<void>;
  hydrateAuth: () => Promise<void>;
  setOfflineStatus: (status: boolean) => void;
}

// Fallback for web (if we ever run this via Expo Web)
const storage = {
  setItemAsync: async (key: string, value: string) => {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  getItemAsync: async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  deleteItemAsync: async (key: string) => {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isOffline: false,

  setAuth: async (user, accessToken, refreshToken) => {
    try {
      await storage.setItemAsync('accessToken', accessToken);
      await storage.setItemAsync('refreshToken', refreshToken);
      await storage.setItemAsync('user', JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true });
    } catch (error) {
      console.error('Failed to save auth state securely', error);
    }
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      storage.setItemAsync('user', JSON.stringify(newUser)).catch(console.error);
      return { user: newUser };
    });
  },

  logout: async () => {
    try {
      await storage.deleteItemAsync('accessToken');
      await storage.deleteItemAsync('refreshToken');
      await storage.deleteItemAsync('user');
      set({ user: null, accessToken: null, isAuthenticated: false });
    } catch (error) {
      console.error('Failed to clear auth state', error);
    }
  },

  hydrateAuth: async () => {
    try {
      const accessToken = await storage.getItemAsync('accessToken');
      const userStr = await storage.getItemAsync('user');
      
      if (accessToken && userStr) {
        set({ 
          user: JSON.parse(userStr), 
          accessToken, 
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },
  
  setOfflineStatus: (status) => set({ isOffline: status }),
}));
