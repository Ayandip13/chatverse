import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { SplashScreen } from '../../src/components/ui/SplashScreen';

export default function AppLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/(auth)/login');
      return;
    }

    if (user.status !== 'APPROVED') {
      switch (user.status) {
        case 'PENDING':
          router.replace('/(auth)/pending-verification');
          break;
        case 'REJECTED':
          router.replace('/(auth)/account-rejected');
          break;
        case 'SUSPENDED':
        case 'BANNED':
          router.replace('/(auth)/account-suspended');
          break;
        default:
          router.replace('/(auth)/pending-verification');
          break;
      }
    }
  }, [isAuthenticated, user?.status, isLoading]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
