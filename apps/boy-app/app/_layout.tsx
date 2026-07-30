import { Stack } from 'expo-router';
import { View } from 'react-native';
import { QueryProvider } from '../src/providers/QueryProvider';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/authStore';
import { SplashScreen } from '../src/components/ui/SplashScreen';
import { StatusBar } from 'expo-status-bar';

import '../global.css'; // NativeWind v4 requires this

export default function RootLayout() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    hydrateAuth();
  }, []);

  return (
    <QueryProvider>
      <StatusBar style="auto" />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>

        {isLoading && (
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 999 }}>
            <SplashScreen />
          </View>
        )}
      </View>
    </QueryProvider>
  );
}
