import { Stack, useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { SplashScreen } from '../../src/components/ui/SplashScreen';

export default function AuthLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (user.status === 'APPROVED') {
        router.replace('/(app)/dashboard');
        return;
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
        if (user.status === 'PENDING') router.replace('/(auth)/pending-verification');
        else if (user.status === 'REJECTED') router.replace('/(auth)/account-rejected');
        else if (user.status === 'SUSPENDED' || user.status === 'BANNED') router.replace('/(auth)/account-suspended');
      }
    }
  }, [isAuthenticated, user?.status, pathname, isLoading]);

  if (isLoading) {
    return <SplashScreen />;
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
