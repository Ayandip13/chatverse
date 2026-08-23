import { View } from 'react-native';
import { QueryProvider } from './src/providers/QueryProvider';
import { SocketProvider } from './src/providers/SocketProvider';
import { useEffect } from 'react';
import { useAuthStore } from './src/store/authStore';
import { SplashScreen } from './src/components/ui/SplashScreen';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
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
      background: isDark ? '#111827' : '#F3F4F6',
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <View style={{ flex: 1, backgroundColor: isDark ? '#111827' : '#F3F4F6' }}>
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
