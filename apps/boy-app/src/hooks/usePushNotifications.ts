import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { useAuthStore } from '../store/authStore';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo' ||
  Constants.appOwnership === 'expo';

// IMPORTANT: expo-notifications must NOT be statically imported.
// Since SDK 53, merely importing it on Android runs an internal side-effect
// (DevicePushTokenAutoRegistration.fx.js) that logs a fatal-looking error
// the moment the module loads while running in Expo Go — before any of our
// isExpoGo guards below even get a chance to run. Loading it lazily via
// require(), only outside Expo Go, avoids that entirely.
let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications!.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications?.AndroidNotificationPriority?.MAX,
      }),
    });
  } catch (e) {
    // Ignored in environments where expo-notifications is unavailable
    Notifications = null;
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
    if (isExpoGo || !Notifications) {
      return;
    }

    if (!isAuthenticated) return;

    let isMounted = true;

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token && isMounted) {
          console.log('[BoyApp PushNotifications] Token acquired:', token);
          setExpoPushToken(token);
          // Post push token to backend API
          apiClient
            .post('/users/push-token', { pushToken: token })
            .then(() => console.log('[BoyApp PushNotifications] Token saved on backend successfully'))
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
        notificationListener.current?.remove();
        responseListener.current?.remove();
      } catch (e) {
        // Ignored
      }
    };
  }, [isAuthenticated, queryClient]);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || isExpoGo || !Notifications) return null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Messages & Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
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

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        '2b7cd740-81d0-4521-b8a6-a546dcf63c69';
      
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
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