import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo' ||
  Constants.appOwnership === 'expo';

// Configure foreground notification behavior safely only outside Expo Go (Development Builds & Production)
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    // Ignored in environments where setNotificationHandler is unavailable
  }
}

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // In Expo SDK 53+, remote push notifications are not supported in Expo Go.
    // Gracefully bypass push notification registration when running in Expo Go.
    if (isExpoGo) {
      return;
    }

    if (!isAuthenticated) return;

    let isMounted = true;

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token && isMounted) {
          setExpoPushToken(token);
          // Post push token to backend API
          apiClient
            .post('/users/push-token', { pushToken: token })
            .catch((err) => console.log('Failed to save push token on backend:', err.message));
        }
      })
      .catch((err) => {
        console.log('[PushNotifications] Push registration failed:', err?.message || err);
      });

    try {
      // Listener when a notification is received in foreground
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        console.log('Push Notification Received:', notification);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      });

      // Listener when user taps on a notification
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Push Notification Clicked:', response.notification.request.content.data);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      });
    } catch (err: any) {
      console.log('[PushNotifications] Failed to add notification listeners:', err?.message || err);
    }

    return () => {
      isMounted = false;
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (e) {
        // Ignored
      }
    };
  }, [isAuthenticated, queryClient]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || isExpoGo) return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ec4899',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Permission not granted for push notifications');
        return null;
      }

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      return tokenData.data;
    } else {
      console.log('Must use physical device for Push Notifications');
      return null;
    }
  } catch (error: any) {
    console.log('Push notification registration error:', error?.message || error);
    return null;
  }
}
