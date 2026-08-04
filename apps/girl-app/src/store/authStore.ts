import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import apiClient from "../api/apiClient";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "BANNED" | string;
  avatar?: string;
  bio?: string;
  languagePreference?: string;
  walletBalance?: number;
  averageRating?: number;
  totalRatings?: number;
  rejectionReason?: string;
  statusReason?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOffline: boolean;
  setAuth: (
    user: User,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  checkAccountStatus: () => Promise<User | null>;
  logout: () => Promise<void>;
  hydrateAuth: () => Promise<void>;
  setOfflineStatus: (status: boolean) => void;
}

const storage = {
  setItemAsync: async (key: string, value: string) => {
    if (Platform.OS === "web") localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  getItemAsync: async (key: string) => {
    if (Platform.OS === "web") return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  deleteItemAsync: async (key: string) => {
    if (Platform.OS === "web") localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isOffline: false,

  setAuth: async (user, accessToken, refreshToken) => {
    try {
      await storage.setItemAsync("accessToken", accessToken);
      await storage.setItemAsync("refreshToken", refreshToken);
      await storage.setItemAsync("user", JSON.stringify(user));
      set({ user, accessToken, isAuthenticated: true, isOffline: false });
    } catch (error) {
      console.error("Failed to save auth state securely", error);
    }
  },

  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      storage
        .setItemAsync("user", JSON.stringify(newUser))
        .catch(console.error);
      return { user: newUser };
    });
  },

  checkAccountStatus: async () => {
    try {
      const response = await apiClient.get("/users/me");
      const latestUser = response.data.data;
      if (latestUser) {
        get().updateUser(latestUser);
        return latestUser;
      }
      return null;
    } catch (error) {
      console.error("Failed to refresh user profile status:", error);
      return null;
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout").catch(() => {});
    } catch (e) {
      // Ignore logout request failure
    } finally {
      try {
        await storage.deleteItemAsync("accessToken");
        await storage.deleteItemAsync("refreshToken");
        await storage.deleteItemAsync("user");
      } catch (err) {
        console.error("Failed to clear storage:", err);
      }
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  hydrateAuth: async () => {
    try {
      const accessToken = await storage.getItemAsync("accessToken");
      const userStr = await storage.getItemAsync("user");

      if (accessToken && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Background sync latest user status
        apiClient
          .get("/users/me")
          .then((res) => {
            if (res.data?.data) {
              set({ user: res.data.data });
              storage
                .setItemAsync("user", JSON.stringify(res.data.data))
                .catch(() => {});
            }
          })
          .catch(() => {});
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  setOfflineStatus: (status) => set({ isOffline: status }),
}));
