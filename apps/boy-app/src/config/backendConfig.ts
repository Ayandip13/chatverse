import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const PRODUCTION_API_URL = 'https://chatverse-1yza.onrender.com/api/v1';
export const PRODUCTION_SOCKET_URL = 'https://chatverse-1yza.onrender.com';
export const DEFAULT_LOCAL_HOST = '192.168.1.106:5000';

export const BACKEND_MODE_KEY = 'chatverse_backend_mode';
export const LOCAL_HOST_KEY = 'chatverse_local_host';

export type BackendMode = 'production' | 'local';

let cachedApiUrl: string = PRODUCTION_API_URL;
let cachedSocketUrl: string = PRODUCTION_SOCKET_URL;

// In-memory fallback store to ensure instant sync & reliability across platforms
const memoryStorage: Record<string, string> = {};

const configStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (memoryStorage[key] !== undefined) {
      return memoryStorage[key];
    }
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          const val = window.localStorage.getItem(key);
          if (val !== null) {
            memoryStorage[key] = val;
            return val;
          }
        }
      } else {
        const val = await SecureStore.getItemAsync(key);
        if (val !== null) {
          memoryStorage[key] = val;
          return val;
        }
      }
    } catch (e) {
      // Fall through
    }
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) {
        memoryStorage[key] = val;
        return val;
      }
    } catch (e) {
      // Fall through
    }
    return null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage[key] = value;
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {}
    } else {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (e) {}
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {}
  }
};

function formatLocalHost(inputHost?: string | null): { apiUrl: string; socketUrl: string } {
  const rawHost = inputHost && inputHost.trim() ? inputHost.trim() : DEFAULT_LOCAL_HOST;
  let host = rawHost;
  let protocol = 'http://';

  if (host.startsWith('https://')) {
    protocol = 'https://';
    host = host.slice(8);
  } else if (host.startsWith('http://')) {
    protocol = 'http://';
    host = host.slice(7);
  }

  // Remove trailing slashes and any trailing /api/v1
  host = host.replace(/\/+$/, '');
  if (host.endsWith('/api/v1')) {
    host = host.slice(0, -7);
  }
  host = host.replace(/\/+$/, '');

  if (!host) {
    host = DEFAULT_LOCAL_HOST;
  }

  const socketUrl = `${protocol}${host}`;
  const apiUrl = `${socketUrl}/api/v1`;

  return { apiUrl, socketUrl };
}

export async function getBackendMode(): Promise<BackendMode> {
  try {
    const mode = await configStorage.getItem(BACKEND_MODE_KEY);
    return mode === 'local' ? 'local' : 'production';
  } catch (error) {
    return 'production';
  }
}

export async function getLocalHost(): Promise<string> {
  try {
    const host = await configStorage.getItem(LOCAL_HOST_KEY);
    return host || DEFAULT_LOCAL_HOST;
  } catch (error) {
    return DEFAULT_LOCAL_HOST;
  }
}

export async function initBackendConfig(): Promise<{ apiUrl: string; socketUrl: string }> {
  try {
    const mode = await getBackendMode();
    if (mode === 'local') {
      const host = await getLocalHost();
      const { apiUrl, socketUrl } = formatLocalHost(host);
      cachedApiUrl = apiUrl;
      cachedSocketUrl = socketUrl;
      return { apiUrl, socketUrl };
    }
  } catch (error) {
    console.warn('Failed to initialize backend config:', error);
  }
  cachedApiUrl = PRODUCTION_API_URL;
  cachedSocketUrl = PRODUCTION_SOCKET_URL;
  return { apiUrl: PRODUCTION_API_URL, socketUrl: PRODUCTION_SOCKET_URL };
}

// Auto initialize on module load
initBackendConfig().catch(() => {});

export async function getApiBaseUrl(): Promise<string> {
  try {
    const mode = await getBackendMode();
    if (mode === 'local') {
      const host = await getLocalHost();
      const { apiUrl, socketUrl } = formatLocalHost(host);
      cachedApiUrl = apiUrl;
      cachedSocketUrl = socketUrl;
      return apiUrl;
    }
  } catch (error) {
    console.warn('Failed to get API base URL:', error);
  }
  cachedApiUrl = PRODUCTION_API_URL;
  cachedSocketUrl = PRODUCTION_SOCKET_URL;
  return PRODUCTION_API_URL;
}

export async function getSocketBaseUrl(): Promise<string> {
  try {
    const mode = await getBackendMode();
    if (mode === 'local') {
      const host = await getLocalHost();
      const { apiUrl, socketUrl } = formatLocalHost(host);
      cachedApiUrl = apiUrl;
      cachedSocketUrl = socketUrl;
      return socketUrl;
    }
  } catch (error) {
    console.warn('Failed to get socket base URL:', error);
  }
  cachedApiUrl = PRODUCTION_API_URL;
  cachedSocketUrl = PRODUCTION_SOCKET_URL;
  return PRODUCTION_SOCKET_URL;
}

export async function setBackendMode(mode: BackendMode, localHost?: string): Promise<void> {
  try {
    const targetHost = localHost && localHost.trim() ? localHost.trim() : DEFAULT_LOCAL_HOST;
    await configStorage.setItem(BACKEND_MODE_KEY, mode);
    await configStorage.setItem(LOCAL_HOST_KEY, targetHost);

    if (mode === 'local') {
      const { apiUrl, socketUrl } = formatLocalHost(targetHost);
      cachedApiUrl = apiUrl;
      cachedSocketUrl = socketUrl;
    } else {
      cachedApiUrl = PRODUCTION_API_URL;
      cachedSocketUrl = PRODUCTION_SOCKET_URL;
    }
  } catch (error) {
    console.warn('Failed to save backend mode to config storage:', error);
  }
}

export function getCachedApiBaseUrl(): string {
  return cachedApiUrl;
}

export function getCachedSocketBaseUrl(): string {
  return cachedSocketUrl;
}


