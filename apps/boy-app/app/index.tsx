import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // The root index redirects to app or auth based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(app)/home" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}
