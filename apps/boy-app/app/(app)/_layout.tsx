import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { SocketProvider } from '../../src/providers/SocketProvider';
import { SplashScreen } from '../../src/components/ui/SplashScreen';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <SocketProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="home" />
        <Stack.Screen name="search" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="chats" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="girl/[id]" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="recharge" />
        <Stack.Screen name="transactions" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="chat-requests" />
        <Stack.Screen name="help" />
        <Stack.Screen name="legal" />
      </Stack>
    </SocketProvider>
  );
}
