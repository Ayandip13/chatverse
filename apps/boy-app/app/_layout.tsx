import { Stack } from 'expo-router';
import { QueryProvider } from '../src/providers/QueryProvider';
import { SocketProvider } from '../src/providers/SocketProvider';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/authStore';
import { StatusBar } from 'expo-status-bar';

import '../global.css'; // NativeWind v4 requires this

export default function RootLayout() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, []);

  return (
    <QueryProvider>
      <SocketProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </SocketProvider>
    </QueryProvider>
  );
}
