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
import { useThemeStore } from './src/store/themeStore';

function MainAppContent() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme);
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    initBackendConfig();
    hydrateAuth();
    hydrateTheme().then((initialTheme) => {
      setColorScheme(initialTheme);
    });
  }, []);

  useEffect(() => {
    if (colorScheme !== theme) {
      setColorScheme(theme);
    }
  }, [theme, colorScheme]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <RootNavigator />
        </View>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <SocketProvider>
        <MainAppContent />
      </SocketProvider>
    </QueryProvider>
  );
}

import { registerRootComponent } from 'expo';
registerRootComponent(App);
