import { View } from 'react-native';
import { QueryProvider } from './src/providers/QueryProvider';
import { SocketProvider } from './src/providers/SocketProvider';
import { useEffect } from 'react';
import { useAuthStore } from './src/store/authStore';
import { SplashScreen } from './src/components/ui/SplashScreen';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { initBackendConfig } from './src/config/backendConfig';

import './global.css'; // NativeWind v4 requires this

import { useColorScheme } from 'nativewind';
import { useThemeStore } from './src/store/themeStore';
import { usePushNotifications } from './src/hooks/usePushNotifications';

function MainAppContent() {
  usePushNotifications();
  const { colorScheme, setColorScheme } = useColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme);
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const isLoading = useAuthStore((state) => state.isLoading);

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

  const isDark = theme === 'dark';
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: isDark ? '#0F172A' : '#F8FAFC',
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <View style={{ flex: 1, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
          <RootNavigator />
          {isLoading && (
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 999 }}>
              <SplashScreen />
            </View>
          )}
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
