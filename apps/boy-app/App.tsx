import { View } from 'react-native';
import { QueryProvider } from './src/providers/QueryProvider';
import { SocketProvider } from './src/providers/SocketProvider';
import { useEffect } from 'react';
import { useAuthStore } from './src/store/authStore';
import { SplashScreen } from './src/components/ui/SplashScreen';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { NavigationContainer } from '@react-navigation/native';
import { initBackendConfig } from './src/config/backendConfig';

import './global.css'; // NativeWind v4 requires this

import { useColorScheme } from 'nativewind';

export default function App() {
  const { setColorScheme } = useColorScheme();
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    setColorScheme('light');
    initBackendConfig();
    hydrateAuth();
  }, []);

  return (
    <QueryProvider>
      <SocketProvider>
        <StatusBar style="auto" />
        <NavigationContainer>
          <View style={{ flex: 1 }}>
            <RootNavigator />
          </View>
        </NavigationContainer>
      </SocketProvider>
    </QueryProvider>
  );
}

import { registerRootComponent } from 'expo';
registerRootComponent(App);
