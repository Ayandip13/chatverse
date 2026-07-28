import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const getAuthStore = () => require('../store/authStore').useAuthStore;

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.105:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = getAuthStore().getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const getStorage = Platform.OS === 'web' ? localStorage : SecureStore;
        const refreshToken = await (Platform.OS === 'web'
          ? getStorage.getItem('refreshToken')
          : (getStorage as typeof SecureStore).getItemAsync('refreshToken'));

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Direct request to refresh endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = response.data.data;

        await (Platform.OS === 'web'
          ? getStorage.setItem('accessToken', accessToken)
          : (getStorage as typeof SecureStore).setItemAsync('accessToken', accessToken));

        getAuthStore().setState({ accessToken });

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        getAuthStore().getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!error.response) {
      getAuthStore().setState({ isOffline: true });
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: any, fallbackMessage: string = 'An unexpected error occurred'): string => {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (typeof error?.response?.data === 'string') {
    return error.response.data;
  }
  if (error?.message && typeof error.message === 'string' && !error.message.includes('status code')) {
    return error.message;
  }
  return fallbackMessage;
};

export default apiClient;
