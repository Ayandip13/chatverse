import AsyncStorage from '@react-native-async-storage/async-storage';

export const PRODUCTION_API_URL = 'https://chatverse-1yza.onrender.com/api/v1';
export const PRODUCTION_SOCKET_URL = 'https://chatverse-1yza.onrender.com';

export const BACKEND_MODE_KEY = '@chatverse/backend_mode';
export const LOCAL_HOST_KEY = '@chatverse/local_host';

export type BackendMode = 'production' | 'local';

let cachedApiUrl: string = PRODUCTION_API_URL;
let cachedSocketUrl: string = PRODUCTION_SOCKET_URL;

function formatLocalHost(inputHost?: string | null): { apiUrl: string; socketUrl: string } {
  if (!inputHost || !inputHost.trim()) {
    return { apiUrl: PRODUCTION_API_URL, socketUrl: PRODUCTION_SOCKET_URL };
  }

  let host = inputHost.trim();
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
    return { apiUrl: PRODUCTION_API_URL, socketUrl: PRODUCTION_SOCKET_URL };
  }

  const socketUrl = `${protocol}${host}`;
  const apiUrl = `${socketUrl}/api/v1`;

  return { apiUrl, socketUrl };
}

export async function getBackendMode(): Promise<BackendMode> {
  try {
    const mode = await AsyncStorage.getItem(BACKEND_MODE_KEY);
    return mode === 'local' ? 'local' : 'production';
  } catch (error) {
    return 'production';
  }
}

export async function getLocalHost(): Promise<string> {
  try {
    const host = await AsyncStorage.getItem(LOCAL_HOST_KEY);
    return host || '';
  } catch (error) {
    return '';
  }
}

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
    // Fallback to production if AsyncStorage throws
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
    // Fallback to production if AsyncStorage throws
  }
  cachedApiUrl = PRODUCTION_API_URL;
  cachedSocketUrl = PRODUCTION_SOCKET_URL;
  return PRODUCTION_SOCKET_URL;
}

export async function setBackendMode(mode: BackendMode, localHost?: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BACKEND_MODE_KEY, mode);
    if (localHost !== undefined) {
      await AsyncStorage.setItem(LOCAL_HOST_KEY, localHost.trim());
    }

    if (mode === 'local') {
      const targetHost = localHost !== undefined ? localHost : await getLocalHost();
      const { apiUrl, socketUrl } = formatLocalHost(targetHost);
      cachedApiUrl = apiUrl;
      cachedSocketUrl = socketUrl;
    } else {
      cachedApiUrl = PRODUCTION_API_URL;
      cachedSocketUrl = PRODUCTION_SOCKET_URL;
    }
  } catch (error) {
    console.warn('Failed to save backend mode to AsyncStorage:', error);
  }
}

export function getCachedApiBaseUrl(): string {
  return cachedApiUrl;
}

export function getCachedSocketBaseUrl(): string {
  return cachedSocketUrl;
}
