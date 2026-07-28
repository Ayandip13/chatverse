import { Stack, Redirect, usePathname } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { SplashScreen } from '../../src/components/ui/SplashScreen';

export default function AuthLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const pathname = usePathname();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (isAuthenticated && user) {
    if (user.status === 'APPROVED') {
      return <Redirect href="/(app)/dashboard" />;
    }

    const authFormPaths = [
      '/(auth)/login',
      '/(auth)/register',
      '/(auth)/forgot-password',
      '/login',
      '/register',
      '/forgot-password'
    ];

    if (authFormPaths.includes(pathname)) {
      if (user.status === 'PENDING') return <Redirect href="/(auth)/pending-verification" />;
      if (user.status === 'REJECTED') return <Redirect href="/(auth)/account-rejected" />;
      if (user.status === 'SUSPENDED' || user.status === 'BANNED') return <Redirect href="/(auth)/account-suspended" />;
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="pending-verification" />
      <Stack.Screen name="account-rejected" />
      <Stack.Screen name="account-suspended" />
    </Stack>
  );
}
