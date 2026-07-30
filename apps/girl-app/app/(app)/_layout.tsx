import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { SocketProvider } from '../../src/providers/SocketProvider';
import { SplashScreen } from '../../src/components/ui/SplashScreen';

export default function AppLayout() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.status !== 'APPROVED') {
    switch (user.status) {
      case 'PENDING':
        return <Redirect href="/(auth)/pending-verification" />;
      case 'REJECTED':
        return <Redirect href="/(auth)/account-rejected" />;
      case 'SUSPENDED':
      case 'BANNED':
        return <Redirect href="/(auth)/account-suspended" />;
      default:
        return <Redirect href="/(auth)/pending-verification" />;
    }
  }

  return (
    <SocketProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="wallet/index" />
        <Stack.Screen name="wallet/withdraw" />
        <Stack.Screen name="wallet/history" />
      </Stack>
    </SocketProvider>
  );
}

