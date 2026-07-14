import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { SplashScreen } from '../../src/components/ui/SplashScreen';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
