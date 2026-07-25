import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return null; // Layout splash screen will display during loading state
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Account status redirection logic
  switch (user.status) {
    case 'APPROVED':
      return <Redirect href="/(app)/dashboard" />;
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
